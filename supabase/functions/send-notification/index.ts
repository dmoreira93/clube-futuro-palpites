// supabase/functions/send-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'web-push';

serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Pegar as chaves VAPID dos secrets
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

  webpush.setVapidDetails(
    'mailto:diegomoreirad@hotmail.com',
    vapidPublicKey,
    vapidPrivateKey
  );

  const { userId, title, body, url } = await req.json();

  // Busca a inscrição do usuário no banco
  const { data: subs, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', userId);

  if (error || !subs || subs.length === 0) {
    return new Response(JSON.stringify({ error: 'Inscrição não encontrada' }), { status: 404 });
  }

  const notificationPayload = JSON.stringify({ title, body, url });

  // Envia a notificação para cada dispositivo do usuário
  const sendPromises = subs.map(item =>
    webpush.sendNotification(item.subscription, notificationPayload)
  );

  try {
    await Promise.all(sendPromises);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Erro ao enviar notificação:', err);
    return new Response(JSON.stringify({ error: 'Falha ao enviar' }), { status: 500 });
  }
});