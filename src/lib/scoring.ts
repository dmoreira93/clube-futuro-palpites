// src/lib/scoring.ts
import { supabase } from "@/integrations/supabase/client";

async function registerPoints(
  userId: string,
  points: number,
  pointsType: string,
  predictionId: string | null = null,
  relatedEntityId: string | null = null // Renomeado para clareza
) {
  console.log(`Attempting to register points for userId: ${userId}, type: ${pointsType}, predictionId: ${predictionId}, relatedEntityId: ${relatedEntityId}`);
  // Verificação básica dos tipos de ID
  if (typeof userId !== 'string' || (predictionId !== null && typeof predictionId !== 'string') || (relatedEntityId !== null && typeof relatedEntityId !== 'string')) {
    console.error('Invalid ID type detected before calling Supabase. Ensure all IDs are strings or null.', { userId, predictionId, relatedEntityId });
    // Não lançar erro aqui permite que a tentativa de inserção ocorra e o erro do BD seja mais informativo se for o caso.
  }

  try {
    const insertData: {
      user_id: string;
      points: number;
      points_type: string;
      prediction_id?: string | null;
      match_id?: string | null;      // Coluna para ID da partida
      related_id?: string | null;    // Coluna para ID de grupo, resultado do torneio, etc.
    } = {
      user_id: userId,
      points: points,
      points_type: pointsType,
      prediction_id: predictionId,
    };

    if (pointsType === 'match') {
      insertData.match_id = relatedEntityId; // relatedEntityId é o matchId neste caso
      insertData.related_id = null; // Ou poderia ser o mesmo, dependendo da sua lógica para related_id
    } else if (pointsType === 'group_classification') {
      insertData.match_id = null; // Agora permitido pela alteração na tabela
      insertData.related_id = relatedEntityId; // relatedEntityId é o groupId
    } else if (pointsType === 'tournament_final') {
      insertData.match_id = null; // Agora permitido
      insertData.related_id = relatedEntityId; // relatedEntityId é o tournamentResultId
    } else {
      // Lidar com outros tipos de pontos se houver, ou definir defaults
      insertData.match_id = null;
      insertData.related_id = relatedEntityId;
    }

    const { error: insertError } = await supabase
      .from("user_points")
      .insert(insertData);

    if (insertError) {
      console.error(`Erro ao inserir registro em user_points para ${userId} (type: ${pointsType}, data: ${JSON.stringify(insertData)}):`, insertError.message);
      throw insertError; // Relançar para que a função chamadora saiba que falhou
    }
    console.log(`Ponto detalhado registrado para o usuário ${userId}: <span class="math-inline">\{points\} \(</span>{pointsType})`);

    // Atualizar total_points em users_custom (já corrigido para total_points)
    const { data: userData, error: fetchUserError } = await supabase
      .from("users_custom")
      .select("total_points")
      .eq("id", userId)
      .single();

    if (fetchUserError && fetchUserError.code !== "PGRST116") {
      console.error(`Erro ao buscar total_points para o usuário ${userId}:`, fetchUserError.message);
      throw fetchUserError;
    }

    const currentTotalPoints = userData?.total_points || 0;
    const newTotalPoints = currentTotalPoints + points;

    const { error: updateTotalError } = await supabase
      .from("users_custom")
      .update({ total_points: newTotalPoints, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (updateTotalError) {
      console.error(`Erro ao atualizar total_points para o usuário ${userId}:`, updateTotalError.message);
      throw updateTotalError;
    }
    console.log(`Total points para o usuário ${userId} atualizado para ${newTotalPoints}`);

  } catch (error: any) {
    console.error(`Erro crítico no registro e atualização de pontos para o usuário ${userId} (relacionado a ${pointsType}):`, error.message);
    throw error; // Relançar para que a função chamadora saiba que falhou
  }
}

// Mantenha as funções de cálculo como estavam (calculateMatchPoints, calculateGroupClassificationPoints, calculateTournamentFinalPoints)
// mas garanta que elas passem o ID correto da entidade principal (partida, grupo, resultado do torneio)
// como o último argumento (relatedEntityId) para registerPoints.
// E o ID do palpite específico como penúltimo argumento (predictionId).

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
   if (userHomeScore === actualHomeScore && userAwayScore === actualAwayScore) {
     points = 10;
   } else if (predictedOutcome === 'draw' && realOutcome === 'draw') {
     points = 7;
   } else if (predictedOutcome === realOutcome) {
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
   predictionId: string | null, 
   groupId: string,             
   userFirstTeamId: string | null, 
   userSecondTeamId: string | null,
   actualFirstTeamId: string | null, 
   actualSecondTeamId: string | null
 ) {
   let points = 0;
   if (userFirstTeamId && userSecondTeamId && actualFirstTeamId && actualSecondTeamId) {
     if (userFirstTeamId === actualFirstTeamId && userSecondTeamId === actualSecondTeamId) {
       points = 10;
     } else if (userFirstTeamId === actualSecondTeamId && userSecondTeamId === actualFirstTeamId) {
       points = 4;
     } else if (userFirstTeamId === actualFirstTeamId) {
       points = 5;
     } else if (userSecondTeamId === actualSecondTeamId) {
       points = 5;
     }
   }
   if (points > 0) {
     await registerPoints(userId, points, 'group_classification', predictionId, groupId);
   }
 }
 
 export async function calculateTournamentFinalPoints(
   userId: string,
   predictionId: string | null,      
   tournamentResultId: string | null,
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
       actualChampionId && actualRunnerUpId && actualThirdPlaceId && actualFourthPlaceId) { 
     points += 35; 
   }
   if (points > 0) {
     await registerPoints(userId, points, 'tournament_final', predictionId, tournamentResultId);
   }
 }