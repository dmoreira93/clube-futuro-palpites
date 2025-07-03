// src/components/pwa/ReloadPrompt.tsx

import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket } from 'lucide-react';

function ReloadPrompt() {
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

  if (!needRefresh && !offlineReady) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="bg-background shadow-lg border-primary">
        <CardHeader className="p-4">
            <CardTitle className="flex items-center gap-2 text-base">
                <Rocket className="h-5 w-5 text-primary" />
                <span>Atualização Disponível!</span>
            </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <CardDescription>
            Uma nova versão do aplicativo está pronta. Recarregue para ver as novidades.
          </CardDescription>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => updateServiceWorker(true)} className="w-full">
              Atualizar Agora
            </Button>
            <Button variant="outline" onClick={() => close()} className="w-full">
              Depois
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ReloadPrompt;