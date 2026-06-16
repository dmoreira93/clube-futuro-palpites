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
  const { participants, loading, error } = useParticipantsRanking();

  const rankedParticipants = useMemo(() => {     
    if (!participants || !pool) return []; 

    // 1. Filtra a lista removendo o admin e as IAs completamente     
    const validParticipants = participants.filter(p => !p.is_admin && !isAIParticipant(p));     
    const totalHuman = validParticipants.length;     
    const totalPot = (pool.entry_fee || 0) * totalHuman; 

    // 2. Identificar grupos de empates perfeitos (Pontos e Cravadas)     
    const tieGroups: Record<string, number[]> = {};         
    validParticipants.forEach((p, index) => {       
      const tieKey = `${p.points}-${p.exactscores}`;       
      if (!tieGroups[tieKey]) {         
        tieGroups[tieKey] = [];       
      }       
      tieGroups[tieKey].push(index);     
    });

    // 3. Mapear a lista final tratando prêmios
    return validParticipants.map((participant, index) => {       
      const tieKey = `${participant.points}-${participant.exactscores}`;       
      const groupIndexes = tieGroups[tieKey];       
      const isTied = groupIndexes.length > 1; 

      // O rank visual é ditado pelo index do PRIMEIRO elemento do grupo de empate (+ 1)       
      const visualRank = groupIndexes[0] + 1;
      let prizeText = ""; 

      // Se há empate e envolve posições de premiação (1º, 2º ou 3º)       
      if (isTied && groupIndexes.some(idx => idx < 3)) {         
        let combinedPrizePot = 0;         
        groupIndexes.forEach(idx => {           
          combinedPrizePot += getBasePrizeByRank(idx + 1, totalPot, pool);         
        });
        const splitPrize = combinedPrizePot / groupIndexes.length; 
        if (splitPrize > 0) {           
          prizeText = `R$ ${splitPrize.toFixed(2).replace('.', ',')} (Dividido)`;        
        }       
      } else {         
        const individualPrize = getBasePrizeByRank(index + 1, totalPot, pool);         
        if (individualPrize > 0) {           
          prizeText = `R$ ${individualPrize.toFixed(2).replace('.', ',')}`;         
        }       
      } 

      // Tratamento de Punição / Lanterna com empate       
      if (pool.enable_punishment && totalHuman > 3) {         
        const isLastPlaceGroup = groupIndexes.includes(totalHuman - 1);                 
        if (isLastPlaceGroup) {           
          const punishmentDesc = pool.punishment_description || "Pagar a prenda!";           
          prizeText = isTied ? `${punishmentDesc} (Dividido)` : punishmentDesc;         
        }       
      }

      return {         
        ...participant,         
        rank: visualRank,         
        prize: prizeText       
      };     
    });   
  }, [participants, pool]); 

  if (loading) {     
    return (       
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>    
    );   
  } 

  if (error) {     
    return (       
      <div className="flex h-[400px] items-center justify-center text-destructive">
        Erro ao Carregar o Ranking. Por favor, tente novamente.
      </div>     
    );   
  }

  return (     
    <div className="container space-y-6 py-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          <h1 className="text-3xl font-bold tracking-tight">Ranking do Bolão</h1>
        </div>
        {pool?.name && (
          <p className="text-muted-foreground">Visualizando: {pool.name}</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Classificação Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Pos.</TableHead>
                <TableHead>Participante</TableHead>
                <TableHead className="text-center">Pontos</TableHead>
                <TableHead className="text-center">Cravadas</TableHead>
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
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Ainda não há participantes neste bolão.
                  </TableCell>
                </TableRow>
              )} 
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  ); 
};

export default RankingPage;