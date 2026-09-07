export interface SsoUserPayload {
  name: string;
  email: string;
  provider: 'google';
}

export const fetchGoogleUserInfo = async (accessToken: string): Promise<{ name: string; email: string }> => {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch Google profile information');
  }
  const data = await response.json();
  return {
    name: data.name || data.email.split('@')[0],
    email: data.email,
  };
};

export const ssoLoginRequest = async (email: string, provider: 'google' = 'google') => {
  const response = await fetch('/api/auth/sso-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, provider }),
  });
  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
};

export const ssoRegisterRequest = async (payload: {
  name: string;
  email: string;
  role: string;
  secretKey: string;
  provider: 'google';
}) => {
  const response = await fetch('/api/auth/sso-register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
};
