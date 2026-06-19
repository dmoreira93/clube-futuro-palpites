import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"
import { handleZueiraCommands, handleComplexZueira } from "./zueira.ts";

const POOL_ID = "e61422a4-38d3-46fb-9f6d-d672e270d093";

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const update = await req.json();
    
    if (!update.message || !update.message.text) {
      return new Response("OK", { status: 200 });
    }

    const chatId = update.message.chat.id;
    let incomingText = update.message.text.trim();
    
    // Remove menções de bot em grupos (ex: /ranking@cf_palpites_bot -> /ranking)
    incomingText = incomingText.replace(/@\w+_bot/g, "").trim();
    const incomingTextLower = incomingText.toLowerCase();

    // ==========================================
    // CARREGAMENTO GLOBAL DO RANKING (Usado por múltiplos comandos)
    // ==========================================
    let ranking: any[] = [];
    let rpcError = null;

    const precisaRanking = 
      incomingTextLower.startsWith("/ranking") || 
      incomingTextLower.startsWith("/inverterranking") || 
      incomingTextLower.startsWith("/piorparticipante") ||
      incomingTextLower.startsWith("/historico") ||
      incomingTextLower.startsWith("/muraldavergonha") ||
      incomingTextLower.startsWith("/chances");

    if (precisaRanking) {
      const { data: rpcData, error: err1 } = await supabase.rpc("get_pool_ranking", { p_pool_id: POOL_ID });
      ranking = rpcData || [];
      rpcError = err1;

      if (rpcError || ranking.length === 0) {
        const { data: retryData, error: err2 } = await supabase.rpc("get_pool_ranking", { pool_id: POOL_ID });
        if (!err2 && retryData && retryData.length > 0) {
          ranking = retryData;
          rpcError = null;
        }
      }
    }

    // ==========================================
    // COMANDO: /comandos
    // ==========================================
    if (incomingTextLower.startsWith("/comandos")) {
      const msg = "🤖 *Comandos do Bot:*\n\n" +
                  "📊 /ranking - Ranking geral (Top 15)\n" +
                  "👤 /ranking <nome> - Estatísticas de um participante\n" +
                  "📜 /historico <nome> - Análise detalhada do palpiteiro\n" +
                  "🔮 /secador - Tendência de palpites do próximo jogo\n" +
                  "🦎 /zikadodia - Palpites isolados e ousados\n" +
                  "🏮 /muraldavergonha - Top 3 lanternas reais\n" +
                  "🧮 /chances - Descubra sua probabilidade matemática de ganhar\n" +
                  "🗓 /proximojogo - Agenda de jogos de hoje\n" +
                  "🎯 /criterios - Regras de pontuação\n" +
                  "⚽ /resultados - Últimos 5 jogos finalizados\n" +
                  "📝 /palpitesdiario - Palpites registrados para hoje\n" +
                  "🙃 /inverterranking - Corneta reversa do placar\n" +
                  "🤡 /piorparticipante - Revela o inimigo do acerto";
      await sendTelegramMessage(botToken, chatId, msg);
      return new Response("OK", { status: 200 });
    }

    // ==========================================
    // PROCESSAMENTO DE COMANDOS DE ZUEIRA / EXTRATOS
    // ==========================================
    const staticZueira = handleZueiraCommands(incomingText, ranking);
    if (staticZueira) {
      await sendTelegramMessage(botToken, chatId, staticZueira);
      return new Response("OK", { status: 200 });
    }

    const complexZueira = await handleComplexZueira(incomingText, supabase, POOL_ID);
    if (complexZueira) {
      await sendTelegramMessage(botToken, chatId, complexZueira);
      return new Response("OK", { status: 200 });
    }

    // ==========================================
    // COMANDO: /ranking (Geral e Individual)
    // ==========================================
    if (incomingTextLower.startsWith("/ranking")) {
      if (rpcError || !ranking || ranking.length === 0) {
        await sendTelegramMessage(botToken, chatId, "⚠️ Não consegui carregar os dados do ranking atual.");
        return new Response("OK", { status: 200 });
      }

      const parts = incomingText.split(/\s+/);

      if (parts.length === 1 || parts[1] === "") {
        let responseText = "🏆 *RANKING ATUAL DO BOLÃO* 🏆\n\n";
        ranking.slice(0, 15).forEach((p: any, index: number) => {
          let emoji = "🔹";
          if (index === 0) emoji = "🥇";
          else if (index === 1) emoji = "🥈";
          else if (index === 2) emoji = "🥉";
          else if (index === ranking.length - 1) emoji = "🏮";

          const displayUser = p.username || p.name || "Participante";
          responseText += `${emoji} ${index + 1}º ${displayUser} — *${p.points ?? 0}* pts (${p.exactscores ?? p.exact_scores ?? 0} cravadas)\n`;
        });
        await sendTelegramMessage(botToken, chatId, responseText);
      } else {
        const targetUsername = parts[1].replace("@", "").toLowerCase();
        const targetIndex = ranking.findIndex((p: any) => 
          p.username?.toLowerCase() === targetUsername || p.name?.toLowerCase() === targetUsername
        );

        if (targetIndex === -1) {
          await sendTelegramMessage(botToken, chatId, `❌ Usuário *${parts[1]}* não localizado neste bolão.`);
          return new Response("OK", { status: 200 });
        }

        const userStats = ranking[targetIndex];
        const diffLeader = (ranking[0].points ?? 0) - (userStats.points ?? 0);
        
        let responseText = `📊 *Estatísticas de @${userStats.username || userStats.name}:*\n`;
        responseText += `🏅 Posição: *${targetIndex + 1}º lugar*\n`;
        responseText += `💯 Pontuação: *${userStats.points ?? 0}* pts\n`;
        responseText += `🎯 Cravadas: *${userStats.exactscores ?? userStats.exact_scores ?? 0}*\n`;
        responseText += targetIndex === 0 
          ? `👑 Você é o líder do campeonato!` 
          : `📈 Distância para o líder: *${diffLeader}* pts.`;

        await sendTelegramMessage(botToken, chatId, responseText);
      }
    }

    // ==========================================
    // COMANDO: /criterios
    // ==========================================
    else if (incomingTextLower.startsWith("/criterios")) {
      const { data: criteria } = await supabase
        .from("scoring_criteria")
        .select("name, points, description")
        .eq("pool_id", POOL_ID);

      let msg = "📜 *Critérios de Pontuação do Bolão:* \n\n";
      if (!criteria || criteria.length === 0) {
        msg += "Nenhum critério dinâmico localizado para este bolão.";
      } else {
        criteria.forEach(c => {
          msg += `🎯 *${c.name}:* ${c.points} pts\nℹ️ ${c.description || 'Sem descrição.'}\n\n`;
        });
      }
      await sendTelegramMessage(botToken, chatId, msg);
    }

    // ==========================================
    // COMANDO: /resultados
    // ==========================================
    else if (incomingTextLower.startsWith("/resultados")) {
      const { data: matches } = await supabase
        .from("matches")
        .select(`
          home_score, away_score, 
          home_team:teams!matches_home_team_id_fkey(name), 
          away_team:teams!matches_away_team_id_fkey(name)
        `)
        .eq("status", "finished")
        .order("match_date", { ascending: false })
        .limit(5);

      let msg = "⚽ *Últimos 5 Jogos Finalizados:* \n\n";
      if (!matches || matches.length === 0) {
        msg += "Nenhum jogo finalizado encontrado até o momento.";
      } else {
        matches.forEach(m => {
          msg += `✅ *${(m.home_team as any)?.name}* ${m.home_score} x ${m.away_score} *${(m.away_team as any)?.name}*\n`;
        });
      }
      await sendTelegramMessage(botToken, chatId, msg);
    }

    // ==========================================
    // COMANDO: /proximojogo
    // ==========================================
    else if (incomingTextLower.startsWith("/proximojogo")) {
      const hoje = new Date().toISOString().split('T')[0];
      const { data: matches } = await supabase
        .from("matches")
        .select(`
          match_date, 
          home_team:teams!matches_home_team_id_fkey(name), 
          away_team:teams!matches_away_team_id_fkey(name)
        `)
        .eq("status", "scheduled")
        .gte("match_date", `${hoje}T00:00:00Z`)
        .lte("match_date", `${hoje}T23:59:59Z`)
        .order("match_date", { ascending: true });

      let res = "🗓 *JOGOS AGENDADOS PARA HOJE:* \n\n";
      if (!matches || matches.length === 0) {
        res += "Nenhum outro jogo agendado para o dia de hoje.";
      } else {
        matches.forEach(m => {
          const horaJogo = new Date(m.match_date).toLocaleTimeString("pt-BR", {
            hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo"
          });
          res += `⚽ *${(m.home_team as any)?.name}* vs *${(m.away_team as any)?.name}*\n⏰ Horário: ${horaJogo} (Brasília)\n\n`;
        });
      }
      await sendTelegramMessage(botToken, chatId, res);
    }

    // ==========================================
    // COMANDO: /palpitesdiario
    // ==========================================
    else if (incomingTextLower.startsWith("/palpitesdiario")) {
      const hoje = new Date().toISOString().split('T')[0];
      const { data: jogos } = await supabase
        .from("matches")
        .select(`id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)`)
        .gte("match_date", `${hoje}T00:00:00Z`)
        .lte("match_date", `${hoje}T23:59:59Z`);

      if (!jogos || jogos.length === 0) {
        await sendTelegramMessage(botToken, chatId, "📝 Nenhum palpite diário pois não há jogos hoje.");
      } else {
        const { data: palpites } = await supabase
          .from("match_predictions")
          .select("home_score, away_score, match_id, user:users_custom(username)")
          .in("match_id", jogos.map(j => j.id))
          .eq("pool_id", POOL_ID);

        let msg = "📝 *Palpites da Galera para Hoje:* \n\n";
        jogos.forEach(j => {
          msg += `⚽ *${(j.home_team as any)?.name} x ${(j.away_team as any)?.name}*\n`;
          const filtrados = palpites?.filter(p => p.match_id === j.id) || [];
          if (filtrados.length === 0) {
            msg += "  ▫️ _Sem palpites abertos ou registrados._\n";
          } else {
            filtrados.forEach(p => {
              msg += `  👤 @${(p.user as any)?.username || "Anônimo"}: ${p.home_score} x ${p.away_score}\n`;
            });
          }
          msg += "\n";
        });
        await sendTelegramMessage(botToken, chatId, msg);
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Erro na execution da Edge Function:", err);
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