// src/lib/scoring.ts
import { supabase } from "@/integrations/supabase/client";

/**
 * Função auxiliar para registrar os pontos em 'user_points' e atualizar o 'total_points' em 'users_custom'.
 * Esta função agora garante que o total de pontos do usuário é sempre atualizado.
 *
 * @param userId O ID do usuário.
 * @param points A quantidade de pontos a ser adicionada.
 * @param pointsType O tipo de pontuação (ex: 'match', 'group_classification', 'tournament_final').
 * @param predictionId Opcional: ID do palpite específico que gerou os pontos (match_predictions.id, group_predictions.id, final_predictions.id).
 * @param relatedId Opcional: ID do item relacionado que foi pontuado (matches.id, groups.id, tournament_results.id).
 */
async function registerPoints(
  userId: string,
  points: number,
  pointsType: string,
  predictionId: string | null = null,
  relatedId: string | null = null
) {
  console.log(`Registering points for userId: ${userId}, type: ${pointsType}, predictionId: ${predictionId}, relatedId: ${relatedId}`); // Log para depuração
  if (typeof userId !== 'string' || typeof predictionId !== 'string' && predictionId !== null || typeof relatedId !== 'string' && relatedId !== null) {
    console.error('Invalid ID type passed to registerPoints:', { userId, predictionId, relatedId });
    // Considerar lançar um erro aqui ou tratar de forma mais robusta
    // return; // Evita a tentativa de inserção com tipos errados
  }

  try {
    // 1. Inserir o registro de pontos detalhado na tabela user_points
    const { error: insertError } = await supabase.from("user_points").insert({
      user_id: userId,
      points: points,
      points_type: pointsType,
      prediction_id: predictionId,
      related_id: relatedId,
    });

    if (insertError) {
      console.error(`Erro ao inserir registro em user_points para ${userId} (type: ${pointsType}, predId: ${predictionId}, relId: ${relatedId}):`, insertError.message);
      throw insertError;
    }
    console.log(`Ponto detalhado registrado para o usuário ${userId}: ${points} (${pointsType})`);

    // 2. Atualizar o total_points na tabela users_custom
    const { data: userData, error: fetchUserError } = await supabase
      .from("users_custom")
      .select("total_points") // CORRIGIDO de total_score para total_points
      .eq("id", userId)
      .single();

    if (fetchUserError && fetchUserError.code !== "PGRST116") {
      console.error(`Erro ao buscar total_points para o usuário ${userId}:`, fetchUserError.message);
      throw fetchUserError;
    }

    const currentTotalPoints = userData?.total_points || 0; // CORRIGIDO de total_score para total_points
    const newTotalPoints = currentTotalPoints + points;

    const { error: updateTotalError } = await supabase
      .from("users_custom")
      .update({ total_points: newTotalPoints, updated_at: new Date().toISOString() }) // CORRIGIDO de total_score para total_points e adicionado updated_at
      .eq("id", userId);

    if (updateTotalError) {
      console.error(`Erro ao atualizar total_points para o usuário ${userId}:`, updateTotalError.message);
      throw updateTotalError;
    }
    console.log(`Total points para o usuário ${userId} atualizado para ${newTotalPoints}`);

  } catch (error: any) {
    console.error(`Erro crítico no registro e atualização de pontos para o usuário ${userId}:`, error.message);
    // Não relance o erro aqui se quiser que o loop continue para outros usuários,
    // mas o erro já foi logado. Se quiser parar o loop, relance.
    // throw error; 
  }
}

// Certifique-se de que as funções de cálculo de pontos (calculateMatchPoints, etc.) estão corretas
// e chamam registerPoints com os IDs corretos (strings UUID ou null) para predictionId e relatedId.

export async function calculateMatchPoints(
  userId: string,
  predictionId: string | null, // ID do match_predictions
  matchId: string,             // ID da partida (relatedId)
  userHomeScore: number,
  userAwayScore: number,
  actualHomeScore: number,
  actualAwayScore: number
) {
  let points = 0;

  const predictedOutcome = userHomeScore > userAwayScore ? 'home_win' :
                           userAwayScore > userHomeScore ? 'away_win' : 'draw';
  const realOutcome = actualHomeScore > actualAwayScore ? 'home_win' :
                      actualAwayScore > actualHomeScore ? 'away_win' : 'draw';

  if (userHomeScore === actualHomeScore && userAwayScore === actualAwayScore) {
    points = 10;
  }
  else if (predictedOutcome === 'draw' && realOutcome === 'draw') {
    points = 7;
  }
  else if (predictedOutcome === realOutcome) {
    points = 5;
  }
  if (points === 0) { 
    if (userHomeScore === actualHomeScore || userAwayScore === actualAwayScore) {
      points = 3;
    }
  }

  if (points > 0) {
    await registerPoints(userId, points, 'match', predictionId, matchId);
  }
}

export async function calculateGroupClassificationPoints(
  userId: string,
  predictionId: string | null, // ID do group_predictions
  groupId: string,             // ID do grupo (relatedId)
  userFirstTeamId: string | null, // Modificado para aceitar null
  userSecondTeamId: string | null, // Modificado para aceitar null
  actualFirstTeamId: string | null, // Modificado para aceitar null
  actualSecondTeamId: string | null // Modificado para aceitar null
) {
  let points = 0;

  // Adicionar verificações para null antes de comparar
  if (userFirstTeamId && userSecondTeamId && actualFirstTeamId && actualSecondTeamId) {
    if (userFirstTeamId === actualFirstTeamId && userSecondTeamId === actualSecondTeamId) {
      points = 10;
    }
    else if (userFirstTeamId === actualSecondTeamId && userSecondTeamId === actualFirstTeamId) {
      points = 4;
    }
    else if (userFirstTeamId === actualFirstTeamId) {
      points = 5;
    }
    else if (userSecondTeamId === actualSecondTeamId) {
      points = 5;
    }
  }


  if (points > 0) {
    // Certifique-se de que predictionId e groupId são strings (UUIDs) ou null
    const validPredictionId = typeof predictionId === 'string' ? predictionId : null;
    const validGroupId = typeof groupId === 'string' ? groupId : null;
    await registerPoints(userId, points, 'group_classification', validPredictionId, validGroupId);
  }
}

export async function calculateTournamentFinalPoints(
  userId: string,
  predictionId: string | null,      // ID do final_predictions
  tournamentResultId: string | null,// ID do registro de tournament_results (relatedId)
  userChampionId: string | null,
  userViceChampionId: string | null,
  userThirdPlaceId: string | null,
  userFourthPlaceId: string | null,
  userFinalHomeScore: number | null,
  userFinalAwayScore: number | null,
  actualChampionId: string | null,
  actualRunnerUpId: string | null,
  actualThirdPlaceId: string | null,
  actualFourthPlaceId: string | null,
  actualFinalHomeScore: number | null,
  actualFinalAwayScore: number | null
) {
  let points = 0;

  if (userChampionId && actualChampionId && userChampionId === actualChampionId) {
    points += 50;
  }
  if (userViceChampionId && actualRunnerUpId && userViceChampionId === actualRunnerUpId) {
    points += 25;
  }
  if (userThirdPlaceId && actualThirdPlaceId && userThirdPlaceId === actualThirdPlaceId) {
    points += 15;
  }
  if (userFourthPlaceId && actualFourthPlaceId && userFourthPlaceId === actualFourthPlaceId) {
    points += 10;
  }
  if (userFinalHomeScore !== null && actualFinalHomeScore !== null && userFinalAwayScore !== null && actualFinalAwayScore !== null &&
      userFinalHomeScore === actualFinalHomeScore && userFinalAwayScore === actualFinalAwayScore) {
    points += 20;
  }

  if (userChampionId === actualChampionId &&
      userViceChampionId === actualRunnerUpId &&
      userThirdPlaceId === actualThirdPlaceId &&
      userFourthPlaceId === actualFourthPlaceId &&
      actualChampionId && actualRunnerUpId && actualThirdPlaceId && actualFourthPlaceId) { // Garante que todos os 'actual' também não são null
    points += 35; // Bônus
  }

  if (points > 0) {
     // Certifique-se de que predictionId e tournamentResultId são strings (UUIDs) ou null
    const validPredictionId = typeof predictionId === 'string' ? predictionId : null;
    const validTournamentResultId = typeof tournamentResultId === 'string' ? tournamentResultId : null;
    await registerPoints(userId, points, 'tournament_final', validPredictionId, validTournamentResultId);
  }
}