// src/components/PwaUpdateNotification.tsx - VERSÃO COM IMPORTAÇÃO ALTERNATIVA

import { useEffect } from 'react';
// --- ALTERAÇÃO AQUI: Mudamos o caminho da importação ---
import { useRegisterSW } from 'vite-plugin-pwa/virtual'; 
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Rocket } from 'lucide-react';

function PwaUpdateNotification() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('Service Worker registrado:', r);
    },
    onRegisterError(error) {
      console.error('Erro no registro do Service Worker:', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };
  
  useEffect(() => {
    if (needRefresh) {
      toast.info('Uma nova versão do aplicativo está disponível!', {
        position: 'top-center',
        duration: Infinity,
        icon: <Rocket className="h-4 w-4" />,
        action: (
          <Button
            size="sm"
            onClick={() => updateServiceWorker(true)}
            className="bg-fifa-gold text-fifa-blue hover:bg-opacity-90"
          >
            Atualizar Agora
          </Button>
        ),
        onDismiss: () => close(),
      });
    } else if (offlineReady) {
        toast.success('Aplicativo pronto para funcionar offline.', {
            position: 'top-center',
            duration: 5000,
            onDismiss: () => close(),
        })
    }
  }, [needRefresh, offlineReady, setNeedRefresh, updateServiceWorker]);

  return null;
}

export default PwaUpdateNotification;