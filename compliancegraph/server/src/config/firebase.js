const admin = require('firebase-admin');

let adminInstance;

try {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!privateKey || privateKey.includes('your_') || privateKey.includes('...')) {
    throw new Error('Placeholder or missing private key detected');
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
    });
  }
  adminInstance = admin;
} catch (error) {
  console.warn('\n⚠️  WARNING: Firebase Admin failed to initialize or placeholder credentials were provided.');
  console.warn('👉 Details:', error.message);
  console.warn('👉 Switching to Developer Mock Auth Mode for local testing and development.\n');

  adminInstance = {
    apps: [{ name: '[DEFAULT]' }],
    auth: () => ({
      verifyIdToken: async (token) => {
        console.log('🤖 Mock Auth: Verifying token:', token);
        let uid = 'mock-user-123';
        let email = 'dev-user@compliancegraph.com';

        if (token && token.startsWith('{')) {
          try {
            const parsed = JSON.parse(token);
            uid = parsed.uid || uid;
            email = parsed.email || email;
          } catch (e) {}
        } else if (token && token.length > 5) {
          uid = token;
          email = `${token.replace(/\s+/g, '')}@compliancegraph.com`;
        }

        return {
          uid,
          email,
          name: 'Developer User',
          email_verified: true,
        };
      }
    }),
    storage: () => ({
      bucket: () => ({
        file: () => ({
          save: async () => {},
          getSignedUrl: async () => ['https://example.com/mock-file.pdf']
        })
      })
    })
  };
}

module.exports = adminInstance;
