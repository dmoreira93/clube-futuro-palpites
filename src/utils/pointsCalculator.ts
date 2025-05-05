
/**
 * Utilitário para cálculo de pontos com base nos critérios definidos
 */

// Pontos para diferentes tipos de acertos
export enum PointsType {
  EXACT_SCORE = "EXACT_SCORE", // Placar exato
  CORRECT_WINNER = "CORRECT_WINNER", // Vencedor correto
  CORRECT_DRAW = "CORRECT_DRAW", // Empate correto
  PARTIAL_SCORE = "PARTIAL_SCORE", // Acertou gols de um dos times
  PARTIAL_DRAW = "PARTIAL_DRAW", // Acerto de gols de um time em empate
  GROUP_FIRST_PLACE = "GROUP_FIRST_PLACE", // Acertar o 1º lugar do grupo
  GROUP_SECOND_PLACE = "GROUP_SECOND_PLACE", // Acertar o 2º lugar do grupo
  GROUP_BOTH_CORRECT_ORDER = "GROUP_BOTH_CORRECT_ORDER", // Bônus por acertar 1º e 2º na ordem
  GROUP_ONE_CORRECT_WRONG_POSITION = "GROUP_ONE_CORRECT_WRONG_POSITION", // Um classificado na posição errada
  CHAMPION = "CHAMPION", // Campeão
  RUNNER_UP = "RUNNER_UP", // Vice-campeão
  THIRD_PLACE = "THIRD_PLACE", // Terceiro lugar
  FOURTH_PLACE = "FOURTH_PLACE", // Quarto lugar
  NO_POINTS = "NO_POINTS" // Sem pontos
}

// Interface para configuração de pontos
export interface PointsConfig {
  [PointsType.EXACT_SCORE]: number;
  [PointsType.CORRECT_WINNER]: number;
  [PointsType.CORRECT_DRAW]: number;
  [PointsType.PARTIAL_SCORE]: number;
  [PointsType.PARTIAL_DRAW]: number;
  [PointsType.GROUP_FIRST_PLACE]: number;
  [PointsType.GROUP_SECOND_PLACE]: number;
  [PointsType.GROUP_BOTH_CORRECT_ORDER]: number;
  [PointsType.GROUP_ONE_CORRECT_WRONG_POSITION]: number;
  [PointsType.CHAMPION]: number;
  [PointsType.RUNNER_UP]: number;
  [PointsType.THIRD_PLACE]: number;
  [PointsType.FOURTH_PLACE]: number;
  [PointsType.NO_POINTS]: number;
}

// Critérios e pontuações padrão
export const DEFAULT_POINTS: PointsConfig = {
  [PointsType.EXACT_SCORE]: 10,
  [PointsType.CORRECT_WINNER]: 7,
  [PointsType.CORRECT_DRAW]: 7,
  [PointsType.PARTIAL_SCORE]: 2,
  [PointsType.PARTIAL_DRAW]: 3, // Mais pontos para acerto parcial em empate
  [PointsType.GROUP_FIRST_PLACE]: 8,
  [PointsType.GROUP_SECOND_PLACE]: 6,
  [PointsType.GROUP_BOTH_CORRECT_ORDER]: 5, // Bônus adicional
  [PointsType.GROUP_ONE_CORRECT_WRONG_POSITION]: 3,
  [PointsType.CHAMPION]: 15,
  [PointsType.RUNNER_UP]: 10,
  [PointsType.THIRD_PLACE]: 8,
  [PointsType.FOURTH_PLACE]: 6,
  [PointsType.NO_POINTS]: 0
};

/**
 * Tipo de resultado para cálculos de pontos
 */
export interface PointResult {
  type: PointsType;
  points: number;
}

/**
 * Calcula o resultado de um palpite para jogo baseado nos critérios
 * @param predictionHome Gols previstos para o time da casa
 * @param predictionAway Gols previstos para o time visitante
 * @param actualHome Gols reais do time da casa
 * @param actualAway Gols reais do time visitante
 * @returns Tipo de acerto e pontos obtidos
 */
export const calculateMatchPoints = (
  predictionHome: number,
  predictionAway: number,
  actualHome: number,
  actualAway: number,
  pointsConfig: PointsConfig = DEFAULT_POINTS
): PointResult => {
  // Acertou o placar exato
  if (predictionHome === actualHome && predictionAway === actualAway) {
    return {
      type: PointsType.EXACT_SCORE,
      points: pointsConfig[PointsType.EXACT_SCORE]
    };
  }

  // Verificar se acertou o vencedor ou empate
  const actualWinner = actualHome > actualAway ? "home" : actualHome < actualAway ? "away" : "draw";
  const predictionWinner = predictionHome > predictionAway ? "home" : predictionHome < predictionAway ? "away" : "draw";

  // Acertou empate, mas não o placar exato
  if (actualWinner === "draw" && predictionWinner === "draw") {
    // Acertou o número de gols de um time no empate
    if (predictionHome === actualHome || predictionAway === actualAway) {
      return {
        type: PointsType.PARTIAL_DRAW,
        points: pointsConfig[PointsType.PARTIAL_DRAW]
      };
    }
    
    return {
      type: PointsType.CORRECT_DRAW,
      points: pointsConfig[PointsType.CORRECT_DRAW]
    };
  }

  // Acertou o vencedor, mas não o placar exato
  if (actualWinner === predictionWinner && actualWinner !== "draw") {
    return {
      type: PointsType.CORRECT_WINNER,
      points: pointsConfig[PointsType.CORRECT_WINNER]
    };
  }

  // Acertou o número de gols de um time
  if (predictionHome === actualHome || predictionAway === actualAway) {
    return {
      type: PointsType.PARTIAL_SCORE,
      points: pointsConfig[PointsType.PARTIAL_SCORE]
    };
  }

  // Não acertou nada
  return {
    type: PointsType.NO_POINTS,
    points: 0
  };
};

/**
 * Interface para time previsto em classificação de grupo
 */
export interface TeamPrediction {
  teamId: string;
  position: number;
}

/**
 * Calcula pontos para classificação de grupo
 * @param predictedTeams Times previstos pelo usuário (1º e 2º lugar)
 * @param actualTeams Classificação real dos times no grupo
 * @param pointsConfig Configuração de pontos
 * @returns Array com resultados de pontos por time
 */
export const calculateGroupPoints = (
  predictedTeams: TeamPrediction[],
  actualTeams: TeamPrediction[],
  pointsConfig: PointsConfig = DEFAULT_POINTS
): PointResult[] => {
  const results: PointResult[] = [];
  const predictedFirst = predictedTeams.find(t => t.position === 1);
  const predictedSecond = predictedTeams.find(t => t.position === 2);
  const actualFirst = actualTeams.find(t => t.position === 1);
  const actualSecond = actualTeams.find(t => t.position === 2);
  
  // Verifica se previu corretamente o 1º colocado
  if (predictedFirst && actualFirst && predictedFirst.teamId === actualFirst.teamId) {
    results.push({
      type: PointsType.GROUP_FIRST_PLACE,
      points: pointsConfig[PointsType.GROUP_FIRST_PLACE]
    });
  }
  
  // Verifica se previu corretamente o 2º colocado
  if (predictedSecond && actualSecond && predictedSecond.teamId === actualSecond.teamId) {
    results.push({
      type: PointsType.GROUP_SECOND_PLACE,
      points: pointsConfig[PointsType.GROUP_SECOND_PLACE]
    });
  }
  
  // Bônus por acertar os dois na ordem correta
  if (results.length === 2) {
    results.push({
      type: PointsType.GROUP_BOTH_CORRECT_ORDER,
      points: pointsConfig[PointsType.GROUP_BOTH_CORRECT_ORDER]
    });
  } 
  // Verificar se acertou algum time classificado mas na posição errada
  else if (results.length === 0) {
    // Verificar se o time previsto como 1º ficou em 2º
    if (predictedFirst && actualSecond && predictedFirst.teamId === actualSecond.teamId) {
      results.push({
        type: PointsType.GROUP_ONE_CORRECT_WRONG_POSITION,
        points: pointsConfig[PointsType.GROUP_ONE_CORRECT_WRONG_POSITION]
      });
    }
    
    // Verificar se o time previsto como 2º ficou em 1º
    if (predictedSecond && actualFirst && predictedSecond.teamId === actualFirst.teamId) {
      results.push({
        type: PointsType.GROUP_ONE_CORRECT_WRONG_POSITION,
        points: pointsConfig[PointsType.GROUP_ONE_CORRECT_WRONG_POSITION]
      });
    }
  }
  
  // Se não houve acertos, retorna sem pontos
  if (results.length === 0) {
    results.push({
      type: PointsType.NO_POINTS,
      points: 0
    });
  }
  
  return results;
};

/**
 * Calcula pontos para classificação final (campeão, vice, etc.)
 * @param predictedTeamId ID do time previsto para determinada posição
 * @param actualTeamId ID do time que realmente ficou na posição
 * @param positionType Tipo de posição (campeão, vice, etc.)
 * @param pointsConfig Configuração de pontos
 * @returns Resultado de pontos
 */
export const calculateFinalPositionPoints = (
  predictedTeamId: string,
  actualTeamId: string,
  positionType: PointsType.CHAMPION | PointsType.RUNNER_UP | PointsType.THIRD_PLACE | PointsType.FOURTH_PLACE,
  pointsConfig: PointsConfig = DEFAULT_POINTS
): PointResult => {
  if (predictedTeamId === actualTeamId) {
    return {
      type: positionType,
      points: pointsConfig[positionType]
    };
  }
  
  return {
    type: PointsType.NO_POINTS,
    points: 0
  };
};

/**
 * Função para calcular e atualizar os pontos no Supabase
 * Esta função será chamada após o registro de um resultado
 */
export const updateUserPoints = async (matchId: string) => {
  const { supabase } = await import('@/integrations/supabase/client');
  
  try {
    // Buscar o resultado da partida
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .select('*, home_team:home_team_id(*), away_team:away_team_id(*)')
      .eq('id', matchId)
      .single();

    if (matchError || !matchData) {
      console.error("Erro ao buscar dados da partida:", matchError);
      return;
    }

    // Verificar se a partida está finalizada e tem resultados
    if (!matchData.is_finished || matchData.home_score === null || matchData.away_score === null) {
      console.error("Partida não finalizada ou sem resultados");
      return;
    }

    const actualHome = matchData.home_score;
    const actualAway = matchData.away_score;

    // Buscar todos os palpites para esta partida
    const { data: predictionsData, error: predictionsError } = await supabase
      .from('predictions')
      .select('*, user:user_id(*)')
      .eq('match_id', matchId);

    if (predictionsError) {
      console.error("Erro ao buscar palpites:", predictionsError);
      return;
    }

    // Buscar critérios de pontuação do banco de dados ou usar padrão
    const { data: criteriaData, error: criteriaError } = await supabase
      .from('scoring_criteria')
      .select('*');
    
    let pointsConfig = DEFAULT_POINTS;

    if (!criteriaError && criteriaData && criteriaData.length > 0) {
      // Converter critérios do banco para o formato usado pela função
      pointsConfig = {
        EXACT_SCORE: criteriaData.find(c => c.name === 'Acerto Exato')?.points || DEFAULT_POINTS.EXACT_SCORE,
        CORRECT_WINNER: criteriaData.find(c => c.name === 'Acerto Vencedor')?.points || DEFAULT_POINTS.CORRECT_WINNER,
        CORRECT_DRAW: criteriaData.find(c => c.name === 'Acerto Empate')?.points || DEFAULT_POINTS.CORRECT_DRAW,
        PARTIAL_SCORE: criteriaData.find(c => c.name === 'Acerto Gols')?.points || DEFAULT_POINTS.PARTIAL_SCORE,
        PARTIAL_DRAW: criteriaData.find(c => c.name === 'Acerto Gols Empate')?.points || DEFAULT_POINTS.PARTIAL_DRAW,
        GROUP_FIRST_PLACE: criteriaData.find(c => c.name === 'Primeiro do Grupo')?.points || DEFAULT_POINTS.GROUP_FIRST_PLACE,
        GROUP_SECOND_PLACE: criteriaData.find(c => c.name === 'Segundo do Grupo')?.points || DEFAULT_POINTS.GROUP_SECOND_PLACE,
        GROUP_BOTH_CORRECT_ORDER: criteriaData.find(c => c.name === 'Bônus Ordem Grupo')?.points || DEFAULT_POINTS.GROUP_BOTH_CORRECT_ORDER,
        GROUP_ONE_CORRECT_WRONG_POSITION: criteriaData.find(c => c.name === 'Classificado Posição Errada')?.points || DEFAULT_POINTS.GROUP_ONE_CORRECT_WRONG_POSITION,
        CHAMPION: criteriaData.find(c => c.name === 'Campeão')?.points || DEFAULT_POINTS.CHAMPION,
        RUNNER_UP: criteriaData.find(c => c.name === 'Vice-Campeão')?.points || DEFAULT_POINTS.RUNNER_UP,
        THIRD_PLACE: criteriaData.find(c => c.name === 'Terceiro Lugar')?.points || DEFAULT_POINTS.THIRD_PLACE,
        FOURTH_PLACE: criteriaData.find(c => c.name === 'Quarto Lugar')?.points || DEFAULT_POINTS.FOURTH_PLACE,
        NO_POINTS: 0
      };
    }

    // Para cada palpite, calcular os pontos
    if (predictionsData && predictionsData.length > 0) {
      for (const prediction of predictionsData) {
        const result = calculateMatchPoints(
          prediction.home_score,
          prediction.away_score,
          actualHome,
          actualAway,
          pointsConfig
        );

        // Verificar se o usuário já tem pontos registrados para esta partida
        const { data: existingPoints, error: existingPointsError } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', prediction.user_id)
          .eq('match_id', matchId)
          .single();

        if (existingPointsError && existingPointsError.code !== 'PGRST116') {
          console.error(`Erro ao verificar pontos existentes para usuário ${prediction.user_id}:`, existingPointsError);
          continue;
        }

        // Se já existir registro, atualizar. Caso contrário, inserir novo
        if (existingPoints) {
          const { error: updateError } = await supabase
            .from('user_points')
            .update({
              points: result.points,
              points_type: result.type,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingPoints.id);

          if (updateError) {
            console.error(`Erro ao atualizar pontos para usuário ${prediction.user_id}:`, updateError);
          }
        } else {
          const { error: insertError } = await supabase
            .from('user_points')
            .insert({
              user_id: prediction.user_id,
              match_id: matchId,
              points: result.points,
              points_type: result.type,
              prediction_id: prediction.id
            });

          if (insertError) {
            console.error(`Erro ao inserir pontos para usuário ${prediction.user_id}:`, insertError);
          }
        }

        // Atualizar o total de pontos do usuário
        await updateUserTotalPoints(prediction.user_id);
      }
    }

    return true;
  } catch (error) {
    console.error("Erro ao atualizar pontuações:", error);
    return false;
  }
};

/**
 * Atualiza o total de pontos de um usuário
 * @param userId ID do usuário
 */
export const updateUserTotalPoints = async (userId: string) => {
  const { supabase } = await import('@/integrations/supabase/client');
  
  try {
    // Buscar todos os pontos do usuário
    const { data: pointsData, error: pointsError } = await supabase
      .from('user_points')
      .select('points')
      .eq('user_id', userId);

    if (pointsError) {
      console.error(`Erro ao buscar pontos do usuário ${userId}:`, pointsError);
      return;
    }

    // Calcular o total de pontos
    const totalPoints = pointsData?.reduce((sum, item) => sum + (item.points || 0), 0) || 0;
    
    // Verificar se o usuário já tem um registro na tabela user_stats
    const { data: existingStats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      console.error(`Erro ao verificar estatísticas do usuário ${userId}:`, statsError);
      return;
    }

    // Buscar quantidade de partidas previstas pelo usuário
    const { count, error: countError } = await supabase
      .from('predictions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
      
    if (countError) {
      console.error(`Erro ao contar previsões do usuário ${userId}:`, countError);
      return;
    }

    const matchesPlayed = count || 0;
    const accuracy = matchesPlayed > 0 
      ? Math.round((totalPoints / (matchesPlayed * 10)) * 100)  // considerando 10 como pontuação máxima por jogo
      : 0;

    // Atualizar ou inserir estatísticas do usuário
    if (existingStats) {
      const { error: updateError } = await supabase
        .from('user_stats')
        .update({
          total_points: totalPoints,
          matches_played: matchesPlayed,
          accuracy_percentage: accuracy,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error(`Erro ao atualizar estatísticas do usuário ${userId}:`, updateError);
      }
    } else {
      const { error: insertError } = await supabase
        .from('user_stats')
        .insert({
          user_id: userId,
          total_points: totalPoints,
          matches_played: matchesPlayed,
          accuracy_percentage: accuracy
        });

      if (insertError) {
        console.error(`Erro ao inserir estatísticas do usuário ${userId}:`, insertError);
      }
    }
  } catch (error) {
    console.error(`Erro ao atualizar total de pontos do usuário ${userId}:`, error);
  }
};
