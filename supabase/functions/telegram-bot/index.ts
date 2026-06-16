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

    // Limpa a menção ao bot se o comando vier como /ranking@cf_palpites_bot
    incomingText = incomingText.replace(/@\w+_bot/g, "").trim();

    // ==========================================
    // COMANDO: /ranking
    // ==========================================
    if (incomingText.startsWith("/ranking")) {
      
      // 1ª Tentativa: Envia usando o parâmetro 'p_pool_id'
      let { data: ranking, error: rpcError } = await supabase
        .rpc("get_pool_ranking", { p_pool_id: POOL_ID });

      // 2ª Tentativa (Mecanismo de Recuperação): Se deu erro, tenta usando o parâmetro como 'pool_id'
      if (rpcError || !ranking || ranking.length === 0) {
        const { data: retryData, error: retryError } = await supabase
          .rpc("get_pool_ranking", { pool_id: POOL_ID });
          
        if (!retryError && retryData && retryData.length > 0) {
          ranking = retryData;
          rpcError = null;
        }
      }

      // Se mesmo após a segunda tentativa der b.o, avisa o erro técnico real no chat para sabermos
      if (rpcError || !ranking || ranking.length === 0) {
        const msgErro = rpcError ? rpcError.message : "Ranking retornou vazio do banco de dados.";
        await sendTelegramMessage(telegramBotToken, chatId, `⚠️ *Erro ao ler Banco:* \`${msgErro}\``);
        return new Response("OK", { status: 200 });
      }

      const parts = incomingText.split(/\s+/);
      
      // CASO A: /ranking geral (Sem passar nome de ninguém)
      if (parts.length === 1 || parts[1] === "") {
        let responseText = "🏆 *RANKING ATUAL DO BOLÃO* 🏆\n\n";
        
        ranking.slice(0, 15).forEach((p: any, index: number) => {
          let emoji = "🔹";
          if (index === 0) emoji = "🥇";
          else if (index === 1) emoji = "🥈";
          else if (index === 2) emoji = "🥉";
          else if (index === ranking.length - 1) emoji = "🏮";

          // Usa o username do users_custom ou o name / email como alternativa secundária
          const displayUser = p.username || p.name || p.email || "Participante";
          responseText += `${emoji} *${index + 1}º ${displayUser}* — ${p.points ?? 0} pts (${p.exactscores ?? p.exact_scores ?? 0} cravadas)\n`;
        });

        responseText += "\n🤖 _Digite_ `/ranking nome` _para ver os detalhes de um participante!_";
        await sendTelegramMessage(telegramBotToken, chatId, responseText);
      } 
      // CASO B: /ranking dmoreira (Procura um participante)
      else {
        const targetUsername = parts[1].replace("@", "").toLowerCase();
        
        // Faz a busca inteligente aceitando cruzamento tanto por username quanto por name
        const targetIndex = ranking.findIndex((p: any) => 
          p.username?.toLowerCase() === targetUsername || 
          p.name?.toLowerCase() === targetUsername
        );

        if (targetIndex === -1) {
          await sendTelegramMessage(telegramBotToken, chatId, `❌ Usuário *${parts[1]}* não foi encontrado ou não está cadastrado neste bolão.`);
          return new Response("OK", { status: 200 });
        }

        const userStats = ranking[targetIndex];
        const leaderStats = ranking[0];
        const lanternStats = ranking[ranking.length - 1];

        const pointsUser = userStats.points ?? 0;
        const pointsLeader = leaderStats.points ?? 0;
        const pointsLantern = lanternStats.points ?? 0;

        const diffLeader = pointsLeader - pointsUser;
        const diffLantern = pointsUser - pointsLantern;
        const cravadas = userStats.exactscores ?? userStats.exact_scores ?? 0;
        const displayUser = userStats.username || userStats.name || "Participante";

        let responseText = `🏅 *Estatísticas de @${displayUser}*:\n\n`;
        responseText += `📊 *Posição:* ${targetIndex + 1}º lugar\n`;
        responseText += `💯 *Pontuação:* ${pointsUser} pontos\n`;
        responseText += `🎯 *Placares Cravados:* ${cravadas} jogos\n\n`;

        if (targetIndex === 0) {
          responseText += `👑 *Você é o líder isolado!* Mantém uma vantagem de *${diffLantern} pontos* sobre o lanterna.`;
        } else {
          responseText += `📈 Está a *${diffLeader} pontos* de distância do líder (@${leaderStats.username || leaderStats.name || 'Líder'}).\n`;
          responseText += `📉 Está *${diffLantern} pontos* à frente do lanterna (@${lanternStats.username || lanternStats.name || 'Lanterna'}).`;
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
        await sendTelegramMessage(telegramBotToken, chatId, "📅 *Agenda de Hoje:*\nNenhum jogo agendado ou pendente para o dia de hoje.");
        return new Response("OK", { status: 200 });
      }

      let responseText = "📅 *JOGOS DE HOJE:* \n\n";
      matches.forEach((m: any) => {
        const horaJogo = new Date(m.match_date).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Sao_Paulo"
        });

        responseText += `⚽ *${m.home_team?.name}* vs *${m.away_team?.name}*\n⏰ Horário: ${horaJogo} (Horário de Brasília)\n\n`;
      });
      
      responseText += "🚨 _Não esqueçam de registrar ou revisar seus palpites no app!_";
      await sendTelegramMessage(telegramBotToken, chatId, responseText);
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Erro interno na Edge Function:", err);
    return new Response("OK", { status: 200 });
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