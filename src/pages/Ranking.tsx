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
const isAIParticipant = (p: Participant) => p.name?.startsWith('IA ') || p.username?.startsWith('GPT');

// Função para calcular prêmios e punições
const calculatePrize = (rank: number, participant: Participant, totalHumanParticipants: number, pool: any): string => { 
  if (!pool || isAIParticipant(participant) || participant.is_admin) { 
    return "";
  } 
  
  const totalPot = (pool.entry_fee || 0) * totalHumanParticipants;

  if (pool.entry_fee > 0) { 
    if (rank === 1 && pool.prize_percent_1st > 0) return `R$ ${(totalPot * pool.prize_percent_1st / 100).toFixed(2).replace('.', ',')}`;
    if (rank === 2 && pool.prize_percent_2nd > 0) return `R$ ${(totalPot * pool.prize_percent_2nd / 100).toFixed(2).replace('.', ',')}`;
    if (rank === 3 && pool.prize_percent_3rd > 0) return `R$ ${(totalPot * pool.prize_percent_3rd / 100).toFixed(2).replace('.', ',')}`;
  } 
  
  if (pool.enable_punishment && rank === totalHumanParticipants && totalHumanParticipants > 3) { 
    return pool.punishment_description || "Pagar a prenda!";
  } 
  return ""; 
};

const RankingPage = () => { 
  const { activePool: pool } = useAuth();
  const { participants, loading, error } = useParticipantsRanking();

  const rankedParticipants = useMemo(() => { 
    if (!participants || !pool) return [];

    // 1. Filtra a lista removendo o admin e as IAs completamente [cite: 150]
    const validParticipants = participants.filter(p => !p.is_admin && !isAIParticipant(p)); 
    
    // 2. Mapeia a lista aplicando o rank real e formatando a precisão vinda do banco
    return validParticipants.map((participant, index) => { 
      const realRank = index + 1; // Como a lista já vem ordenada pelo RPC, o index dita o rank [cite: 150]
      
      const prize = calculatePrize(realRank, participant, validParticipants.length, pool); 
      
      // Captura o accuracy do banco, garante que é número e formata com '%'. Ex: 25.0 -> "25,0%"
      const rawAccuracy = Number(participant.accuracy) || 0;
      const formattedAccuracy = rawAccuracy > 0 ? `${rawAccuracy.toFixed(1).replace('.', ',')}%` : "0,0%";

      // Sobrescreve o 'rank' e injeta a precisão formatada para o RankingRow
      return { 
        ...participant, 
        rank: realRank, 
        accuracy: formattedAccuracy, // Agora vai string mastigada para o componente visual
        prize 
      }; 
    }); 
  }, [participants, pool]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fifa-blue" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Erro ao Carregar o Ranking. Por favor, tente novamente.
      </div>
    );
  }

  return ( 
    <div className="container mx-auto max-w-5xl p-4 space-y-6">
      <div className="flex flex-col space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" /> Ranking do Bolão
        </h1>
        {pool?.name && <p className="text-muted-foreground text-lg">Visualizando: {pool.name}</p>}
      </div>

      <Card className="border-gray-200 shadow-md rounded-xl overflow-hidden">
        <CardHeader className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
          <CardTitle className="text-xl font-semibold">Classificação Geral</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-100/50 dark:bg-zinc-800/50">
              <TableRow>
                <TableHead className="w-[80px] font-bold text-center">Pos.</TableHead>
                <TableHead className="font-bold">Participante</TableHead>
                <TableHead className="font-bold text-center">Pontos</TableHead>
                <TableHead className="font-bold text-center">Cravadas</TableHead>
                <TableHead className="font-bold text-center">Precisão</TableHead>
                <TableHead className="font-bold text-right pr-6">Prêmio/Punição</TableHead>
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
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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