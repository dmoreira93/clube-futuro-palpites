import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function handleZueiraCommands(
  text: string,
  ranking: any[],
  supabase: SupabaseClient,
  poolId: string
): Promise<string | null> {
  const command = text.trim().toLowerCase();

  // ==========================================
  // COMANDOS ANTIGOS/EXISTENTES (PRESERVADOS)
  // ==========================================

  // 1. COMANDO /inverterranking
  if (command.startsWith("/inverterranking")) {
    if (!ranking || ranking.length === 0) return "🙃 Sem dados de ranking para inverter.";
    
    const rankingInvertido = [...ranking].reverse();
    let msg = "🙃 *RANKING INVERTIDO (Mundo Paralelo)* 🙃\n\n";
    rankingInvertido.forEach((p, i) => {
      msg += `${i + 1}º - *${p.name || "Sem Nome"}* (${p.points} pts)\n`;
    });
    return msg;
  }

  // 2. COMANDO /piorparticipante
  if (command.startsWith("/piorparticipante")) {
    // Retorna a piada clássica do abrandalize configurada anteriormente
    return "🦉 O prêmio de pior participante vai para: *abrandalize*! Lanterna moral incontestável.";
  }


  // ==========================================
  // COMANDOS NOVOS (ADICIONADOS)
  // ==========================================

  // 3. COMANDO /chances
  if (command.startsWith("/chances")) {
    if (!ranking || ranking.length === 0) return "🎲 Sem dados de ranking para calcular.";
    
    const zueiras = [
      "🎲 Calculando probabilidades... Suas chances de ganhar são de 0,004%. É mais fácil o Íbis ganhar o Mundial.",
      "🚀 Minhas análises quânticas dizem que você tem 99% de chances... de pagar o churrasco pro líder.",
      "🔮 O sistema travou ao tentar calcular sua chance. O nível de ruindade quebrou o algoritmo.",
      "🏆 Chance real: Só se todo mundo esquecer de palpitar nas próximas 10 rodadas.",
      "📈 Gráfico em ascensão! Você tem grandes chances de garantir a lanterna de forma invicta."
    ];
    return zueiras[Math.floor(Math.random() * zueiras.length)];
  }

  // 4. COMANDO /frasedolanterna
  if (command.startsWith("/frasedolanterna")) {
    if (!ranking || ranking.length === 0) return "🦉 Ninguém na lanterna ainda.";
    
    const frasesLanterna = [
      `😭 "Não tá fácil... até o scraper tá pontuando mais do que eu."`,
      `🦉 "Estou apenas guardando forças para uma arrancada heroica que começará nunca."`,
      `📉 "Se o campeonato fosse invertido, eu seria o gênio incontestável deste grupo."`,
      `💸 "Alguém me passa o pix do juiz do próximo jogo para ver se eu saio do zero."`
    ];
    return `🦉 FALA DO LANTERNA:\n${frasesLanterna[Math.floor(Math.random() * frasesLanterna.length)]}`;
  }

  // 5. COMANDO /secador ou /palpiteunanime
  if (command.startsWith("/secador") || command.startsWith("/palpiteunanime")) {
    try {
      const { data: nextMatch } = await supabase
        .from("matches")
        .select(`
          id, 
          home_team:home_team_id(name), 
          away_team:away_team_id(name)
        `)
        .eq("status", "scheduled")
        .order("match_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!nextMatch) return "🗓 Sem próximos jogos agendados no momento.";

      const { data: predictions } = await supabase
        .from("match_predictions")
        .select("home_score, away_score")
        .eq("match_id", nextMatch.id)
        .eq("pool_id", poolId);

      if (!predictions || predictions.length === 0) {
        return `🔮 Próximo jogo: *${nextMatch.home_team.name} vs ${nextMatch.away_team.name}*.\nNinguém palpitou ainda!`;
      }

      let mandanteVence = 0, visitanteVence = 0, empate = 0;
      const placares: Record<string, number> = {};

      predictions.forEach((p) => {
        if (p.home_score > p.away_score) mandanteVence++;
        else if (p.away_score > p.home_score) visitanteVence++;
        else empate++;

        const placarStr = `${p.home_score}x${p.away_score}`;
        placares[placarStr] = (placares[placarStr] || 0) + 1;
      });

      const total = predictions.length;
      let tendencia = "";
      if (mandanteVence > visitanteVence && mandanteVence > empate) {
        tendencia = `votação em massa (${Math.round((mandanteVence/total)*100)}%) na vitória do ${nextMatch.home_team.name}`;
      } else if (visitanteVence > mandanteVence && visitanteVence > empate) {
        tendencia = `votação em massa (${Math.round((visitanteVence/total)*100)}%) na vitória do ${nextMatch.away_team.name}`;
      } else {
        tendencia = `equilíbrio ou favoritismo ao Empate (${Math.round((empate/total)*100)}%)`;
      }

      const topPlacar = Object.entries(placares).sort((a, b) => b[1] - a[1])[0];

      return `💨 *ZONA DO SECADOR* 💨\n\nPara *${nextMatch.home_team.name} vs ${nextMatch.away_team.name}*, o grupo aponta ${tendencia}.\n🔥 Maior placar apostado: *${topPlacar[0]}* (${topPlacar[1]} pessoas).\n\nSe der zebra, o choro é livre!`;
    } catch {
      return "⚠️ Erro ao calcular a tendência do secador.";
    }
  }

  // 6. COMANDO /zikadodia ou /meteuessa
  if (command.startsWith("/zikadodia") || command.startsWith("/meteuessa")) {
    try {
      const { data: matches } = await supabase
        .from("matches")
        .select("id, home_team:home_team_id(name), away_team:away_team_id(name)")
        .eq("status", "scheduled")
        .limit(3);

      if (!matches || matches.length === 0) return "🎰 Sem jogos futuros para buscar zikas.";

      const matchIds = matches.map(m => m.id);

      const { data: predictions } = await supabase
        .from("match_predictions")
        .select("home_score, away_score, match_id, user_id, users_custom(name, email)")
        .in("match_id", matchIds)
        .eq("pool_id", poolId);

      if (!predictions || predictions.length === 0) return "🦉 Nenhum palpite registrado para analisar.";

      let zikaPalpite = null;
      let jogoZika = null;

      for (const pred of predictions) {
        if (pred.home_score >= 4 || pred.away_score >= 4) {
          zikaPalpite = pred;
          jogoZika = matches.find(m => m.id === pred.match_id);
          break;
        }
      }

      if (!zikaPalpite) {
        zikaPalpite = predictions[Math.floor(Math.random() * predictions.length)];
        jogoZika = matches.find(m => m.id === zikaPalpite.match_id);
      }

      const nomeZika = zikaPalpite.users_custom?.name || zikaPalpite.users_custom?.email || "Corneteiro";
      return `🚨 *ALERTA DE ZIKA DO DIA* 🚨\n\nNo jogo *${jogoZika.home_team.name} vs ${jogoZika.away_team.name}*, o participante *${nomeZika}* meteu um ousado *${zikaPalpite.home_score}x${zikaPalpite.away_score}* sozinho.\n\nSe isso acontecer, ele vira o dono do bolão!`;
    } catch {
      return "⚠️ Erro ao varrer as zikas do dia.";
    }
  }

  // 7. COMANDO /muraldavergonha
  if (command.startsWith("/muraldavergonha")) {
    if (!ranking || ranking.length === 0) return "📊 Ranking vazio.";
    const piores = [...ranking].reverse().slice(0, 3);
    let msg = "🦉 *MURAL DA VERGONHA* 🦉\nQuem não acertaria nem a cor da bola:\n\n";
    piores.forEach((p, i) => {
      msg += `${i + 1}º - *${p.name || "Sem Nome"}* (${p.points} pts | ${p.exactscores || 0} cravadas)\n`;
    });
    return msg;
  }

  // 8. COMANDO /historico
  if (command.startsWith("/historico")) {
    const args = text.split(" ");
    if (args.length < 2) return "ℹ️ Uso correto: `/historico NomeDoUsuario`";
    
    const pesquisado = args.slice(1).join(" ").toLowerCase();
    const userStats = ranking.find(p => p.name?.toLowerCase().includes(pesquisado));

    if (!userStats) return "🔍 Participante não encontrado no ranking ativo.";

    return `📊 *Ficha Técnica de Desempenho*\n\n👤 *Perfil:* ${userStats.name}\n🏆 *Pontuação Acumulada:* ${userStats.points} pts\n🎯 *Placares cravados:* ${userStats.exactscores || 0} (+10 pts)\n📈 *Acurácia Geral:* ${userStats.accuracy || "0.0"}%\n\n*Tendência:* Costuma empolgar na rodada e xingar o scraper automatizado.`;
  }

  return null;
}