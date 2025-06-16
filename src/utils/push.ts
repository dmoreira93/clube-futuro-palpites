// src/utils/push.ts
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Certifique-se de que esta variável de ambiente está no seu arquivo .env.local
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function saveSubscription(subscription: PushSubscription, userId: string) {
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({ user_id: userId, subscription: subscription as any }, { onConflict: 'user_id' });

    if (error) {
      toast.error('Erro ao salvar inscrição no servidor.');
      console.error('Erro ao salvar inscrição:', error);
    } else {
      toast.success('Inscrição para notificações salva!');
    }
}

export async function subscribeUserToPush(userId: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    toast.error('Seu navegador não suporta notificações push.');
    return;
  }
  
  if (!VAPID_PUBLIC_KEY) {
      console.error("VAPID_PUBLIC_KEY não está definida nas variáveis de ambiente.");
      toast.error("Erro de configuração do cliente para notificações.");
      return;
  }

  const registration = await navigator.serviceWorker.ready;
  const existingSubscription = await registration.pushManager.getSubscription();

  if (existingSubscription) {
    toast.info('Você já está inscrito para receber notificações.');
    await saveSubscription(existingSubscription, userId);
    return;
  }
  
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    await saveSubscription(subscription, userId);
  } catch (error) {
     console.error('Falha ao se inscrever:', error);
     if (Notification.permission === 'denied') {
        toast.error('Permissão para notificações foi negada. Por favor, habilite nas configurações do seu navegador.');
     } else {
        toast.error('Não foi possível se inscrever para notificações.');
     }
  }
}