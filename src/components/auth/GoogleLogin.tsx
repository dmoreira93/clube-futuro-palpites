import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { supabase } from '../supabaseClient';
import { Capacitor } from '@capacitor/core';

const signInWithGoogle = async () => {
  if (Capacitor.isNativePlatform()) {
    // 1. Login Nativo (Sem abrir navegador externo)
    const user = await GoogleAuth.signIn();
    
    // 2. Passa o token do Google para o Supabase validar
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: user.authentication.idToken,
    });
  } else {
    // Fallback para Web Clássica
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  }
};