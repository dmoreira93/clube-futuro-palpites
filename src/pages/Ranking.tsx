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

    // 1. Filtra a lista removendo o admin e as IAs completamente [cite: 150]
    const validParticipants = participants.filter(p => !p.is_admin && !isAIParticipant(p)); 
    const totalHuman = validParticipants.length;
    const totalPot = (pool.entry_fee || 0) * totalHuman; [cite: 143]

    // 2. Identificar grupos de empates perfeitos (Pontos, Cravadas e Precisão idênticos)
    // Criamos chaves únicas para agrupar quem está rigorosamente empatado
    const tieGroups: { [key: string]: number[] } = {};
    
    validParticipants.forEach((p, index) => {
      const tieKey = `${p.points}-${p.exactscores}-${p.accuracy}`;
      if (!tieGroups[tieKey]) {
        tieGroups[tieKey] = [];
      }
      tieGroups[tieKey].push(index);
    });

    // 3. Mapear a lista final tratando as divisões matematicamente
    return validParticipants.map((participant, index) => { 
      const tieKey = `${participant.points}-${participant.exactscores}-${participant.accuracy}`;
      const groupIndexes = tieGroups[tieKey];
      const isTied = groupIndexes.length > 1;

      // O rank visual é ditado pelo index do PRIMEIRO elemento do grupo de empate (+ 1)
      const visualRank = groupIndexes[0] + 1; 

      let prizeText = "";

      // Se há empate e envolve posições de premiação (1º, 2º ou 3º)
      if (isTied && groupIndexes.some(idx => idx < 3)) {
        // Somamos a premiação total destinada a todas as posições que esse grupo ocupa
        let combinedPrizePot = 0;
        groupIndexes.forEach(idx => {
          combinedPrizePot += getBasePrizeByRank(idx + 1, totalPot, pool);
        });

        // Dividimos o pote combinado igualmente entre os participantes do empate
        const splitPrize = combinedPrizePot / groupIndexes.length;

        if (splitPrize > 0) {
          prizeText = `R$ ${splitPrize.toFixed(2).replace('.', ',')} (Dividido)`;
        }
      } else {
        // Sem empate: cálculo padrão individual [cite: 150]
        const individualPrize = getBasePrizeByRank(index + 1, totalPot, pool);
        if (individualPrize > 0) {
          prizeText = `R$ ${individualPrize.toFixed(2).replace('.', ',')}`;
        }
      }

      // Tratamento de Punição / Lanterna com empate
      if (pool.enable_punishment && totalHuman > 3) { [cite: 147]
        // Se o index atual pertence ao grupo que ocupa a última posição da tabela
        const isLastPlaceGroup = groupIndexes.includes(totalHuman - 1);
        
        if (isLastPlaceGroup) {
          const punishmentDesc = pool.punishment_description || "Pagar a prenda!"; [cite: 147]
          prizeText = isTied ? `${punishmentDesc} (Dividido)` : punishmentDesc;
        }
      }

      // Formatação visual da precisão vinda do banco [cite: 220]
      const rawAccuracy = Number(participant.accuracy) || 0;
      const formattedAccuracy = rawAccuracy > 0 ? `${rawAccuracy.toFixed(1).replace('.', ',')}%` : "0,0%";

      return { 
        ...participant, 
        rank: visualRank, // Aplica o rank empatado (ex: dois caras com "1º")
        accuracy: formattedAccuracy, 
        prize: prizeText,
        isTie: isTied // Flag extra caso queira estilizar no futuro
      }; 
    }); 
  }, [participants, pool]);

  if (loading) { [cite: 152]
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fifa-blue" />
      </div>
    );
  }

  if (error) { [cite: 152]
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
          <Trophy className="h-8 w-8 text-yellow-500" /> Ranking do Bolão [cite: 153]
        </h1>
        {pool?.name && <p className="text-muted-foreground text-lg">Visualizando: {pool.name}</p>} [cite: 153]
      </div>

      <Card className="border-gray-200 shadow-md rounded-xl overflow-hidden"> [cite: 153]
        <CardHeader className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800"> [cite: 153]
          <CardTitle className="text-xl font-semibold">Classificação Geral</CardTitle> [cite: 153]
        </CardHeader>
        <CardContent className="p-0">
          <Table> [cite: 138]
            <TableHeader className="bg-gray-100/50 dark:bg-zinc-800/50">
              <TableRow> [cite: 138]
                <TableHead className="w-[80px] font-bold text-center">Pos.</TableHead> [cite: 138]
                <TableHead className="font-bold">Participante</TableHead> [cite: 138]
                <TableHead className="font-bold text-center">Pontos</TableHead> [cite: 138]
                <TableHead className="font-bold text-center">Cravadas</TableHead> [cite: 154]
                <TableHead className="font-bold text-center">Precisão</TableHead> [cite: 154]
                <TableHead className="font-bold text-right pr-6">Prêmio/Punição</TableHead> [cite: 154]
              </TableRow>
            </TableHeader>
            <TableBody> [cite: 138]
              {rankedParticipants.length > 0 ? ( [cite: 154]
                rankedParticipants.map((participant, index) => ( [cite: 154]
                  <RankingRow 
                    key={participant.id || index}
                    participant={participant}
                    index={index}
                  />
                )) 
              ) : ( 
                <TableRow> [cite: 138]
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground"> [cite: 138]
                    Ainda não há participantes neste bolão. [cite: 155]
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