// zueira.ts
export function handleZueiraCommands(incomingText: string, ranking: any[]): string | null {
  
  // ==========================================
  // COMANDO: /inverterranking
  // ==========================================
  if (incomingText.startsWith("/inverterranking")) {
    if (!ranking || ranking.length === 0) return "🏮 O ranking está tão vazio que não dá nem para inverter!";
    
    // Inverte a cópia do ranking para não afetar o original
    const invertedRanking = [...ranking].reverse();
    
    let responseText = "🙃 RANKING INVERTIDO (MUNDO PARALELO) 🙃\n\n";
    invertedRanking.forEach((p: any, index: number) => {
      let emoji = "🔹";
      if (index === 0) emoji = "🏮"; // O lanterna vira líder com emoji de lanterna
      else if (index === invertedRanking.length - 1) emoji = "🥇"; // O líder vai para o fim
      
      const displayUser = p.username || p.name || p.email || "Participante";
      responseText += `${emoji} ${index + 1}º ${displayUser} — ${p.points ?? 0} pts\n`;
    });
    
    responseText += "\n🚀 Parabéns aos últimos que agora são os primeiros!";
    return responseText;
  }

  // ==========================================
  // COMANDO: /piorparticipante
  // ==========================================
  if (incomingText.startsWith("/piorparticipante")) {
    return "🤡 O troféu 'Inimigo do Acerto' vai para: @abrandalize.\n\nLegendas dizem que se ele chutar que vai chover, o céu abre na hora!";
  }

  // Se não for nenhum comando de zueira, retorna null para o index seguir o fluxo normal
  return null;
}