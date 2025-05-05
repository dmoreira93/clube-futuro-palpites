
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Users as UsersIcon } from "lucide-react";

type PredictionWithUserAndMatch = {
  id: string;
  home_score: number;
  away_score: number;
  user: { name: string };
  match: {
    home_team: { name: string };
    away_team: { name: string };
    match_date: string;
    stage: string;
  };
};

const UserPredictions = () => {
  const [predictions, setPredictions] = useState<PredictionWithUserAndMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('users')
        .select('id, name')
        .order('name');
      
      if (data) {
        setUsers(data);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchPredictions = async () => {
      setLoading(true);
      
      try {
        let query = supabase
          .from('predictions')
          .select(`
            id, 
            home_score, 
            away_score,
            user:user_id(id, name),
            match:match_id(
              home_team:home_team_id(name),
              away_team:away_team_id(name),
              match_date,
              stage
            )
          `)
          .order('match:match_id(match_date)', { ascending: true });
        
        // Filtrar por usuário se necessário
        if (filter !== "all") {
          query = query.eq('user_id', filter);
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setPredictions(data as unknown as PredictionWithUserAndMatch[]);
        }
      } catch (error) {
        console.error('Erro ao buscar palpites:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPredictions();
  }, [filter]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-fifa-blue">Palpites dos Participantes</h1>
          <p className="text-gray-600 mt-2">
            Veja os palpites de todos os participantes para os jogos da Copa Mundial de Clubes FIFA 2025
          </p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-fifa-blue">Palpites</h2>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Filtrar por participante" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os participantes</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader className="bg-fifa-blue text-white">
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              {filter === "all" 
                ? "Palpites de Todos os Participantes" 
                : `Palpites de ${users.find(u => u.id === filter)?.name || "Participante"}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4">
                <Skeleton className="h-64 w-full" />
              </div>
            ) : predictions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum palpite encontrado.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Fase</TableHead>
                      <TableHead>Partida</TableHead>
                      <TableHead>Palpite</TableHead>
                      {filter === "all" && <TableHead>Participante</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {predictions.map((prediction) => (
                      <TableRow key={prediction.id}>
                        <TableCell>
                          {formatDate(prediction.match.match_date)}
                        </TableCell>
                        <TableCell>{prediction.match.stage}</TableCell>
                        <TableCell>
                          {prediction.match.home_team.name} vs {prediction.match.away_team.name}
                        </TableCell>
                        <TableCell>
                          <span className="px-3 py-1 bg-gray-100 rounded-lg font-semibold">
                            {prediction.home_score} - {prediction.away_score}
                          </span>
                        </TableCell>
                        {filter === "all" && (
                          <TableCell className="font-medium">{prediction.user.name}</TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default UserPredictions;
