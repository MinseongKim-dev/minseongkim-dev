export { supabase } from './supabase';

export async function signInWithGoogle(): Promise<void> {
  const { supabase } = await import('./supabase');
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { supabase } = await import('./supabase');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function signUpWithEmail(email: string, password: string): Promise<void> {
  const { supabase } = await import('./supabase');
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
}

export async function signOut(): Promise<void> {
  const { supabase } = await import('./supabase');
  await supabase.auth.signOut();
}
