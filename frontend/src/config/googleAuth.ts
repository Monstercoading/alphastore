export const GOOGLE_AUTH_CONFIG = {
  CLIENT_ID: '866642345311-4kiub26p4228g5q7edh3svh05vmn19gn.apps.googleusercontent.com',
  REDIRECT_URI: 'https://alphastore-2fx1j98pc-monstercoadings-projects.vercel.app/auth/google/callback',
  SCOPE: 'openid profile email',
  RESPONSE_TYPE: 'code',
};

export const initGoogleAuth = () => {
  // Load Google API script
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
  
  return new Promise((resolve) => {
    script.onload = resolve;
  });
};

export const googleSignIn = async () => {
  try {
    // Initialize Google Identity Services
    await initGoogleAuth();
    
    // Get Google auth URL
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_AUTH_CONFIG.CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(GOOGLE_AUTH_CONFIG.REDIRECT_URI)}&` +
      `response_type=${GOOGLE_AUTH_CONFIG.RESPONSE_TYPE}&` +
      `scope=${encodeURIComponent(GOOGLE_AUTH_CONFIG.SCOPE)}&` +
      `access_type=offline&` +
      `prompt=consent`;
    
    // Redirect to Google OAuth
    window.location.href = authUrl;
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};
