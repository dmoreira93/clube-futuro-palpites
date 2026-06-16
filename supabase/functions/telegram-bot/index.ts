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
                    `/resultados - Últimos 5 jogos finalizados\n` +
                    `/palpitesdiario - Palpites registrados para hoje`;
        await sendTelegramMessage(botToken, chatId, msg);
    }

    // COMANDO /CRITERIOS (Dinamico)
    else if (incomingText.startsWith("/criterios")) {
        const { data: criteria } = await supabase
            .from("scoring_criteria")
            .select("name, points, description")
            .eq("pool_id", POOL_ID);

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
            
      let msg = "⚽ *Últimos Resultados:*\n\n";
      matches?.forEach(m => msg += `• ${m.home_team.name} ${m.home_score} x ${m.away_score} ${m.away_team.name}\n`);
      await sendTelegramMessage(botToken, chatId, msg || "Nenhum jogo finalizado.");
    }

    // COMANDO /PALPITESDIARIO
    else if (incomingText.startsWith("/palpitesdiario")) {
      const hoje = new Date().toISOString().split('T')[0];
      const { data: palpites } = await supabase
        .from("match_predictions")
        .select("home_score, away_score, user:users_custom(username), match:matches(home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name))")
        .eq("pool_id", POOL_ID)
        .gte("created_at", `${hoje}T00:00:00Z`);

      let msg = "📝 *Palpites de hoje:*\n\n";
      palpites?.forEach(p => msg += `👤 ${p.user.username}: ${p.match.home_team.name} ${p.home_score}x${p.away_score} ${p.match.away_team.name}\n`);
      await sendTelegramMessage(botToken, chatId, msg || "Ninguém palpitou hoje.");
    }

    // ... (Mantenha a lógica do /ranking e /proximojogo aqui) ...
    // [Inserir lógica original do Ranking e Proximojogo abaixo]

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error(err);
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