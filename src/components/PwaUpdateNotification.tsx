// src/components/PwaUpdateNotification.tsx

import { useEffect } from 'react';
import { useRegisterSW } from 'vite-plugin-pwa/react';
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

  // Função para fechar o toast
  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };
  
  // Hook para mostrar o toast quando uma nova versão for detectada
  useEffect(() => {
    if (needRefresh) {
      toast.info('Uma nova versão do aplicativo está disponível!', {
        position: 'top-center',
        duration: Infinity, // O toast não some sozinho
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
        // Opcional: notificar quando o app está pronto para uso offline
        toast.success('Aplicativo pronto para funcionar offline.', {
            position: 'top-center',
            duration: 5000,
            onDismiss: () => close(),
        })
    }
  }, [needRefresh, offlineReady, setNeedRefresh, updateServiceWorker]);

  return null; // O componente não renderiza nada visível diretamente
}

export default PwaUpdateNotification;