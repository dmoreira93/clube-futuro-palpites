// src/lib/scoring.ts

/**
 * Interface para a estrutura de um palpite de partida de um usuário.
 */
interface MatchPrediction {
  homeGoals: number;
  awayGoals: number;
}

/**
 * Interface para a estrutura do resultado real de uma partida.
 */
interface MatchResult {
  homeGoals: number;
  awayGoals: number;
}

/**
 * Calcula os pontos de um usuário para um palpite de partida da fase de grupos.
 *
 * Regras:
 * - Placar exato (ambos os times): 10 pontos
 * - Empate com placar diferente: 7 pontos
 * - Vencedor da partida (outro placar): 5 pontos
 * - Acertar o número de gols de um dos times (e não acertou as regras acima): 3 pontos
 *
 * @param userPrediction O palpite do usuário (gols do time da casa, gols do time de fora).
 * @param realResult O resultado real da partida (gols do time da casa, gols do time de fora).
 * @returns O número de pontos ganhos pelo usuário.
 */
export function calculateMatchPoints(userPrediction: MatchPrediction, realResult: MatchResult): number {
  let points = 0;

  const predictedHomeGoals = userPrediction.homeGoals;
  const predictedAwayGoals = userPrediction.awayGoals;
  const realHomeGoals = realResult.homeGoals;
  const realAwayGoals = realResult.awayGoals;

  // Determina o vencedor (ou empate) do palpite e do resultado real
  const predictedOutcome = predictedHomeGoals > predictedAwayGoals ? 'home_win' :
                           predictedAwayGoals > predictedHomeGoals ? 'away_win' : 'draw';
  const realOutcome = realHomeGoals > realAwayGoals ? 'home_win' :
                     realAwayGoals > realHomeGoals ? 'away_win' : 'draw';

  // 1. Placar exato - Acertar o placar exato de ambos os times - 10 pontos
  if (predictedHomeGoals === realHomeGoals && predictedAwayGoals === realAwayGoals) {
    points = 10;
  }
  // 2. Acerto empate - Acertar empate com placar diferente - 7 pontos
  // Esta condição só é verificada se não caiu no "Placar exato"
  else if (predictedOutcome === 'draw' && realOutcome === 'draw') {
    points = 7;
  }
  // 3. Vencedor da partida - Acertar apenas o time vencedor da partida (outro placar) - 5 pontos
  // Esta condição só é verificada se não caiu nas anteriores (Placar exato ou Empate)
  else if (predictedOutcome === realOutcome) {
    points = 5;
  }
  // 4. Acertar placar de um time - Acertar o numero de gols de um dos times - 3 pontos
  // Esta condição só é verificada se NENHUMA das regras de maior pontuação foi atingida.
  // Isso evita que um acerto de placar exato (10 pontos) também dê 3 pontos adicionais.
  if (points === 0) {
      if (predictedHomeGoals === realHomeGoals || predictedAwayGoals === realAwayGoals) {
        points = 3;
      }
  }

  return points;
}

/**
 * Calcula os pontos de um usuário para o palpite da classificação de um grupo.
 *
 * Regras:
 * - Acertar ambos os classificados do grupo em ordem: 10 pontos
 * - Classificados invertidos (os dois times corretos, mas na ordem oposta): 4 pontos
 * - Acertar apenas o primeiro classificado: 5 pontos
 * - Acertar apenas o segundo classificado: 5 pontos
 *
 * @param userPredictedOrder Um array com os IDs/Nomes dos times na ordem prevista pelo usuário (ex: ['timeA_id', 'timeB_id']).
 * @param realOrder Um array com os IDs/Nomes dos times na ordem real de classificação (ex: ['timeA_id', 'timeB_id']).
 * @returns O número de pontos ganhos pelo usuário.
 */
export function calculateGroupClassificationPoints(userPredictedOrder: string[], realOrder: string[]): number {
  let points = 0;

  // Garante que ambos os arrays têm exatamente 2 times
  if (userPredictedOrder.length !== 2 || realOrder.length !== 2) {
    console.warn("Entrada inválida para cálculo de classificação de grupo. Esperado 2 times em cada array.");
    return 0; // Não pontua se a entrada não estiver no formato esperado
  }

  const predictedFirst = userPredictedOrder[0];
  const predictedSecond = userPredictedOrder[1];
  const realFirst = realOrder[0];
  const realSecond = realOrder[1];

  // Acertar ambos os classificados do grupo em ordem - 10 pontos
  if (predictedFirst === realFirst && predictedSecond === realSecond) {
    points = 10;
  }
  // Classificados invertidos - Acertar os dois classificados em ordem invertida - 4 pontos
  // Esta condição é verificada antes de "Acertar apenas o primeiro/segundo" para evitar sobreposição.
  else if (predictedFirst === realSecond && predictedSecond === realFirst) {
    points = 4;
  }
  // Acertar apenas o primeiro - Acertar apenas o primeiro classificado - 5 pontos
  // Esta condição só é verificada se não caiu nas regras anteriores.
  else if (predictedFirst === realFirst) {
    points = 5;
  }
  // Acertar apenas o segundo - Acertar apenas o segundo classificado - 5 pontos
  // Esta condição só é verificada se não caiu nas regras anteriores.
  else if (predictedSecond === realSecond) {
    points = 5;
  }

  return points;
}

---

### **`src/lib/scoring.ts` (Interface Atualizada)**

```typescript
// src/lib/scoring.ts (trecho com a interface atualizada)

/**
 * ATUALIZADA: Interface para a estrutura dos palpites de um usuário para as fases finais do torneio,
 * incluindo o placar da final.
 */
export interface TournamentFinalPredictions {
  champion: string; // ID ou Nome do time
  runnerUp: string;
  thirdPlace: string;
  fourthPlace: string;
  finalScore: { homeGoals: number; awayGoals: number; }; // Placar da final palpitado pelo usuário
}

/**
 * Interface para a estrutura dos resultados reais das fases finais do torneio.
 */
export interface TournamentFinalResults {
  champion: string; // ID ou Nome do time
  runnerUp: string;
  thirdPlace: string;
  fourthPlace: string;
  finalScore: { homeGoals: number; awayGoals: number; }; // Placar da final real
}

/**
 * Calcula os pontos de um usuário para os palpites das fases finais do torneio e placar final.
 *
 * Regras:
 * - Acertar o campeão: 50 pontos
 * - Acertar o vice-campeão: 25 pontos
 * - Acertar o terceiro colocado: 15 pontos
 * - Acertar o quarto colocado: 10 pontos
 * - Acertar o placar FINAL (independente dos times): 20 pontos
 * - BÔNUS: Acertar os 4 finalistas (campeão, vice, terceiro e quarto) em ordem exata: +35 pontos (acumulativo com os pontos individuais)
 *
 * @param userPredictions Os palpites do usuário para as fases finais.
 * @param realResults Os resultados reais das fases finais do torneio.
 * @returns O número total de pontos ganhos pelo usuário para esta seção.
 */
export function calculateTournamentFinalPoints(userPredictions: TournamentFinalPredictions, realResults: TournamentFinalResults): number {
  let points = 0;

  // Acertar o campeão - 50 pontos
  if (userPredictions.champion === realResults.champion) {
    points += 50;
  }

  // Acertar o vice campeão - 25 pontos
  if (userPredictions.runnerUp === realResults.runnerUp) {
    points += 25;
  }

  // Acertar o terceiro colocado - 15 pontos
  if (userPredictions.thirdPlace === realResults.thirdPlace) {
    points += 15;
  }

  // Acertar o quarto colocado - 10 pontos
  if (userPredictions.fourthPlace === realResults.fourthPlace) {
    points += 10;
  }

  // Acertar o placar FINAL - Acertar o placar da final (independente dos times) - 20 pontos
  // Agora compara o palpite do usuário com o resultado real
  if (userPredictions.finalScore.homeGoals === realResults.finalScore.homeGoals &&
      userPredictions.finalScore.awayGoals === realResults.finalScore.awayGoals) {
    points += 20;
  }

  // BONUS - acertar os 4 finalistas (campeao, vice, terceiro e quarto em ordem) - 35 pontos
  // Este é um bônus que se soma aos pontos individuais já ganhos.
  if (userPredictions.champion === realResults.champion &&
      userPredictions.runnerUp === realResults.runnerUp &&
      userPredictions.thirdPlace === realResults.thirdPlace &&
      userPredictions.fourthPlace === realResults.fourthPlace) {
    points += 35;
  }

  return points;
}