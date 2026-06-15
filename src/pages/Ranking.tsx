import { useAuth } from "@/contexts/AuthContext";
import useParticipantsRanking, { Participant } from "@/hooks/useParticipantsRanking";
import RankingRow from "@/components/ranking/RankingRow";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trophy } from "lucide-react";
import { useMemo } from "react";

// Função auxiliar para verificar se é IA
const isAIParticipant = (p: Participant) => 
  p.name?.startsWith('IA ') || p.username?.startsWith('GPT');

// Função base de cálculo de prêmio por posição absoluta
const getBasePrizeByRank = (rank: number, totalPot: number, pool: any): number => {
  if (!pool || pool.entry_fee <= 0) return 0;
  if (rank === 1 && pool.prize_percent_1st > 0) return (totalPot * pool.prize_percent_1st) / 100;
  if (rank === 2 && pool.prize_percent_2nd > 0) return (totalPot * pool.prize_percent_2nd) / 100;
  if (rank === 3 && pool.prize_percent_3rd > 0) return (totalPot * pool.prize_percent_3rd) / 100;
  return 0;
};

const RankingPage = () => {
  const { activePool: pool } = useAuth();
  const { participants, loading, error } = useParticipantsRanking();

  const rankedParticipants = useMemo(() => {
    if (!participants || !pool) return [];

    // 1. Filtra a lista removendo o admin e as IAs completamente
    const validParticipants = participants.filter(p => !p.is_admin && !isAIParticipant(p));
    const totalHuman = validParticipants.length;
    const totalPot = (pool.entry_fee || 0) * totalHuman;

    // 2. Identificar grupos de empates perfeitos (Pontos, Cravadas e Precisão original do banco)
    const tieGroups: Record<string, number[]> = {};
    
    validParticipants.forEach((p, index) => {
      const tieKey = `${p.points}-${p.exactscores}-${p.accuracy || 0}`;
      if (!tieGroups[tieKey]) {
        tieGroups[tieKey] = [];
      }
      tieGroups[tieKey].push(index);
    });

    // 3. Mapear a lista final tratando prêmios e calculando a precisão visual correta
    return validParticipants.map((participant, index) => {
      const tieKey = `${participant.points}-${participant.exactscores}-${participant.accuracy || 0}`;
      const groupIndexes = tieGroups[tieKey];
      const isTied = groupIndexes.length > 1;

      // O rank visual é ditado pelo index do PRIMEIRO elemento do grupo de empate (+ 1)
      const visualRank = groupIndexes[0] + 1;
      
      // Lógica de Premiação Dinâmica com Divisão de Empate
      let prizeText = "";
      
      if (isTied && groupIndexes.some(idx => idx < 3)) {
        // Se há empate no topo, soma os prêmios das posições e divide pelo total de empatados
        let combinedPrizePot = 0;
        groupIndexes.forEach(idx => {
          combinedPrizePot += getBasePrizeByRank(idx + 1, totalPot, pool);
        });
        
        const sharedPrize = combinedPrizePot / groupIndexes.length;
        if (sharedPrize > 0) {
          prizeText = `R$ ${sharedPrize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Dividido)`;
        }
      } else if (!isTied && visualRank <= 3) {
        // Prêmio normal sem empate
        const normalPrize = getBasePrizeByRank(visualRank, totalPot, pool);
        if (normalPrize > 0) {
          prizeText = `R$ ${normalPrize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        }
      }

      // Tratamento da Lanterna (Último lugar)
      const isLastIndex = index === validParticipants.length - 1;
      const isGroupLast = groupIndexes.includes(validParticipants.length - 1);
      
      if (validParticipants.length > 1 && (isLastIndex || isGroupLast)) {
        prizeText = isTied ? "Pagar a prenda! (Dividido)" : "Pagar a prenda!";
      }

      // 🎯 --- CÁLCULO INTELIGENTE DA PRECISÃO NA TELA ---
      const rawAccuracyFromDb = Number(participant.accuracy) || 0;
      let formattedAccuracy = "0,0%";

      if (rawAccuracyFromDb > 0) {
        formattedAccuracy = `${rawAccuracyFromDb.toFixed(1).replace('.', ',')}%`;
      } else {
        const cravadas = Number(participant.exactscores) || 0;
        if (cravadas > 0) {
          // Se o banco não enviou a precisão calculada mas ele tem cravada e estamos no início do bolão,
          // consideramos 100% de aproveitamento relativo aos jogos processados até aqui.
          formattedAccuracy = "100,0%";
        }
      }

      return {
        ...participant,
        rank: visualRank,
        accuracy: formattedAccuracy,
        prize: prizeText
      };
    });
  }, [participants, pool]);

  if (loading) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[450px] items-center justify-center text-destructive">
        Erro ao Carregar o Ranking. Por favor, tente novamente.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Ranking do Bolão
        </h1>
        {pool?.name && (
          <p className="text-muted-foreground">
            Visualizando: <span className="font-semibold text-foreground">{pool.name}</span>
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Classificação Geral</CardTitle>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] text-center">Pos.</TableHead>
                  <TableHead>Participante</TableHead>
                  <TableHead className="text-center">Pontos</TableHead>
                  <TableHead className="text-center">Cravadas</TableHead>
                  <TableHead className="text-center">Precisão</TableHead>
                  <TableHead className="text-right">Prêmio/Punição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankedParticipants.length > 0 ? (
                  rankedParticipants.map((participant, index) => (
                    <RankingRow
                      key={participant.id || index}
                      participant={participant}
                      index={index}
                    />
                  ))
                ) : (
                  <TableRow>
                    <td colSpan={6} className="h-24 text-center text-muted-foreground">
                      Ainda não há participantes neste bolão.
                    </td>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RankingPage;