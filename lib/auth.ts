import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function mapAuthErrorMessage(rawMessage: string): string {
  const message = rawMessage.toLowerCase();

  if (message.includes('invalid login credentials')) {
    return 'Invalid email or password.';
  }

  if (message.includes('email address') && message.includes('invalid')) {
    return 'Please enter a valid email address.';
  }

  if (message.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  if (message.includes('user already registered')) {
    return 'An account with this email already exists.';
  }

  return rawMessage;
}

async function upsertUserProfile(user: User, name: string): Promise<void> {
  const { error } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      email: user.email,
      display_name: name,
    },
    { onConflict: 'id' },
  );

  if (error) {
    throw new Error(`Could not create profile: ${error.message}`);
  }
}

export async function signIn(
  email: string,
  password: string,
): Promise<Session | null> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizeEmail(email),
    password,
  });
  if (error) throw new Error(mapAuthErrorMessage(error.message));
  return data.session;
}

export async function signUp(
  name: string,
  email: string,
  password: string,
): Promise<Session | null> {
  const { data, error } = await supabase.auth.signUp({
    email: normalizeEmail(email),
    password,
  });
  if (error) throw new Error(mapAuthErrorMessage(error.message));

  if (data.user) {
    await upsertUserProfile(data.user, name.trim());
  }

  return data.session;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session;
}

// Registers an auth-state listener so the app reacts immediately to sign-in/sign-out/session refresh,
//  and returns an unsubscribe cleanup to avoid duplicate listeners.
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
}
