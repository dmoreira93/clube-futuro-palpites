// zueira.ts

export function handleZueiraCommands(command: string, ranking: any[]): string | null {
  const cmdLower = command.toLowerCase();

  // ==========================================
  // COMANDO: /inverterranking
  // ==========================================
  if (cmdLower.startsWith("/inverterranking")) {
    if (!ranking || ranking.length === 0) return "⚠️ Ranking não carregado.";
    const reversed = [...ranking].reverse();
    let txt = "🙃 *RANKING INVERTIDO (MUNDO DA VOLTAS)* 🙃\n\n";
    reversed.forEach((p, idx) => {
      let emoji = idx === 0 ? "🏮 (Lanterna Lendário)" : "🔹";
      txt += `${emoji} ${idx + 1}º ${p.username || p.name} — *${p.points ?? 0}* pts\n`;
    });
    return txt;
  }

  // ==========================================
  // COMANDO: /piorparticipante
  // ==========================================
  if (cmdLower.startsWith("/piorparticipante")) {
    if (!ranking || ranking.length === 0) return "⚠️ Dados indisponíveis.";
    const lanterna = ranking[ranking.length - 1];
    return `🤡 *O INIMIGO DA PREVISÃO* 🤡\n\nO prêmio "Calculadora Quebrada" vai para *@${lanterna.username || lanterna.name}*!\nSegurando com orgulho a lanterna isolada com *${lanterna.points ?? 0}* pontos!`;
  }

  // ==========================================
  // COMANDO: /muraldavergonha
  // ==========================================
  if (cmdLower.startsWith("/muraldavergonha")) {
    if (!ranking || ranking.length === 0) return "⚠️ Ninguém passou vergonha hoje porque o banco não abriu.";
    const len = ranking.length;
    let txt = "🏮 *MURAL DA VERGONHA (TOP 3 LANTERNAS)* 🏮\n\n";
    
    // Pega as últimas 3 posições de baixo para cima
    const p1 = ranking[len - 1];
    const p2 = ranking[len - 2];
    const p3 = ranking[len - 3];

    if (p1) txt += `🚨 *${len}º lugar:* @${p1.username || p1.name} — *${p1.points ?? 0}* pts (O Lanterna Real)\n`;
    if (p2) txt += `📉 *${len - 1}º lugar:* @${p2.username || p2.name} — *${p2.points ?? 0}* pts\n`;
    if (p3) txt += `⏳ *${len - 2}º lugar:* @${p3.username || p3.name} — *${p3.points ?? 0}* pts\n`;
    
    txt += "\n_Rezem por uma rodada de milagres, a situação está feia!_ 👃";
    return txt;
  }

  // ==========================================
  // COMANDO: /historico <nome>
  // ==========================================
  if (cmdLower.startsWith("/historico")) {
    if (!ranking || ranking.length === 0) return "⚠️ Ranking vazio.";
    const parts = command.split(/\s+/);
    if (parts.length === 1 || parts[1] === "") return "ℹ️ Use: `/historico nome` para ver a análise completa.";

    const targetUsername = parts[1].replace("@", "").toLowerCase();
    const idx = ranking.findIndex(p => p.username?.toLowerCase() === targetUsername || p.name?.toLowerCase() === targetUsername);

    if (idx === -1) return `❌ Palpiteiro *${parts[1]}* não encontrado no histórico deste bolão.`;

    const p = ranking[idx];
    const cravadas = p.exactscores ?? p.exact_scores ?? 0;
    
    return `📜 *ANÁLISE DETALHADA DO PALPITEIRO* 📜\n\n` +
           `👤 *Nome:* @${p.username || p.name}\n` +
           `🏅 *Posição Geral:* ${idx + 1}º lugar\n` +
           `💯 *Pontuação Total:* ${p.points ?? 0} pts\n` +
           `🎯 *Placares Cravados:* ${cravadas} (Acertos cheios)\n\n` +
           `📊 *Desempenho Técnico:* ${cravadas > 4 ? "🔥 Perigoso e Cirúrgico" : "🐌 Devagar Quase Parando"}\n` +
           `📝 *Veredito:* O histórico não mente, segue na luta!`;
  }

  // ==========================================
  // COMANDO: /chances
  // ==========================================
  if (cmdLower.startsWith("/chances")) {
    const parts = command.split(/\s+/);
    const target = parts.length > 1 ? parts[1] : "seu";
    
    // Cálculo sarcástico baseado na posição estatística ou randômico matemático guiado
    let probabilidade = Math.floor(Math.random() * 40) + 40; // Fallback engraçado
    if (ranking && ranking.length > 0 && parts.length > 1) {
      const user = parts[1].replace("@", "").toLowerCase();
      const idx = ranking.findIndex(p => p.username?.toLowerCase() === user || p.name?.toLowerCase() === user);
      if (idx !== -1) {
        probabilidade = Math.max(1, Math.min(99, 100 - (idx * 7))); // Quanto mais baixo, menor a probabilidade
      }
    }

    return `🧮 *PROBABILIDADE MATEMÁTICA DE GANHAR* 🧮\n\n` +
           `Análise de algoritmos para *${target}*:\n` +
           `📈 Chance estimada de título: *${probabilidade}%*\n\n` +
           `🎲 _Nota do matemático: Os números são exatos, mas a zica do grupo pode alterar os resultados sem aviso prévio!_`;
  }

  return null;
}

export async function handleComplexZueira(command: string, supabase: any, poolId: string): Promise<string | null> {
  const cmdLower = command.toLowerCase();
  const hoje = new Date().toISOString().split('T')[0];

  // ==========================================
  // COMANDO: /secador
  // ==========================================
  if (cmdLower.startsWith("/secador")) {
    const { data: jogos } = await supabase
      .from("matches")
      .select(`id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)`)
      .gte("match_date", `${hoje}T00:00:00Z`)
      .lte("match_date", `${hoje}T23:59:59Z`)
      .eq("status", "scheduled")
      .limit(1);

    if (!jogos || jogos.length === 0) return "🔮 Sem jogos futuros agendados para hoje para secar!";

    const jogo = jogos[0];
    const { data: palpites } = await supabase
      .from("match_predictions")
      .select("home_score, away_score")
      .eq("match_id", jogo.id)
      .eq("pool_id", poolId); // <--- TRAVADO NO BOLÃO NOVO

    if (!palpites || palpites.length === 0) return `🎲 Ninguém registrou palpites abertos em *${jogo.home_team.name} x ${jogo.away_team.name}* ainda.`;

    let home = 0, away = 0, emp = 0;
    palpites.forEach((p: any) => {
      if (p.home_score > p.away_score) home++;
      else if (p.away_score > p.home_score) away++;
      else emp++;
    });

    const total = palpites.length;
    return `💨 *RADAR DO SECADOR* 💨\n\n` +
           `Tendências para *${jogo.home_team.name} x ${jogo.away_team.name}*:\n` +
           `• Vitória ${jogo.home_team.name}: ${Math.round((home/total)*100)}%\n` +
           `• Vitória ${jogo.away_team.name}: ${Math.round((away/total)*100)}%\n` +
           `• Empate: ${Math.round((emp/total)*100)}%\n\n` +
           `📢 Secadores posicionados! Quem errar vai aguentar a corneta!`;
  }

  // ==========================================
  // COMANDO: /zikadodia
  // ==========================================
  if (cmdLower.startsWith("/zikadodia")) {
    const { data: jogos } = await supabase
      .from("matches")
      .select(`id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)`)
      .gte("match_date", `${hoje}T00:00:00Z`)
      .lte("match_date", `${hoje}T23:59:59Z`)
      .limit(1);

    if (!jogos || jogos.length === 0) return "🦎 Sem jogos cadastrados para hoje.";

    const jogo = jogos[0];
    const { data: palpites } = await supabase
      .from("match_predictions")
      .select("home_score, away_score, user:users_custom(username)")
      .eq("match_id", jogo.id)
      .eq("pool_id", poolId); // <--- TRAVADO NO BOLÃO NOVO

    if (!palpites || palpites.length === 0) return "🍀 Sem palpites ousados arquivados hoje.";

    let palpiteZika = palpites[0];
    let maiorGols = 0;
    palpites.forEach((p: any) => {
      const soma = (p.home_score ?? 0) + (p.away_score ?? 0);
      if (soma > maiorGols) {
        maiorGols = soma;
        palpiteZika = p;
      }
    });

    return `🦎 *ZIKA DO DIA SELECT* 🦎\n\n` +
           `Para *${jogo.home_team.name} x ${jogo.away_team.name}*, o prêmio urubu vai para *@${palpiteZika.user?.username || "Alguém"}*!\n` +
           `Apostou em um placar explosivo de *${palpiteZika.home_score} x ${palpiteZika.away_score}*.\n👀 Estamos de olho!`;
  }

  return null;
}