
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

type Prediction = {
  id: string;
  user_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  created_at: string;
  updated_at: string;
  users: {
    name: string;
    email: string;
  };
  matches: {
    home_team: { name: string };
    away_team: { name: string };
    match_date: string;
    stage: string;
  };
};

type User = {
  id: string;
  name: string;
  email: string;
};

type Match = {
  id: string;
  home_team: { name: string };
  away_team: { name: string };
  match_date: string;
  stage: string;
};

const AdminPredictions = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState<string>("");
  const [matchFilter, setMatchFilter] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar usuários para o filtro
      const { data: usersData } = await supabase
        .from("users")
        .select("id, name, email");
      
      setUsers(usersData || []);
      
      // Buscar partidas para o filtro (simulado com dados para exemplo)
      // Na implementação real, substituir pelo código para buscar as partidas do Supabase
      setMatches([
        { id: "1", home_team: { name: "Brasil" }, away_team: { name: "Argentina" }, match_date: "2025-06-15T16:00:00Z", stage: "Fase de Grupos" },
        { id: "2", home_team: { name: "Alemanha" }, away_team: { name: "França" }, match_date: "2025-06-16T19:00:00Z", stage: "Fase de Grupos" },
      ]);
      
      // Buscar palpites
      const { data: predictionsData, error } = await supabase
        .from("predictions")
        .select(`
          id, 
          user_id, 
          match_id, 
          home_score, 
          away_score, 
          created_at, 
          updated_at,
          users:user_id (name, email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Simulação das relações com partidas até integrarmos completamente
      const enhancedPredictions = predictionsData.map((prediction: any) => ({
        ...prediction,
        matches: {
          home_team: { name: "Time da Casa" },
          away_team: { name: "Time Visitante" },
          match_date: "2025-06-15T16:00:00Z",
          stage: "Fase de Grupos"
        }
      }));

      setPredictions(enhancedPredictions);
    } catch (error) {
      toast.error("Erro ao carregar dados");
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (predictionId: string) => {
    try {
      const { error } = await supabase
        .from("predictions")
        .delete()
        .eq("id", predictionId);

      if (error) throw error;

      toast.success("Palpite excluído com sucesso");
      setPredictions((prev) => prev.filter((p) => p.id !== predictionId));
    } catch (error) {
      toast.error("Erro ao excluir palpite");
      console.error("Error deleting prediction:", error);
    }
  };

  // Filtragem de palpites com base nos filtros aplicados
  const filteredPredictions = predictions.filter((prediction) => {
    // Filtro por termo de busca (procura no nome do usuário)
    const searchMatch = prediction.users?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       prediction.users?.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por usuário
    const userMatch = userFilter ? prediction.user_id === userFilter : true;
    
    // Filtro por partida
    const matchMatch = matchFilter ? prediction.match_id === matchFilter : true;
    
    return searchMatch && userMatch && matchMatch;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gerenciamento de Palpites</h2>
        <Button
          variant="outline"
          onClick={fetchData}
          disabled={loading}
        >
          Atualizar
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Buscar por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Filtrar por usuário" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os usuários</SelectItem>
            {users.map(user => (
              <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={matchFilter} onValueChange={setMatchFilter}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Filtrar por partida" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas as partidas</SelectItem>
            {matches.map(match => (
              <SelectItem key={match.id} value={match.id}>
                {match.home_team.name} vs {match.away_team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-fifa-blue border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Partida</TableHead>
                <TableHead>Placar</TableHead>
                <TableHead>Data do Palpite</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPredictions.length > 0 ? (
                filteredPredictions.map((prediction) => (
                  <TableRow key={prediction.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{prediction.users?.name || "Usuário desconhecido"}</div>
                        <div className="text-sm text-muted-foreground">{prediction.users?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{prediction.matches?.home_team?.name} vs {prediction.matches?.away_team?.name}</div>
                        <div className="text-sm text-muted-foreground">{prediction.matches?.stage}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-3 py-1 bg-gray-100 rounded-md">
                        {prediction.home_score} x {prediction.away_score}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(prediction.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-red-500">
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir palpite</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir este palpite? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-500 hover:bg-red-600"
                              onClick={() => handleDelete(prediction.id)}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    Nenhum palpite encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminPredictions;
