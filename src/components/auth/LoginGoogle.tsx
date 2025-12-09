import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function LoginGoogle() {
  const [loading, setLoading] = useState(false);

  // Inicializa o plugin do Google (necessário para a Web)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      GoogleAuth.initialize();
    }
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      if (Capacitor.isNativePlatform()) {
        // --- LÓGICA NATIVA (Android/iOS) ---
        // 1. Abre o prompt nativo do celular
        const googleUser = await GoogleAuth.signIn();
        
        // 2. Pega o ID Token e manda para o Supabase validar
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: googleUser.authentication.idToken,
        });

        if (error) throw error;
        
      } else {
        // --- LÓGICA WEB (Navegador) ---
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin, // Volta para a home após login
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });
        
        if (error) throw error;
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao entrar com Google", { description: error.message });
      setLoading(false);
    }
    // Nota: No fluxo Web, o setLoading(false) não acontece aqui porque a página recarrega.
  };

  return (
    <Button 
      variant="outline" 
      className="w-full h-12 text-base font-medium gap-2 border-gray-300" 
      onClick={handleGoogleLogin}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        // Ícone do Google SVG
        <svg className="h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
          <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
        </svg>
      )}
      Continuar com Google
    </Button>
  );
}