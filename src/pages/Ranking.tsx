// src/pages/Ranking.tsx

import { useAuth } from "@/contexts/AuthContext";
import useParticipantsRanking, { Participant } from "@/hooks/useParticipantsRanking";
import RankingRow from "@/components/ranking/RankingRow";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trophy, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useMemo } from "react";

// Função auxiliar para verificar se é IA (pode mover para utils se preferir)
const isAIParticipant = (p: Participant) => p.name?.startsWith('IA ') || p.username?.startsWith('GPT');

const calculatePrize = (rank: number, participant: Participant, totalHumanParticipants: number, pool: any): string => {
  // Regra de segurança: IAs e Admins não ganham prêmio
  if (!pool || isAIParticipant(participant) || participant.is_admin) {
    return "";
  }
  
  const totalPot = (pool.entry_fee || 0) * totalHumanParticipants;

  // Se o bolão tem taxa de entrada, calcula prêmio em dinheiro
  if (pool.entry_fee > 0) {
    if (rank === 1 && pool.prize_percent_1st > 0) return `R$ ${(totalPot * pool.prize_percent_1st / 100).toFixed(2).replace('.', ',')}`;
    if (rank === 2 && pool.prize_percent_2nd > 0) return `R$ ${(totalPot * pool.prize_percent_2nd / 100).toFixed(2).replace('.', ',')}`;
    if (rank === 3 && pool.prize_percent_3rd > 0) return `R$ ${(totalPot * pool.prize_percent_3rd / 100).toFixed(2).replace('.', ',')}`;
  }
  
  // Punição para o lanterna (apenas se houver mais de 3 humanos)
  if (pool.enable_punishment && rank === totalHumanParticipants && totalHumanParticipants > 3) {
    return pool.punishment_description || "Pagar a prenda!";
  }
  return "";
};

const RankingPage = () => {
  const { activePool: pool } = useAuth(); // Nome corrigido para bater com o contexto
  const { participants, loading, error } = useParticipantsRanking();

  const rankedParticipants = useMemo(() => {
    if (!participants || !pool) return [];

    // 1. Filtra admins (eles aparecem na tabela, mas não no cálculo de prêmios)
    // Dependendo da regra, você pode querer removê-los da lista visual também.
    // Aqui assumo que eles aparecem no ranking visualmente.
    
    // 2. Lista apenas humanos para calcular a "base" do prêmio
    const humanParticipants = participants.filter(p => !p.is_admin && !isAIParticipant(p));
    
    return participants.map((participant) => {
      // O rank visual já vem calculado do banco/hook
      const rank = participant.rank; 
      
      // O rank para prêmio ignora admins/IAs que estejam na frente
      // Ex: Se 1º é Admin, o 2º lugar (humano) recebe o prêmio de 1º.
      let humanRank = 0;
      if (!participant.is_admin && !isAIParticipant(participant)) {
          humanRank = humanParticipants.findIndex(h => h.id === participant.id) + 1;
      }
      
      const prize = humanRank > 0 ? calculatePrize(humanRank, participant, humanParticipants.length, pool) : "";
      
      return { ...participant, rank, prize };
    });
  }, [participants, pool]);

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-fifa-blue" /></div>;
  if (error) return <div className="container mx-auto p-4 text-center"><Alert variant="destructive" className="max-w-lg mx-auto"><AlertTriangle className="h-4 w-4" /><AlertTitle>Erro ao Carregar</AlertTitle><AlertDescription>{error}</AlertDescription></Alert></div>;

  return (
    <div className="container mx-auto px-2 sm:px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-fifa-blue">Ranking do Bolão</h1>
        {pool?.name && <p className="text-lg text-muted-foreground">{pool.name}</p>}
      </div>
      <Card className="max-w-5xl mx-auto shadow-lg">
        <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="text-yellow-500" />Classificação Geral</CardTitle></CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px] text-center">Pos.</TableHead>
                    <TableHead>Participante</TableHead>
                    <TableHead className="text-right">Pontos</TableHead>
                    <TableHead className="hidden md:table-cell text-right">Jogos</TableHead>
                    <TableHead className="hidden md:table-cell text-right">Precisão</TableHead>
                    <TableHead className="hidden md:table-cell text-right">Prêmio/Punição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankedParticipants.length > 0 ? (
                  rankedParticipants.map((participant, index) => (
                    <RankingRow key={participant.id} participant={participant} index={index} />
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center">Ainda não há participantes neste bolão.</TableCell></TableRow>
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