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
    // MENU DE COMANDOS
    // ==========================================
    if (incomingText.startsWith("/comandos")) {
        const msg = `🤖 *Comandos do Bolão:* \n\n` +
                    `/ranking - Ranking geral\n` +
                    `/ranking <nome> - Detalhes do usuário\n` +
                    `/proximojogo - Agenda do dia\n` +
                    `/criterios - Regras de pontuação\n` +
                    `/resultados - Últimos jogos finalizados\n` +
                    `/palpitesdiario - Palpites dos jogos de hoje`;
        await sendTelegramMessage(botToken, chatId, msg);
    }

    // COMANDO /RANKING
    else if (incomingText.startsWith("/ranking")) {
      let { data: ranking, error: rpcError } = await supabase.rpc("get_pool_ranking", { p_pool_id: POOL_ID });
      if (rpcError || !ranking || ranking.length === 0) {
         const { data: retryData } = await supabase.rpc("get_pool_ranking", { pool_id: POOL_ID });
         ranking = retryData;
      }

      if (!ranking || ranking.length === 0) {
        await sendTelegramMessage(botToken, chatId, "⚠️ Não foi possível carregar o ranking.");
      } else {
        const parts = incomingText.split(/\s+/);
        if (parts.length === 1) {
          let res = "🏆 *RANKING ATUAL*\n\n";
          ranking.slice(0, 10).forEach((p: any, i: number) => res += `${i + 1}º ${p.username || p.name} — ${p.points} pts\n`);
          await sendTelegramMessage(botToken, chatId, res);
        } else {
          const target = parts[1].replace("@", "").toLowerCase();
          const user = ranking.find((p: any) => p.username?.toLowerCase() === target || p.name?.toLowerCase() === target);
          if (!user) await sendTelegramMessage(botToken, chatId, `❌ Usuário não encontrado.`);
          else await sendTelegramMessage(botToken, chatId, `🏅 *Estatísticas de @${user.username || user.name}*\n\n📊 Posição: ${ranking.indexOf(user) + 1}º\n💯 Pontuação: ${user.points} pts\n🎯 Cravadas: ${user.exactscores || 0}`);
        }
      }
    }

    // COMANDO /CRITÉRIOS
    else if (incomingText.startsWith("/criterios")) {
        const { data: criteria } = await supabase.from("scoring_criteria").select("name, points, description").eq("pool_id", POOL_ID);
        if (!criteria || criteria.length === 0) {
            await sendTelegramMessage(botToken, chatId, "⚠️ Nenhuma regra de pontuação cadastrada.");
        } else {
            let msg = "📜 *Critérios de Pontuação:*\n\n";
            criteria.forEach(c => msg += `🎯 *${c.name}:* ${c.points} pts - ${c.description || ''}\n`);
            await sendTelegramMessage(botToken, chatId, msg);
        }
    }

    // COMANDO /RESULTADOS
    else if (incomingText.startsWith("/resultados")) {
      const { data: matches } = await supabase
        .from("matches")
        .select("home_score, away_score, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)")
        .eq("status", "finished")
        .order("match_date", { ascending: false })
        .limit(5);
        
      let msg = "⚽ *Últimos Jogos Finalizados:*\n\n";
      matches?.forEach(m => msg += `• ${m.home_team.name} ${m.home_score} x ${m.away_score} ${m.away_team.name}\n`);
      await sendTelegramMessage(botToken, chatId, msg || "Nenhum jogo finalizado.");
    }

    // COMANDO /PALPITESDIARIO
    else if (incomingText.startsWith("/palpitesdiario")) {
      const hoje = new Date().toISOString().split('T')[0];
      const { data: jogosHoje } = await supabase.from("matches").select("id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)").gte("match_date", `${hoje}T00:00:00Z`).lte("match_date", `${hoje}T23:59:59Z`);

      if (!jogosHoje || jogosHoje.length === 0) {
        await sendTelegramMessage(botToken, chatId, "📅 *Nenhum jogo hoje.*");
      } else {
        const { data: palpites } = await supabase.from("match_predictions").select("home_score, away_score, match_id, user:users_custom(username)").in("match_id", jogosHoje.map(j => j.id)).eq("pool_id", POOL_ID);
        let msg = "📝 *Palpites para hoje:*\n\n";
        jogosHoje.forEach(jogo => {
            msg += `⚽ *${jogo.home_team.name} x ${jogo.away_team.name}*\n`;
            const palpitesJogo = palpites?.filter(p => p.match_id === jogo.id) || [];
            if (palpitesJogo.length === 0) msg += "  _Nenhum palpite_\n";
            else palpitesJogo.forEach(p => msg += `  👤 ${p.user?.username}: ${p.home_score}x${p.away_score}\n`);
            msg += "\n";
        });
        await sendTelegramMessage(botToken, chatId, msg);
      }
    }

    // COMANDO /PROXIMOJOGO
    else if (incomingText.startsWith("/proximojogo") || incomingText.startsWith("/jogos")) {
        // ... (manter sua lógica original de próximos jogos aqui)
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