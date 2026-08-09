import { supabase } from './supabase';

export { supabase };

export async function signIn({ username, password }: { username: string; password: string }) {
  const { error } = await supabase.auth.signInWithPassword({ email: username, password });
  if (error) throw new Error(error.message);
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function signUp({
  username,
  password,
}: {
  username: string;
  password: string;
  options?: { userAttributes?: { email?: string } };
}) {
  const { error } = await supabase.auth.signUp({ email: username, password });
  if (error) throw new Error(error.message);
}

export async function confirmSignUp(_args: { username: string; confirmationCode: string }) {
  // Supabase handles email confirmation via magic link by default.
  // If using OTP-style confirmation, handle it via verifyOtp.
  // For now this is a no-op — the user clicks the link in the confirmation email.
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getIdToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export async function authHeaders(): Promise<Record<string, string>> {
  const token = await getIdToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
