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
  try {
    // 1. Inserir o registro de pontos detalhado na tabela user_points
    const { error: insertError } = await supabase.from("user_points").insert({
      user_id: userId,
      points: points,
      points_type: pointsType,
      prediction_id: predictionId,
      related_id: relatedId,
      // created_at e updated_at serão preenchidos automaticamente pelo Supabase se configurado
      // ou você pode descomentar as linhas abaixo se preferir definir explicitamente
      // created_at: new Date().toISOString(),
      // updated_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error(`Erro ao inserir registro em user_points para ${userId}:`, insertError.message);
      throw insertError;
    }
    console.log(`Ponto detalhado registrado para o usuário ${userId}: ${points} (${pointsType})`);

    // 2. Atualizar o total_points na tabela users_custom
    // Primeiro, busque o total_points atual do usuário
    const { data: userData, error: fetchUserError } = await supabase
      .from("users_custom")
      .select("total_points")
      .eq("id", userId)
      .single(); // Usa .single() para buscar um único registro

    // Tratamento de erro para fetchUserError
    // PGRST116 é o código para "No rows found" - isso pode acontecer se o usuário não for encontrado
    if (fetchUserError && fetchUserError.code !== "PGRST116") {
      console.error(`Erro ao buscar total_points para o usuário ${userId}:`, fetchUserError.message);
      throw fetchUserError;
    }

    const currentTotalPoints = userData?.total_points || 0; // Assume 0 se total_points for null ou undefined
    const newTotalPoints = currentTotalPoints + points;

    // Atualiza a coluna total_points na tabela users_custom
    const { error: updateTotalError } = await supabase
      .from("users_custom")
      .update({ total_points: newTotalPoints })
      .eq("id", userId);

    if (updateTotalError) {
      console.error(`Erro ao atualizar total_points para o usuário ${userId}:`, updateTotalError.message);
      throw updateTotalError;
    }
    console.log(`Total points para o usuário ${userId} atualizado para ${newTotalPoints}`);

  } catch (error: any) {
    console.error(`Erro crítico no registro e atualização de pontos para o usuário ${userId}:`, error.message);
    throw error;
  }
}

/**
 * Calcula os pontos de um usuário para um palpite de partida da fase de grupos.
 * As regras são as suas, adaptadas para a nova assinatura e para chamar `registerPoints`.
 *
 * @param userId ID do usuário que fez o palpite.
 * @param predictionId ID do palpite na tabela `match_predictions`.
 * @param matchId ID da partida.
 * @param userHomeScore Palpite de gols do time da casa do usuário.
 * @param userAwayScore Palpite de gols do time de fora do usuário.
 * @param actualHomeScore Gols reais do time da casa.
 * @param actualAwayScore Gols reais do time de fora.
 */
export async function calculateMatchPoints(
  userId: string,
  predictionId: string | null,
  matchId: string,
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

  // 1. Placar exato - Acertar o placar exato de ambos os times - 10 pontos
  if (userHomeScore === actualHomeScore && userAwayScore === actualAwayScore) {
    points = 10;
  }
  // 2. Acerto empate - Acertar empate com placar diferente - 7 pontos
  else if (predictedOutcome === 'draw' && realOutcome === 'draw') {
    points = 7;
  }
  // 3. Vencedor da partida - Acertar apenas o time vencedor da partida (outro placar) - 5 pontos
  else if (predictedOutcome === realOutcome) {
    points = 5;
  }
  // 4. Acertar placar de um time - Acertar o numero de gols de um dos times - 3 pontos
  // Esta condição só é verificada se NENHUMA das regras de maior pontuação foi atingida.
  if (points === 0) { // Verifica se ainda não pontuou com as regras mais "fortes"
    if (userHomeScore === actualHomeScore || userAwayScore === actualAwayScore) {
      points = 3;
    }
  }

  // Se pontos foram ganhos, registre-os
  if (points > 0) {
    await registerPoints(userId, points, 'match', predictionId, matchId);
  }
}

/**
 * Calcula os pontos de um usuário para o palpite da classificação de um grupo.
 * As regras são as suas, adaptadas para a nova assinatura e para chamar `registerPoints`.
 *
 * @param userId ID do usuário.
 * @param predictionId ID do palpite na tabela `group_predictions`.
 * @param groupId ID do grupo.
 * @param userFirstTeamId Palpite do 1º lugar do usuário.
 * @param userSecondTeamId Palpite do 2º lugar do usuário.
 * @param actualFirstTeamId Real 1º lugar.
 * @param actualSecondTeamId Real 2º lugar.
 */
export async function calculateGroupClassificationPoints(
  userId: string,
  predictionId: string | null,
  groupId: string,
  userFirstTeamId: string,
  userSecondTeamId: string,
  actualFirstTeamId: string,
  actualSecondTeamId: string
) {
  let points = 0;

  // Acertar ambos os classificados do grupo em ordem - 10 pontos
  if (userFirstTeamId === actualFirstTeamId && userSecondTeamId === actualSecondTeamId) {
    points = 10;
  }
  // Classificados invertidos - Acertar os dois classificados em ordem invertida - 4 pontos
  else if (userFirstTeamId === actualSecondTeamId && userSecondTeamId === actualFirstTeamId) {
    points = 4;
  }
  // Acertar apenas o primeiro - Acertar apenas o primeiro classificado - 5 pontos
  else if (userFirstTeamId === actualFirstTeamId) {
    points = 5;
  }
  // Acertar apenas o segundo - Acertar apenas o segundo classificado - 5 pontos
  else if (userSecondTeamId === actualSecondTeamId) {
    points = 5;
  }

  // Se pontos foram ganhos, registre-os
  if (points > 0) {
    await registerPoints(userId, points, 'group_classification', predictionId, groupId);
  }
}

/**
 * Calcula os pontos de um usuário para os palpites das fases finais do torneio e placar final.
 * As regras são as suas, adaptadas para a nova assinatura e para chamar `registerPoints`.
 *
 * @param userId ID do usuário.
 * @param predictionId ID do palpite na tabela `final_predictions`.
 * @param tournamentResultId ID do registro na tabela `tournament_results` (assumindo que há um único registro para os resultados finais do torneio).
 * @param userChampionId Palpite Campeão do usuário.
 * @param userViceChampionId Palpite Vice-Campeão do usuário.
 * @param userThirdPlaceId Palpite 3º lugar do usuário.
 * @param userFourthPlaceId Palpite 4º lugar do usuário.
 * @param userFinalHomeScore Palpite placar final casa do usuário.
 * @param userFinalAwayScore Palpite placar final fora do usuário.
 * @param actualChampionId Campeão real.
 * @param actualRunnerUpId Vice-Campeão real.
 * @param actualThirdPlaceId 3º lugar real.
 * @param actualFourthPlaceId 4º lugar real.
 * @param actualFinalHomeScore Placar final real casa.
 * @param actualFinalAwayScore Placar final real fora.
 */
export async function calculateTournamentFinalPoints(
  userId: string,
  predictionId: string | null,
  tournamentResultId: string, // Pode ser um ID fixo ou o ID do único registro de resultados finais
  userChampionId: string,
  userViceChampionId: string,
  userThirdPlaceId: string,
  userFourthPlaceId: string,
  userFinalHomeScore: number,
  userFinalAwayScore: number,
  actualChampionId: string,
  actualRunnerUpId: string,
  actualThirdPlaceId: string,
  actualFourthPlaceId: string,
  actualFinalHomeScore: number,
  actualFinalAwayScore: number
) {
  let points = 0;

  // Acertar o campeão - 50 pontos
  if (userChampionId === actualChampionId) {
    points += 50;
  }

  // Acertar o vice campeão - 25 pontos
  if (userViceChampionId === actualRunnerUpId) {
    points += 25;
  }

  // Acertar o terceiro colocado - 15 pontos
  if (userThirdPlaceId === actualThirdPlaceId) {
    points += 15;
  }

  // Acertar o quarto colocado - 10 pontos
  if (userFourthPlaceId === actualFourthPlaceId) {
    points += 10;
  }

  // Acertar o placar FINAL - Acertar o placar da final (independente dos times) - 20 pontos
  if (userFinalHomeScore === actualFinalHomeScore && userFinalAwayScore === actualFinalAwayScore) {
    points += 20;
  }

  // BÔNUS: Acertar os 4 finalistas (campeão, vice, terceiro e quarto em ordem exata) - 35 pontos
  // Este é um bônus que se soma aos pontos individuais já ganhos.
  if (
    userChampionId === actualChampionId &&
    userViceChampionId === actualRunnerUpId &&
    userThirdPlaceId === actualThirdPlaceId &&
    userFourthPlaceId === actualFourthPlaceId
  ) {
    points += 35;
  }

  // Se pontos foram ganhos, registre-os
  if (points > 0) {
    await registerPoints(userId, points, 'tournament_final', predictionId, tournamentResultId);
  }
}