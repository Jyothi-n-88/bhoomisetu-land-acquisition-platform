import { GoogleGenAI } from '@google/genai';

export interface ExtractedOfficialData {
  officialName?: string;
  govEmployeeId?: string;
}

export class OcrHighDemandError extends Error {
  constructor(
    message = 'The document scanner is currently busy due to high traffic. Please try submitting again in a few minutes.'
  ) {
    super(message);
    this.name = 'OcrHighDemandError';
  }
}

/**
 * Determines whether an error returned from the Gemini API represents a 503 Service Unavailable,
 * high demand, or capacity-related error.
 */
export const is503Error = (error: any): boolean => {
  if (!error) return false;
  const status = error.status || error.code || error.error?.code || error.statusCode;
  if (status === 503 || status === 'UNAVAILABLE') return true;

  const msg = (error.message || '').toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('high demand') ||
    msg.includes('overloaded') ||
    msg.includes('capacity') ||
    msg.includes('temporarily unavailable')
  );
};

/**
 * OCR extraction prompt for official Government Identity Cards
 */
const OCR_PROMPT = `
You are an expert Government Official Credential Verification AI for BhoomiSetu (Govt. of India).
Examine the provided official Government Identity Card / Service Card image.
Extract the Official's full legal name and their official Government Employee ID / Service Number (e.g. format like 'DL/REV/SA/2026/0123' or similar).

STRICT INSTRUCTIONS:
1. Return ONLY a valid JSON object with EXACTLY these two keys:
{
  "officialName": "Full Name as printed on the card",
  "govEmployeeId": "Government Employee ID / Badge No / Service ID"
}
2. If any field cannot be found or the image is illegible, set that field value to null.
3. Do not include markdown code block syntax (no \`\`\`json). Output pure raw JSON only.
`;

/**
 * Invokes Gemini API with exponential backoff and jitter specifically for 503 / High Demand errors.
 * 
 * - Base wait: 2 seconds (2000 ms)
 * - Exponential backoff: doubles after each failure (2s, 4s, 8s, 16s, capped)
 * - Jitter: adds random fraction of a second to mitigate thundering herd
 * - Max retries: 5 attempts
 */
async function callModelWithBackoff(
  ai: GoogleGenAI,
  modelName: string,
  base64Data: string,
  mimeType: string,
  maxRetries = 5
): Promise<ExtractedOfficialData | null> {
  const baseWaitMs = 2000;
  const maxWaitMs = 16000;

  for (let retry = 0; retry <= maxRetries; retry++) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType,
                },
              },
              {
                text: OCR_PROMPT,
              },
            ],
          },
        ],
        config: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      });

      const textOutput = (response.text || '{}')
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const parsed = JSON.parse(textOutput);
      return parsed;
    } catch (err: any) {
      const isUnavailable = is503Error(err);

      // If it is a 503 high demand error and we haven't exhausted our 5 retries
      if (isUnavailable && retry < maxRetries) {
        // Truncated exponential backoff: 2s, 4s, 8s, 16s...
        const exponentialDelay = baseWaitMs * Math.pow(2, retry);
        const truncatedDelay = Math.min(exponentialDelay, maxWaitMs);
        // Small random fraction of a second jitter (e.g. 100 - 600 ms)
        const jitterMs = Math.floor(Math.random() * 500) + 100;
        const totalWaitMs = truncatedDelay + jitterMs;

        console.warn(
          `[OCR RETRY] Model: ${modelName} | Attempt: ${retry + 1}/${maxRetries} | Wait Time: ${totalWaitMs}ms | Reason: 503 High Demand / Capacity`
        );

        await new Promise((resolve) => setTimeout(resolve, totalWaitMs));
        continue;
      }

      // If non-503 or all retries exhausted for this model
      if (isUnavailable) {
        console.warn(
          `[OCR RETRY EXHAUSTED] Model: ${modelName} exhausted all ${maxRetries} retries with 503 UNAVAILABLE errors.`
        );
      } else {
        console.warn(
          `[OCR MODEL ERROR] Model: ${modelName} failed with non-503 error:`,
          err.message || err
        );
      }

      throw err;
    }
  }

  return null;
}

/**
 * Orchestrates OCR credential extraction with fallback cascade:
 * 1. Primary Model: gemini-3.6-flash (with up to 5 exponential backoff retries)
 * 2. Fallback Model: gemini-3.5-flash-lite (if primary exhausts retries or fails)
 * 3. Graceful failure: throws OcrHighDemandError with user-friendly message
 */
export async function extractOfficialIdFromImage(
  imageBuffer: Buffer,
  mimeType: string,
  apiKey: string
): Promise<ExtractedOfficialData> {
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'bhoomisetu-official-auth',
      },
    },
  });

  const base64Data = imageBuffer.toString('base64');
  const PRIMARY_MODEL = 'gemini-3.6-flash';
  const FALLBACK_MODEL = 'gemini-3.5-flash-lite';
  const MAX_RETRIES = 5;

  let primaryError: any = null;

  // Step 1: Attempt Primary Model with Exponential Backoff Retry Loop
  try {
    const primaryResult = await callModelWithBackoff(
      ai,
      PRIMARY_MODEL,
      base64Data,
      mimeType,
      MAX_RETRIES
    );

    if (primaryResult && (primaryResult.govEmployeeId || primaryResult.officialName)) {
      return primaryResult;
    }
  } catch (err: any) {
    primaryError = err;
    console.warn(
      `[OCR CASCADE] Primary model '${PRIMARY_MODEL}' failed after retries. Immediately cascading to fallback model '${FALLBACK_MODEL}'. Error:`,
      err?.message || err
    );
  }

  // Step 2: Fallback Model Cascade (gemini-3.5-flash-lite)
  let fallbackError: any = null;
  try {
    const fallbackResult = await callModelWithBackoff(
      ai,
      FALLBACK_MODEL,
      base64Data,
      mimeType,
      MAX_RETRIES
    );

    if (fallbackResult && (fallbackResult.govEmployeeId || fallbackResult.officialName)) {
      return fallbackResult;
    }
  } catch (err: any) {
    fallbackError = err;
    console.warn(
      `[OCR CASCADE] Fallback model '${FALLBACK_MODEL}' also failed. Error:`,
      err?.message || err
    );
  }

  // Step 3: Graceful Failure Handling
  const isHighDemand =
    is503Error(primaryError) ||
    is503Error(fallbackError) ||
    String(primaryError?.message).includes('503') ||
    String(fallbackError?.message).includes('503');

  if (isHighDemand) {
    throw new OcrHighDemandError(
      'The document scanner is currently busy due to high traffic. Please try submitting again in a few minutes.'
    );
  }

  throw (
    fallbackError ||
    primaryError ||
    new Error('The document scanner could not process the ID card image.')
  );
}
