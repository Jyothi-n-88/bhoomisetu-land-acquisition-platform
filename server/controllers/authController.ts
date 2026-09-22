import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { GoogleGenAI } from '@google/genai';
import User from '../models/User';
import OTP from '../models/OTP';
import PreAuthorizedOfficial from '../models/PreAuthorizedOfficial';
import { sendEmail } from '../utils/sendEmail';
import { AuthRequest } from '../middleware/authMiddleware';

// Generate JWT
const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

/**
 * Fuzzy/Normalized name matching helper
 * Compares two official names regardless of honorifics, extra whitespace, or case
 */
const isNameMatch = (nameA: string, nameB: string): boolean => {
  if (!nameA || !nameB) return false;
  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/\b(mr|mrs|ms|dr|shri|smt|officer)\b\.?/gi, '')
      .replace(/[^a-z0-9]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  const tokensA = clean(nameA);
  const tokensB = clean(nameB);

  if (tokensA.length === 0 || tokensB.length === 0) return false;

  // Exact match on normalized full string
  if (tokensA.join(' ') === tokensB.join(' ')) return true;

  // Check token intersection (e.g., "Rajesh Sharma" matches "Rajesh K. Sharma")
  const common = tokensA.filter((token) => tokensB.includes(token));
  return common.length >= Math.min(tokensA.length, tokensB.length);
};

// @desc    Register a new user with AI-driven pre-authorized official verification
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response, next?: NextFunction) => {
  // Reference to multer file buffer for guaranteed garbage collection cleanup
  let fileBufferRef: Buffer | null = req.file?.buffer || null;

  try {
    const { name, email, password, role, state, district, secretKey, verificationMode } = req.body;
    const idProofFile = req.file;

    // Determine verification gateway
    const isAiOcrMode = verificationMode === 'ai_ocr' || (!secretKey && !idProofFile) || (!!idProofFile);

    if (isAiOcrMode) {
      // 1. In AI OCR mode, uploaded ID card file is strictly required
      if (!idProofFile || !idProofFile.buffer || idProofFile.size === 0) {
        return res.status(403).json({
          success: false,
          message: 'Official Verification Required: Please upload your official Government Identity Card (idProof) for AI verification.',
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey.trim() === '') {
        return res.status(500).json({
          success: false,
          message: 'AI Gateway Error: GEMINI_API_KEY is not configured on the server.',
        });
      }

      let extractedData: { officialName?: string; govEmployeeId?: string } | null = null;

      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'bhoomisetu-official-auth',
            },
          },
        });

        const mimeType = idProofFile.mimetype || 'image/jpeg';
        const base64Data = idProofFile.buffer.toString('base64');

        const promptText = `
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

        // Multi-tier model fallback: gemini-3.1-flash-lite (fastest, high availability) -> gemini-3.1-pro-preview -> gemini-flash-latest -> gemini-3.8-flash
        const candidateModels = [
          'gemini-3.1-flash-lite',
          'gemini-3.1-pro-preview',
          'gemini-flash-latest',
          'gemini-3.8-flash',
        ];

        let lastModelError: any = null;

        for (const model of candidateModels) {
          // Retry each model once if encountering temporary 503 / 429
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              const response = await ai.models.generateContent({
                model,
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
                        text: promptText,
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
              extractedData = JSON.parse(textOutput);
              if (extractedData?.govEmployeeId) break;
            } catch (modelErr: any) {
              lastModelError = modelErr;
              const errMsg = modelErr.message || '';
              const isTransient =
                errMsg.includes('503') ||
                errMsg.includes('UNAVAILABLE') ||
                errMsg.includes('429') ||
                errMsg.includes('RESOURCE_EXHAUSTED') ||
                errMsg.includes('high demand');

              console.warn(
                `Gemini OCR model attempt with ${model} (attempt ${attempt + 1}) notice:`,
                errMsg
              );

              if (isTransient && attempt === 0) {
                // Brief jitter delay before retry, otherwise instantly rotate to next model
                await new Promise((resolve) => setTimeout(resolve, 400));
                continue;
              }
              break;
            }
          }
          if (extractedData?.govEmployeeId) break;
        }

        if (!extractedData && lastModelError) {
          const errMsg = lastModelError.message || '';
          if (
            errMsg.includes('503') ||
            errMsg.includes('UNAVAILABLE') ||
            errMsg.includes('high demand')
          ) {
            return res.status(503).json({
              success: false,
              message:
                'The AI OCR verification service is currently experiencing high demand. Please try uploading your ID again in a moment, or use your Official Secret Key.',
            });
          }
        }
      } catch (ocrError: any) {
        console.error('Gemini OCR verification execution failed:', ocrError);
        return res.status(403).json({
          success: false,
          message: 'AI Optical Verification failed: Unable to process or parse the official ID card image.',
        });
      }

      const extractedId = extractedData?.govEmployeeId?.trim();
      const extractedName = extractedData?.officialName?.trim();

      if (!extractedId || !extractedName) {
        return res.status(403).json({
          success: false,
          message: 'Official Verification Failed: Government Employee ID or Official Name could not be legibly recognized from the ID card.',
          extracted: { officialName: extractedName || null, govEmployeeId: extractedId || null },
        });
      }

      // Query PreAuthorizedOfficial collection
      const officialRecord = await PreAuthorizedOfficial.findOne({
        govEmployeeId: new RegExp(`^${extractedId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      });

      // Strict enforcement: if record does not exist, immediately exit with 403
      if (!officialRecord) {
        return res.status(403).json({
          success: false,
          message: `Verification Denied: Government Employee ID '${extractedId}' is not found in the national pre-authorized registry.`,
        });
      }

      // Strict enforcement: if official is inactive/revoked, immediately exit with 403
      if (!officialRecord.isActive) {
        return res.status(403).json({
          success: false,
          message: `Verification Denied: Official record for '${officialRecord.officialName}' (${officialRecord.govEmployeeId}) is inactive or revoked.`,
        });
      }

      // Verify that extracted name strongly matches the pre-authorized official name
      const nameMatchesDb = isNameMatch(extractedName, officialRecord.officialName);
      const nameMatchesForm = name ? isNameMatch(name, officialRecord.officialName) : true;

      if (!nameMatchesDb || !nameMatchesForm) {
        return res.status(403).json({
          success: false,
          message: `Identity Mismatch: The name on the ID card ('${extractedName}') does not match the pre-authorized record ('${officialRecord.officialName}').`,
        });
      }

      console.log(`AI Pre-Authorization Verified: Official ${officialRecord.officialName} [${officialRecord.govEmployeeId}] approved.`);
    } else {
      // Secret Key Mode verification fallback
      const expectedSecretKey = process.env.REGISTRATION_SECRET_KEY || 'BHOOMISETU_OFFICIAL_2026';
      if (!secretKey || secretKey.trim() !== expectedSecretKey.trim()) {
        return res.status(403).json({
          success: false,
          message: 'Official Verification Required: Invalid official registration key. Please upload a valid Government ID card or provide an authorized key.',
        });
      }
    }

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, role',
      });
    }

    // Role-based Location Validation
    if (role === 'STATE_AUTHORITY') {
      if (!state || !state.trim()) {
        return res.status(400).json({
          success: false,
          message: 'State is mandatory for State Authority registration.',
        });
      }
    } else if (role === 'DISTRICT_AUTHORITY' || role === 'FIELD_OFFICER') {
      if (!state || !state.trim()) {
        return res.status(400).json({
          success: false,
          message: `State is mandatory for ${role.replace('_', ' ')} registration.`,
        });
      }
      if (!district || !district.trim()) {
        return res.status(400).json({
          success: false,
          message: `District is mandatory for ${role.replace('_', ' ')} registration.`,
        });
      }
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Pre-hash password before saving into temporary OTP registration record
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate 6-digit secure numeric OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();

    // Upsert or create temporary registration OTP record (Users collection remains untouched)
    await OTP.deleteMany({ email });
    await OTP.create({
      email,
      otp: otpCode,
      tempUserData: {
        name,
        password: hashedPassword,
        role,
        state: role === 'CENTRAL_AUTHORITY' ? undefined : state?.trim(),
        district: (role === 'DISTRICT_AUTHORITY' || role === 'FIELD_OFFICER') ? district?.trim() : undefined,
      },
    });

    // Explicit development visibility for testing if SMTP is slow/misconfigured
    console.log('>>> REGISTRATION OTP for', email, 'IS:', otpCode);

    // Send Email (graceful handling if SMTP network is unreachable)
    await sendEmail({
      email,
      subject: 'BhoomiSetu Official Registration OTP',
      message: `Your OTP for completing the BhoomiSetu official registration is: ${otpCode}. This code will expire in 5 minutes.`,
    });

    res.status(201).json({
      success: true,
      message: 'Registration initiated with verified official identity. OTP sent to email.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    // Explicitly dereference and wipe the buffer from RAM memory to guarantee swift garbage collection
    if (req.file) {
      req.file.buffer = Buffer.alloc(0);
    }
    fileBufferRef = null;
  }
};

// @desc    Verify OTP for email registration
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create user ONLY NOW using the verified temporary registration data
      if (!otpRecord.tempUserData || !otpRecord.tempUserData.name) {
        return res.status(400).json({
          success: false,
          message: 'Registration session expired or missing registration details. Please register again.',
        });
      }

      const { name, password, role, state, district } = otpRecord.tempUserData;

      user = new User({
        name,
        email,
        password, // already hashed
        role,
        state: role === 'CENTRAL_AUTHORITY' ? undefined : state?.trim(),
        district: (role === 'DISTRICT_AUTHORITY' || role === 'FIELD_OFFICER') ? district?.trim() : undefined,
        authProvider: 'local',
        isVerified: true,
      });

      // Avoid double hashing already-hashed password
      user.isModified = function (field: string) {
        if (field === 'password') return false;
        return User.prototype.isModified.call(this, field);
      };

      await user.save();
    } else {
      user.isVerified = true;
      await user.save();
    }

    // Delete consumed OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        state: user.state,
        district: user.district,
      },
      token: generateToken(user._id.toString()),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    SSO Login (Google / Microsoft)
// @route   POST /api/auth/sso-login
// @access  Public
export const ssoLogin = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required for SSO login',
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found. Please register as a new official.',
      });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        state: user.state,
        district: user.district,
      },
      token: generateToken(user._id.toString()),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    SSO Register with Official Secret Key
// @route   POST /api/auth/sso-register
// @access  Public
export const ssoRegister = async (req: Request, res: Response, next?: NextFunction) => {
  try {
    const { name, email, role, state, district, secretKey, provider } = req.body;

    // Validate official secret key
    const expectedSecretKey = process.env.REGISTRATION_SECRET_KEY || 'BHOOMISETU_OFFICIAL_2026';
    if (!secretKey || secretKey.trim() !== expectedSecretKey.trim()) {
      return res.status(403).json({
        success: false,
        message: 'Invalid official secret key. Registration is invite-only for authorized officials.',
      });
    }

    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, role',
      });
    }

    // Role-based Location Validation
    if (role === 'STATE_AUTHORITY') {
      if (!state || !state.trim()) {
        return res.status(400).json({
          success: false,
          message: 'State is mandatory for State Authority registration.',
        });
      }
    } else if (role === 'DISTRICT_AUTHORITY' || role === 'FIELD_OFFICER') {
      if (!state || !state.trim()) {
        return res.status(400).json({
          success: false,
          message: `State is mandatory for ${role.replace('_', ' ')} registration.`,
        });
      }
      if (!district || !district.trim()) {
        return res.status(400).json({
          success: false,
          message: `District is mandatory for ${role.replace('_', ' ')} registration.`,
        });
      }
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create SSO user without traditional password (automatically verified)
    const user = await User.create({
      name,
      email,
      role,
      state: role === 'CENTRAL_AUTHORITY' ? undefined : state?.trim(),
      district: (role === 'DISTRICT_AUTHORITY' || role === 'FIELD_OFFICER') ? district?.trim() : undefined,
      authProvider: 'google',
      isVerified: true,
    });

    if (user) {
      res.status(201).json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          state: user.state,
          district: user.district,
        },
        token: generateToken(user._id.toString()),
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user: any = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: 'Please verify your email using the OTP sent during registration.' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        state: user.state,
        district: user.district,
      },
      token: generateToken(user._id.toString()),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout user (optional - clientside handles token mostly)
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};
