// src/pages/Ranking.tsx (VERSÃO ATUALIZADA E COMPLETA)

import { useAuth } from "@/contexts/AuthContext";
import useParticipantsRanking from "@/hooks/useParticipantsRanking";
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

const RankingPage = () => {
  // Pega o bolão do contexto para o título da página
  const { pool } = useAuth();
  
  // Hook que busca e ordena todos os participantes e suas estatísticas
  const { participants, loading, error } = useParticipantsRanking();

  // Filtramos os participantes para não exibir IAs no ranking principal
  // e para calcular os prêmios corretamente com base no número de jogadores reais.
  const realParticipants = participants.filter(p => !p.is_ai);

  // Exibe um loader enquanto os dados estão sendo carregados
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-fifa-blue" />
      </div>
    );
  }

  // Exibe uma mensagem de erro se a busca de dados falhar
  if (error) {
    return (
      <div className="container mx-auto p-4 text-center">
        <Alert variant="destructive" className="max-w-lg mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao Carregar o Ranking</AlertTitle>
          <AlertDescription>
            Não foi possível buscar os dados do ranking. Por favor, tente recarregar a página.
            <p className="text-xs mt-2">Detalhe: {error}</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-fifa-blue">
          Ranking do Bolão
        </h1>
        {pool?.name && (
          <p className="text-lg text-muted-foreground">{pool.name}</p>
        )}
      </div>

      <Card className="max-w-5xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="text-yellow-500" />
            Classificação Geral
          </CardTitle>
        </CardHeader>
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
                {realParticipants.length > 0 ? (
                  realParticipants.map((participant, index) => (
                    <RankingRow
                      key={participant.id}
                      participant={participant}
                      index={index}
                      totalParticipants={realParticipants.length}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Ainda não há participantes no ranking deste bolão.
                    </TableCell>
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