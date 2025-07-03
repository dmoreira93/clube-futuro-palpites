// src/components/pwa/ReloadPrompt.tsx (VERSÃO FINAL E MAIS CONFIÁVEL)

import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket } from 'lucide-react';

function ReloadPrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      console.log(`Service Worker registrado: ${swUrl}`);
      // Se houver uma atualização pendente, atualize a cada hora
      if (r?.installing) {
        setInterval(() => {
          r.update();
        }, 3600000); // 1 hora
      }
    },
    onRegisterError(error) {
      console.error('Erro no registro do Service Worker:', error);
    },
  });

  // Se não houver necessidade de refresh, não renderiza nada.
  if (!needRefresh) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in-0 slide-in-from-bottom-5">
      <Card className="bg-background shadow-2xl border-primary">
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Rocket className="h-5 w-5 text-primary" />
            <span>Atualização Disponível!</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <CardDescription>
            Uma nova versão do aplicativo está pronta. Clique para recarregar e ver as novidades.
          </CardDescription>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => updateServiceWorker(true)} className="w-full">
              Atualizar Agora
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ReloadPrompt;