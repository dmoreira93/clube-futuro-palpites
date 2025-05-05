
import { fetchMatchResult, fetchPredictions, fetchScoringCriteria, saveUserPoints, updateUserStats } from "./pointsCalculator/dataAccess";
import { calculateMaximumPoints } from "./pointsCalculator/pointsRules";

/**
 * Atualiza os pontos de todos os usuários para uma partida específica
 * @param matchId ID da partida
 */
export async function updateUserPoints(matchId: string): Promise<boolean> {
  try {
    // 1. Buscar o resultado da partida
    const matchResult = await fetchMatchResult(matchId);
    if (!matchResult) {
      console.error('Partida não encontrada ou não finalizada');
      return false;
    }

    // 2. Buscar todos os palpites para esta partida
    const predictions = await fetchPredictions(matchId);
    if (predictions.length === 0) {
      console.log('Nenhum palpite encontrado para esta partida');
      return true; // Nada para processar, mas não é um erro
    }

    // 3. Buscar os critérios de pontuação
    const { exactScore, winner, partialScore } = await fetchScoringCriteria();

    // 4. Calcular e salvar os pontos para cada palpite
    const processedUserIds = new Set<string>();
    
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
    return true;
  } catch (error) {
    console.error('Erro ao atualizar pontos dos usuários:', error);
    return false;
  }
}
