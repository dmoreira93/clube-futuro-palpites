
import { fetchMatchResult, fetchPredictions, fetchScoringCriteria, saveUserPoints, updateUserStats } from "./pointsCalculator/dataAccess";
import { calculateMaximumPoints } from "./pointsCalculator/pointsRules";
import { PointsType } from "./pointsCalculator/types";

/**
 * Atualiza os pontos de todos os usuários para uma partida específica
 * @param matchId ID da partida
 */
export async function updateUserPoints(matchId: string): Promise<boolean> {
  try {
    console.log(`Iniciando atualização de pontos para partida ${matchId}`);
    
    // 1. Buscar o resultado da partida
    const matchResult = await fetchMatchResult(matchId);
    if (!matchResult) {
      console.error('Partida não encontrada ou não finalizada');
      return false;
    }
    
    console.log(`Resultado da partida: ${matchResult.home_score} x ${matchResult.away_score}`);

    // 2. Buscar todos os palpites para esta partida
    const predictions = await fetchPredictions(matchId);
    if (predictions.length === 0) {
      console.log('Nenhum palpite encontrado para esta partida');
      return true; // Nada para processar, mas não é um erro
    }
    
    console.log(`Encontrados ${predictions.length} palpites para esta partida`);

    // 3. Buscar os critérios de pontuação
    const { exactScore, winner, partialScore } = await fetchScoringCriteria();
    
    console.log(`Critérios de pontuação: Placar Exato=${exactScore}, Vencedor=${winner}, Placar Parcial=${partialScore}`);

    // 4. Calcular e salvar os pontos para cada palpite
    const processedUserIds = new Set<string>();
    const pointsSummary = {
      [PointsType.EXACT_SCORE]: 0,
      [PointsType.CORRECT_WINNER]: 0,
      [PointsType.PARTIAL_SCORE]: 0,
      [PointsType.NO_POINTS]: 0,
      total: 0
    };
    
    for (const prediction of predictions) {
      // Calcular os pontos com base nas regras
      const pointsResult = calculateMaximumPoints(
        prediction, 
        matchResult, 
        exactScore, 
        winner, 
        partialScore
      );
      
      if (pointsResult) {
        // Incrementar estatísticas
        pointsSummary[pointsResult.pointsType as PointsType]++;
        pointsSummary.total++;
        
        // Salvar os pontos
        const saved = await saveUserPoints(pointsResult);
        if (saved) {
          // Adicionar o ID do usuário ao conjunto de usuários processados
          processedUserIds.add(prediction.user_id);
        }
      }
    }

    // 5. Atualizar as estatísticas para cada usuário afetado
    for (const userId of processedUserIds) {
      await updateUserStats(userId);
    }

    console.log(`Pontuação atualizada para ${processedUserIds.size} usuários na partida ${matchId}`);
    console.log(`Resumo de pontuação: `, pointsSummary);
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar pontos dos usuários:', error);
    return false;
  }
}
