// src/components/pwa/ReloadPrompt.tsx (VERSÃO ATUALIZADA E AUTOMÁTICA)

import React, { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from "@/components/ui/use-toast";
import { Rocket } from 'lucide-react';

function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    // Removido onRegistered e onRegisterError para simplificar
  });

  useEffect(() => {
    if (needRefresh) {
      // Exibe uma notificação toast informando sobre a atualização
      toast({
        title: "Atualizando o aplicativo...",
        description: "Uma nova versão está sendo carregada para você.",
        action: <Rocket className="h-5 w-5 text-primary" />,
      });

      // Atraso de 2 segundos para o usuário ver a mensagem
      // e então força a atualização do Service Worker e recarrega a página.
      setTimeout(() => {
        updateServiceWorker(true);
      }, 2000);
    }
  }, [needRefresh, updateServiceWorker]);

  // Este componente agora não renderiza nada visível,
  // ele apenas contém a lógica de atualização.
  return null;
}

export default ReloadPrompt;