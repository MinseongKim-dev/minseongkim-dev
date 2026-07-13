import { Amplify } from 'aws-amplify';
import { fetchAuthSession, signIn, signOut, signUp, confirmSignUp, getCurrentUser } from 'aws-amplify/auth';

const USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID ?? import.meta.env.VITE_USER_POOL_ID ?? '';
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID ?? import.meta.env.VITE_USER_POOL_CLIENT_ID ?? '';

if (!USER_POOL_ID || !CLIENT_ID) {
  console.warn('⚠️ Cognito not configured. Please set VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID in .env.local');
}

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: USER_POOL_ID,
      userPoolClientId: CLIENT_ID,
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code',
      userAttributes: {
        email: {
          required: true,
        },
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
      },
    },
  },
});

export { signIn, signOut, signUp, confirmSignUp, getCurrentUser };

/** Returns the current user's JWT id-token, or null if not signed in. */
export async function getIdToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() ?? null;
  } catch {
    return null;
  }
}

/** Builds Authorization headers for API calls. */
export async function authHeaders(): Promise<Record<string, string>> {
  const token = await getIdToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
