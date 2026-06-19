import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"
import { handleZueiraCommands } from "./zueira.ts";

const POOL_ID = "e61422a4-38d3-46fb-9f6d-d672e270d093";

Deno.serve(async (req) => {
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
    const update = await req.json();
    
    if (!update.message?.text) return new Response("OK", { status: 200 });

    const chatId = update.message.chat.id;
    let incomingText = update.message.text.trim().toLowerCase().replace(/@\w+_bot/g, "").trim();
    // Executa os comandos de zueira antes dos comandos oficiais
    const zueiraResponse = handleZueiraCommands(incomingText, ranking || []);
    if (zueiraResponse) {
    await sendTelegramMessage(telegramBotToken, chatId, zueiraResponse);
    return new Response("OK", { status: 200 });
    }

    // ==========================================
    // MENU DE COMANDOS (plaintext)
    // ==========================================
    if (incomingText.startsWith("/comandos")) {
        const msg = "🤖 *Comandos do Bot:*\n\n" +
                    "/ranking - Ranking geral (Top 15)\n" +
                    "/ranking <nome> - Estatísticas de um participante\n" +
                    "/proximojogo - Agenda de jogos de hoje\n" +
                    "/criterios - Regras de pontuação\n" +
                    "/resultados - Últimos 5 jogos finalizados\n" +
                    "/palpitesdiario - Palpites registrados para hoje";
        await sendTelegramMessage(botToken, chatId, msg);
    }

    // ==========================================
    // COMANDO: /ranking
    // ==========================================
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
        if (parts.length === 1 || parts[1] === "") {
          let res = "🏆 *RANKING ATUAL DO BOLÃO* 🏆\n\n";
          ranking.slice(0, 15).forEach((p: any, i: number) => {
             const emoji = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🔹";
             res += `${emoji} *${i + 1}º ${p.username || p.name}* — ${p.points ?? 0} pts\n`;
          });
          res += "\n🤖 _Digite_ `/ranking nome` _para ver detalhes de um participante!_";
          await sendTelegramMessage(botToken, chatId, res);
        } else {
          const target = parts[1].replace("@", "").toLowerCase();
          const user = ranking.find((p: any) => p.username?.toLowerCase() === target || p.name?.toLowerCase() === target);
          if (!user) await sendTelegramMessage(botToken, chatId, `❌ Usuário *${parts[1]}* não encontrado.`);
          else {
            const ldr = ranking[0];
            const ltn = ranking[ranking.length - 1];
            const diffLdr = ldr.points - user.points;
            const diffLtn = user.points - ltn.points;
            await sendTelegramMessage(botToken, chatId, `🏅 *Estatísticas de @${user.username || user.name}*\n\n📊 Posição: ${ranking.indexOf(user) + 1}º\n💯 Pontuação: ${user.points} pts\n🎯 Cravadas: ${user.exactscores || 0}\n\n📈 ${diffLdr} pts atrás do líder (@${ldr.username || ldr.name})\n📉 ${diffLtn} pts à frente do lanterna (@${ltn.username || ltn.name})`);
          }
        }
      }
    }

    // COMANDO /CRITERIOS
    else if (incomingText.startsWith("/criterios")) {
        const { data: criteria } = await supabase.from("scoring_criteria").select("name, points, description").eq("pool_id", POOL_ID);
        let msg = "📜 *Critérios de Pontuação:*\n\n";
        criteria?.forEach(c => msg += `🎯 *${c.name}:* ${c.points} pts - ${c.description || ''}\n`);
        await sendTelegramMessage(botToken, chatId, msg || "Nenhuma regra cadastrada.");
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
      const { data: jogos } = await supabase.from("matches").select("id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)").gte("match_date", `${hoje}T00:00:00Z`).lte("match_date", `${hoje}T23:59:59Z`);

      if (!jogos || jogos.length === 0) await sendTelegramMessage(botToken, chatId, "📅 *Nenhum jogo hoje.*");
      else {
        const { data: palpites } = await supabase.from("match_predictions").select("home_score, away_score, match_id, user:users_custom(username)").in("match_id", jogos.map(j => j.id)).eq("pool_id", POOL_ID);
        let msg = "📝 *Palpites para hoje:*\n\n";
        jogos.forEach(j => {
            msg += `⚽ *${j.home_team.name} x ${j.away_team.name}*\n`;
            palpites?.filter(p => p.match_id === j.id).forEach(p => msg += `  👤 ${p.user?.username}: ${p.home_score}x${p.away_score}\n`);
            msg += "\n";
        });
        await sendTelegramMessage(botToken, chatId, msg);
      }
    }

    // COMANDO /PROXIMOJOGO
    else if (incomingText.startsWith("/proximojogo") || incomingText.startsWith("/jogos")) {
      const hoje = new Date().toISOString().split('T')[0];
      const { data: matches } = await supabase.from("matches").select("match_date, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)").eq("status", "scheduled").gte("match_date", `${hoje}T00:00:00Z`).lte("match_date", `${hoje}T23:59:59Z`).order("match_date", { ascending: true });
      let res = "📅 *JOGOS DE HOJE:*\n\n";
      matches?.forEach(m => res += `⚽ *${m.home_team.name}* vs *${m.away_team.name}*\n⏰ ${new Date(m.match_date).toLocaleTimeString("pt-BR", {hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo"})}\n\n`);
      await sendTelegramMessage(botToken, chatId, res || "Nenhum jogo agendado hoje.");
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