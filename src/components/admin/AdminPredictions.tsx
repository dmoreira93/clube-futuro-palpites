import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Trash2, Search, ListChecks, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Tipos adaptados para match_predictions
type User = {
  id: string;
  name: string;
  username: string;
  avatar_url?: string | null;
};

type Match = {
  id: string;
  match_date: string;
  stage: string;
  home_team: { name: string } | null;
  away_team: { name: string } | null;
};

type MatchPrediction = {
  id: string;
  user_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  created_at: string;
  user: User | null;
  match: Match | null;
};

export default function AdminPredictions() {
  const [predictions, setPredictions] = useState<MatchPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  async function fetchPredictions() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("match_predictions")
        .select(`
          id,
          user_id,
          match_id,
          home_score,
          away_score,
          created_at,
          user:users_custom!user_id(id, name, username, avatar_url),
          match:matches!match_id(id, match_date, stage, home_team:home_team_id(name), away_team:away_team_id(name))
        `)
        .order('created_at', { ascending: false })
        .limit(50); // Limitando para performance inicial

      if (error) throw error;

      // O cast aqui é necessário pois o retorno do Supabase pode ser complexo de tipar perfeitamente
      setPredictions(data as any[]);
    } catch (error: any) {
      console.error("Erro ao carregar palpites:", error.message);
      toast.error("Erro ao carregar palpites.", { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function deletePrediction(id: string) {
    if (!window.confirm("Tem certeza que deseja excluir este palpite?")) {
      return;
    }
    
    // Optimistic update: remove da lista visualmente antes de confirmar no banco
    const previousPredictions = [...predictions];
    setPredictions(predictions.filter((p) => p.id !== id));

    try {
      const { error } = await supabase.from("match_predictions").delete().eq("id", id);

      if (error) throw error;
      toast.success("Palpite excluído com sucesso.");
    } catch (error: any) {
      // Reverte se der erro
      setPredictions(previousPredictions);
      console.error("Erro ao excluir palpite:", error.message);
      toast.error("Erro ao excluir palpite.", { description: error.message });
    }
  }

  useEffect(() => {
    fetchPredictions();
  }, []);

  const filteredPredictions = predictions.filter((p) => {
      const userName = p.user?.name?.toLowerCase() || "";
      const userUsername = p.user?.username?.toLowerCase() || "";
      const homeTeam = p.match?.home_team?.name.toLowerCase() || "";
      const awayTeam = p.match?.away_team?.name.toLowerCase() || "";
      const search = searchTerm.toLowerCase();

      return userName.includes(search) || userUsername.includes(search) || homeTeam.includes(search) || awayTeam.includes(search);
  });

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-fifa-blue flex items-center gap-2">
                    <ListChecks className="h-6 w-6 text-fifa-gold" /> Gerenciar Palpites
                </h2>
                <p className="text-muted-foreground text-sm">Visualize e modere os palpites dos usuários (últimos 50).</p>
            </div>
            <div className="relative w-full md:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                    type="text"
                    placeholder="Buscar por usuário ou time..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full md:w-[300px] border-gray-300 focus:border-fifa-blue"
                />
            </div>
        </div>

      <Card className="border-t-4 border-t-fifa-blue shadow-md bg-white">
        <CardContent className="p-0">
            {loading ? (
                <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-fifa-blue" /></div>
            ) : filteredPredictions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <ListChecks className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhum palpite encontrado.</p>
                </div>
            ) : (
                <div className="rounded-md overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50">
                            <TableRow>
                                <TableHead className="font-bold text-fifa-blue">Usuário</TableHead>
                                <TableHead className="font-bold text-fifa-blue">Partida</TableHead>
                                <TableHead className="font-bold text-fifa-blue text-center">Palpite</TableHead>
                                <TableHead className="font-bold text-fifa-blue text-center">Data</TableHead>
                                <TableHead className="font-bold text-fifa-blue text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPredictions.map((p) => (
                            <TableRow key={p.id} className="hover:bg-blue-50/30 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 border border-gray-200">
                                            <AvatarImage src={p.user?.avatar_url || undefined} />
                                            <AvatarFallback className="bg-gray-100 text-gray-600">
                                                <User className="h-4 w-4" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900">{p.user?.name || "Desconhecido"}</span>
                                            <span className="text-xs text-gray-500">@{p.user?.username || "user"}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-800">
                                            {p.match?.home_team?.name || "?"} <span className="text-gray-400 text-xs">vs</span> {p.match?.away_team?.name || "?"}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {p.match?.match_date ? new Date(p.match.match_date).toLocaleDateString('pt-BR') : "Data N/D"} • {p.match?.stage}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className="text-lg font-bold px-3 py-1 border-blue-200 bg-blue-50 text-blue-700">
                                        {p.home_score} x {p.away_score}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center text-sm text-gray-500">
                                    {new Date(p.created_at).toLocaleDateString('pt-BR')}
                                    <br/>
                                    <span className="text-xs">{new Date(p.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                                        onClick={() => deletePrediction(p.id)}
                                        title="Excluir Palpite"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}