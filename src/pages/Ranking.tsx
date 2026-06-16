import { useAuth } from "@/contexts/AuthContext";
import useParticipantsRanking, { Participant } from "@/hooks/useParticipantsRanking";
import RankingRow from "@/components/ranking/RankingRow";
import { 
  Table, 
  TableBody, 
  TableHead, 
  TableHeader, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trophy } from "lucide-react";
import { useMemo } from "react";

// Função auxiliar para verificar se é IA
const isAIParticipant = (p: Participant) => p.name?.startsWith('IA ') || p.username?.startsWith('GPT');

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
  const { participants, loading: loadingRanking, error } = useParticipantsRanking();

  const rankedParticipants = useMemo(() => {
    if (!participants || !pool) return [];

    // 1. Filtra a lista removendo o admin e as IAs completamente
    const validParticipants = participants.filter(p => !p.is_admin && !isAIParticipant(p));
    const totalHuman = validParticipants.length;
    const totalPot = (pool.entry_fee || 0) * totalHuman;

    // 2. Identificar grupos de empates perfeitos (Pontos, Cravadas e Precisão original)
    const tieGroups: Record<string, number[]> = {};
    validParticipants.forEach((p, index) => {
      const tieKey = `${p.points}-${p.exactscores}-${p.accuracy || 0}`;
      if (!tieGroups[tieKey]) {
        tieGroups[tieKey] = [];
      }
      tieGroups[tieKey].push(index);
    });

    // 3. Mapear a lista final tratando prêmios, lanternas e formatando a precisão real vinda do banco
    return validParticipants.map((participant, index) => {
      const tieKey = `${participant.points}-${participant.exactscores}-${participant.accuracy || 0}`;
      const groupIndexes = tieGroups[tieKey];
      const isTied = groupIndexes.length > 1;
      const visualRank = groupIndexes[0] + 1;
      let prizeText = "";

      // Lógica de Premiação Compartilhada (Empates de Pódio)
      if (isTied && groupIndexes.some(idx => idx < 3)) {
        let combinedPrizePot = 0;
        groupIndexes.forEach(idx => {
          combinedPrizePot += getBasePrizeByRank(idx + 1, totalPot, pool);
        });
        const splitPrize = combinedPrizePot / groupIndexes.length;
        if (splitPrize > 0) prizeText = `R$ ${splitPrize.toFixed(2).replace('.', ',')} (Dividido)`;
      } else {
        const individualPrize = getBasePrizeByRank(index + 1, totalPot, pool);
        if (individualPrize > 0) prizeText = `R$ ${individualPrize.toFixed(2).replace('.', ',')}`;
      }

      // Lógica de Punição Compartilhada (Empates de Lanterna)
      if (pool.enable_punishment && totalHuman > 3) {
        const isLastPlaceGroup = groupIndexes.includes(totalHuman - 1);
        if (isLastPlaceGroup) {
          const punishmentDesc = pool.punishment_description || "Pagar a prenda!";
          prizeText = isTied ? `${punishmentDesc} (Dividido)` : punishmentDesc;
        }
      }

      // 🎯 CORREÇÃO: Resgatamos o valor que o seu banco já calcula na coluna 'accuracy'
      const rawAccuracy = Number(participant.accuracy) || 0;
      const formattedAccuracy = `${rawAccuracy.toFixed(1).replace('.', ',')}%`;

      return {
        ...participant,
        rank: visualRank,
        accuracy: formattedAccuracy, // Devolve a porcentagem correta tratada para o componente de linha
        prize: prizeText
      };
    });
  }, [participants, pool]);

  if (loadingRanking) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-center text-destructive">Erro ao Carregar o Ranking.</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Trophy className="h-6 w-6 text-yellow-500" />
          Ranking do Bolão
        </CardTitle>
        {pool?.name && (
          <p className="text-sm text-muted-foreground">Visualizando: {pool.name}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Pos.</TableHead>
                <TableHead>Participante</TableHead>
                <TableHead className="text-right">Pontos</TableHead>
                <TableHead className="text-right">Cravadas</TableHead>
                <TableHead className="text-right">Precisão</TableHead>
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
                  <TableCell colSpan={6} className="h-24 text-center">
                    Ainda não há participantes neste bolão.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default RankingPage;