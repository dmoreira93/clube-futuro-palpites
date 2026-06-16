import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const POOL_ID = "e61422a4-38d3-46fb-9f6d-d672e270d093";

Deno.serve(async (req) => {
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
    const update = await req.json();
    
    if (!update.message?.text) return new Response("OK", { status: 200 });

    const chatId = update.message.chat.id;
    let incomingText = update.message.text.trim().toLowerCase().replace(/@\w+_bot/g, "").trim();

    // ==========================================
    // COMANDOS DO BOT
    // ==========================================

    // 1. /comandos - Lista todas as funcionalidades
    if (incomingText.startsWith("/comandos")) {
        const msg = `🤖 *Comandos do Bolão:* \n\n` +
                    `/ranking - Ranking geral\n` +
                    `/ranking <nome> - Detalhes do usuário\n` +
                    `/proximojogo - Agenda do dia\n` +
                    `/criterios - Regras de pontuação\n` +
                    `/resultados - Últimos resultados\n` +
                    `/palpitesdiario - Palpites da galera`;
        await sendTelegramMessage(botToken, chatId, msg);
    }

    // 2. /ranking
    else if (incomingText.startsWith("/ranking")) {
      let { data: ranking, error: rpcError } = await supabase.rpc("get_pool_ranking", { p_pool_id: POOL_ID });
      if (rpcError || !ranking) {
         const { data: retryData } = await supabase.rpc("get_pool_ranking", { pool_id: POOL_ID });
         ranking = retryData;
      }

      if (!ranking || ranking.length === 0) {
        await sendTelegramMessage(botToken, chatId, "⚠️ Não foi possível carregar o ranking.");
      } else {
        const parts = incomingText.split(/\s+/);
        if (parts.length === 1 || parts[1] === "") {
          let res = "🏆 *RANKING ATUAL*\n\n";
          ranking.slice(0, 10).forEach((p: any, i: number) => res += `${i + 1}º ${p.username || p.name} — ${p.points} pts\n`);
          await sendTelegramMessage(botToken, chatId, res);
        } else {
          const target = parts[1].replace("@", "").toLowerCase();
          const user = ranking.find((p: any) => p.username?.toLowerCase() === target || p.name?.toLowerCase() === target);
          if (!user) {
            await sendTelegramMessage(botToken, chatId, `❌ Usuário *${parts[1]}* não encontrado.`);
          } else {
            await sendTelegramMessage(botToken, chatId, `🏅 *Estatísticas de @${user.username || user.name}*\n\n📊 Posição: ${ranking.indexOf(user) + 1}º\n💯 Pontuação: ${user.points} pts\n🎯 Cravadas: ${user.exactscores || 0}`);
          }
        }
      }
    }

    // 3. /criterios
    else if (incomingText.startsWith("/criterios")) {
      await sendTelegramMessage(botToken, chatId, "📜 *Regras de Pontuação:*\n🎯 *Placar Exato:* 10 pts\n⚽ *Resultado:* 3 pts\n❌ *Erro:* 0 pts");
    }

    // 4. /resultados
    else if (incomingText.startsWith("/resultados")) {
      const { data: matches } = await supabase
        .from("matches")
        .select("home_score, away_score, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)")
        .eq("status", "finished")
        .order("match_date", { ascending: false })
        .limit(5);
        
      let msg = "⚽ *Últimos Resultados:*\n\n";
      matches?.forEach(m => msg += `• ${m.home_team.name} ${m.home_score} x ${m.away_score} ${m.away_team.name}\n`);
      await sendTelegramMessage(botToken, chatId, msg || "Nenhum jogo finalizado.");
    }

    // 5. /palpitesdiario
    else if (incomingText.startsWith("/palpitesdiario")) {
      const hoje = new Date().toISOString().split('T')[0];
      const { data: palpites } = await supabase
        .from("match_predictions")
        .select("home_score, away_score, user:users_custom(username), match:matches(home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name))")
        .eq("pool_id", POOL_ID)
        .gte("created_at", `${hoje}T00:00:00Z`);

      let msg = "📝 *Palpites de hoje:*\n\n";
      palpites?.forEach(p => msg += `👤 ${p.user.username}: ${p.match.home_team.name} ${p.home_score}x${p.away_score} ${p.match.away_team.name}\n`);
      await sendTelegramMessage(botToken, chatId, msg || "Ninguém palpitou hoje ainda.");
    }

    // 6. /proximojogo
    else if (incomingText.startsWith("/proximojogo")) {
        // ... (manter a sua lógica original aqui)
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    return new Response("OK", { status: 200 });
  }
});

async function sendTelegramMessage(token: string, chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" })
  });
}