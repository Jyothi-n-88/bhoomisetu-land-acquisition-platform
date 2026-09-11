/**
 * Shared API utilities for safe network requests, header formatting,
 * and robust HTML / non-JSON error handling.
 */

export const getHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('bhoomisetu_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Parses API fetch responses safely, shielding the application from
 * "Unexpected token '<'" JSON parse crashes when proxies or gateways return HTML.
 */
export const handleApiResponse = async <T = any>(
  response: Response,
  defaultErrorMessage = 'Request failed'
): Promise<T> => {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.toLowerCase().includes('application/json');

  if (!response.ok) {
    // Intercept 401 Unauthorized globally to clear session and redirect
    if (response.status === 401) {
      localStorage.removeItem('bhoomisetu_token');
      localStorage.removeItem('bhoomisetu_user');
      window.location.href = '/login';
      // Return a never-resolving promise to halt execution and avoid console errors during redirect
      return new Promise(() => {}) as Promise<T>;
    }

    if (isJson) {
      try {
        const errorData = await response.json();
        const msg =
          errorData.message ||
          errorData.error ||
          errorData.detail ||
          `${defaultErrorMessage} (HTTP ${response.status})`;
        throw new Error(msg);
      } catch (jsonErr: any) {
        if (jsonErr.message && !jsonErr.message.includes('Unexpected token') && !jsonErr.message.includes('JSON')) {
          throw jsonErr;
        }
      }
    }

    // Response is NOT JSON (e.g., 403 Forbidden HTML from proxy, firewall, or cloud environment)
    if (response.status === 403) {
      throw new Error(
        'Server routing or authentication error (403 Forbidden): Access denied. Please ensure you are logged in with Central or State authority privileges.'
      );
    } else if (response.status === 404) {
      throw new Error(
        'Server routing error (404 Not Found): The requested API route could not be reached.'
      );
    } else if (response.status >= 500) {
      throw new Error(
        `Server error (HTTP ${response.status}): The backend encountered an issue. Please verify backend status.`
      );
    } else {
      throw new Error(
        `Server routing or network error (HTTP ${response.status}): Expected JSON response but received non-JSON payload.`
      );
    }
  }

  // Response status is 2xx, but verify it is valid JSON
  if (!isJson) {
    throw new Error(
      'Server routing error: Expected JSON response from server, but received an HTML document.'
    );
  }

  return response.json();
};
