// Google OAuth Configuration
// Frontend URL: https://alphastore-vert.vercel.app/

export const GOOGLE_AUTH_CONFIG = {
  CLIENT_ID: '866642345311-4kiub26p4228g5q7edh3svh05vmn19gn.apps.googleusercontent.com',
  REDIRECT_URI: 'https://alphastore-vert.vercel.app/auth/google/callback',
  SCOPE: 'openid profile email',
  RESPONSE_TYPE: 'code',
  ACCESS_TYPE: 'offline',
  PROMPT: 'consent',
};

// Generate Google OAuth URL
export const getGoogleAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: GOOGLE_AUTH_CONFIG.CLIENT_ID,
    redirect_uri: GOOGLE_AUTH_CONFIG.REDIRECT_URI,
    response_type: GOOGLE_AUTH_CONFIG.RESPONSE_TYPE,
    scope: GOOGLE_AUTH_CONFIG.SCOPE,
    access_type: GOOGLE_AUTH_CONFIG.ACCESS_TYPE,
    prompt: GOOGLE_AUTH_CONFIG.PROMPT,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

// Initialize Google Sign In
export const initiateGoogleSignIn = () => {
  const authUrl = getGoogleAuthUrl();
  console.log('🔐 Redirecting to Google OAuth:', authUrl);
  window.location.href = authUrl;
};
