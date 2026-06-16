import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const POOL_ID = "e61422a4-38d3-46fb-9f6d-d672e270d093";

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const update = await req.json();
    
    if (!update.message || !update.message.text) {
      return new Response("OK", { status: 200 });
    }

    const chatId = update.message.chat.id;
    let incomingText = update.message.text.trim();

    // 🔥 MÁGICA DE BLINDAGEM: Remove o @NomeDoBot se o usuário marcar o bot no grupo
    incomingText = incomingText.replace(/@\w+_bot/g, "").trim();

    // ==========================================
    // COMANDO: /ranking
    // ==========================================
    if (incomingText.startsWith("/ranking")) {
      const { data: ranking, error: rpcError } = await supabase
        .rpc("get_pool_ranking", { p_pool_id: POOL_ID });

      if (rpcError || !ranking || ranking.length === 0) {
        await sendTelegramMessage(telegramBotToken, chatId, "⚠️ Não foi possível carregar o ranking do bolão no momento.");
        return new Response("OK", { status: 200 });
      }

      const parts = incomingText.split(/\s+/); // Divide por qualquer quantidade de espaços
      
      // CASO A: /ranking geral (Sem argumentos extras)
      if (parts.length === 1 || parts[1] === "") {
        let responseText = "🏆 *RANKING ATUAL DO BOLÃO* 🏆\n\n";
        
        ranking.slice(0, 15).forEach((p: any, index: number) => {
          let emoji = "🔹";
          if (index === 0) emoji = "🥇";
          else if (index === 1) emoji = "🥈";
          else if (index === 2) emoji = "🥉";
          else if (index === ranking.length - 1) emoji = "🏮";

          responseText += `${emoji} *${index + 1}º ${p.username || 'Sem Nome'}* — ${p.points} pts (${p.exactscores} cravadas)\n`;
        });

        responseText += "\n🤖 _Digite_ `/ranking nome` _para ver os detalhes de um participante!_";
        await sendTelegramMessage(telegramBotToken, chatId, responseText);
      } 
      // CASO B: /ranking dmoreira
      else {
        const targetUsername = parts[1].replace("@", "").toLowerCase();
        const targetIndex = ranking.findIndex((p: any) => p.username?.toLowerCase() === targetUsername);

        if (targetIndex === -1) {
          await sendTelegramMessage(telegramBotToken, chatId, `❌ Usuário *${parts[1]}* não foi encontrado no bolão.`);
          return new Response("OK", { status: 200 });
        }

        const userStats = ranking[targetIndex];
        const leaderStats = ranking[0];
        const lanternStats = ranking[ranking.length - 1];

        const diffLeader = leaderStats.points - userStats.points;
        const diffLantern = userStats.points - lanternStats.points;

        let responseText = `🏅 *Estatísticas de @${userStats.username}*:\n\n`;
        responseText += `📊 *Posição:* ${targetIndex + 1}º lugar\n`;
        responseText += `💯 *Pontuação:* ${userStats.points} pontos\n`;
        responseText += `🎯 *Placares Cravados:* ${userStats.exactscores} jogos\n\n`;

        if (targetIndex === 0) {
          responseText += `👑 *Você é o líder isolado!* Mantém uma vantagem de *${diffLantern} pontos* sobre o lanterna.`;
        } else {
          responseText += `📈 Está a *${diffLeader} pontos* de distância do líder (@${leaderStats.username}).\n`;
          responseText += `📉 Está *${diffLantern} pontos* à frente do lanterna (@${lanternStats.username}).`;
        }

        await sendTelegramMessage(telegramBotToken, chatId, responseText);
      }
    }

    // ==========================================
    // COMANDO: /proximojogo
    // ==========================================
    else if (incomingText.startsWith("/proximojogo") || incomingText.startsWith("/jogos")) {
      const hoje = new Date().toISOString().split('T')[0];

      const { data: matches, error: matchError } = await supabase
        .from("matches")
        .select(`
          match_date,
          status,
          home_team:teams!matches_home_team_id_fkey(name),
          away_team:teams!matches_away_team_id_fkey(name)
        `)
        .eq("status", "scheduled")
        .gte("match_date", `${hoje}T00:00:00Z`)
        .lte("match_date", `${hoje}T23:59:59Z`)
        .order("match_date", { ascending: true });

      if (matchError || !matches || matches.length === 0) {
        await sendTelegramMessage(telegramBotToken, chatId, "📅 *Agenda de Hoje:*\nNenhum jogo agendado para o dia de hoje.");
        return new Response("OK", { status: 200 });
      }

      let responseText = "📅 *JOGOS DE HOJE:* \n\n";
      matches.forEach((m: any) => {
        const horaJogo = new Date(m.match_date).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Sao_Paulo"
        });
        responseText += `⚽ *${m.home_team?.name}* vs *${m.away_team?.name}*\n⏰ Horário: ${horaJogo}\n\n`;
      });
      
      responseText += "🚨 _Não esqueçam de salvar seus palpites no app!_";
      await sendTelegramMessage(telegramBotToken, chatId, responseText);
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Erro interno na Edge Function:", err);
    return new Response("Internal Error", { status: 500 });
  }
});

async function sendTelegramMessage(token: string, chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown"
    })
  });
}