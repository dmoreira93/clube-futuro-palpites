// supabase/functions/update-all-scores/index.ts - LÓGICA DE DATA/HORA CORRIGIDA

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ... (corsHeaders e interface ApiFixture continuam os mesmos) ...

serve(async (_req) => {
  // ... (código inicial continua o mesmo) ...

  try {
    const supabaseAdmin = createClient(/*...*/);
    
    // --- LÓGICA DE VERIFICAÇÃO AVANÇADA E CORRIGIDA ---
    const now = new Date();
    // Pega o início e o fim do dia ATUAL, no fuso horário UTC
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    const { data: todaysGames, error: checkError } = await supabaseAdmin
      .from('matches')
      .select('match_date, is_finished')
      .gte('match_date', startOfDay.toISOString())
      .lte('match_date', endOfDay.toISOString());

    if (checkError) throw checkError;

    if (!todaysGames || todaysGames.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum jogo agendado para hoje. Encerrando." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    const allGamesFinished = todaysGames.every(game => game.is_finished);
    if (allGamesFinished) {
      return new Response(JSON.stringify({ message: "Todos os jogos de hoje já foram finalizados. Encerrando." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    const firstGameStartTime = new Date(Math.min(...todaysGames.map(game => new Date(game.match_date).getTime())));
    
    // Compara a hora atual (em UTC) com a hora do jogo (em UTC)
    if (now.getTime() < firstGameStartTime.getTime()) {
        return new Response(JSON.stringify({ message: `Aguardando o início do primeiro jogo. Encerrando a verificação.` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }
    // --- FIM DA LÓGICA DE VERIFICAÇÃO ---

    // ... (o resto da função continua exatamente igual) ...

  } catch (err) {
    // ...
  }
});