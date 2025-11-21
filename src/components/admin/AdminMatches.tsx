import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Save, X, Edit, Calendar, Trophy, CheckCircle, PlayCircle } from "lucide-react";

interface Match {
  id: string;
  home_score: number | null;
  away_score: number | null;
  match_date: string;
  is_finished: boolean;
  home_team: { name: string } | null;
  away_team: { name: string } | null;
}

const AdminMatches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [homeScoreInput, setHomeScoreInput] = useState<string>("");
  const [awayScoreInput, setAwayScoreInput] = useState<string>("");

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("matches")
        .select(`*, home_team:home_team_id(name), away_team:away_team_id(name)`)
        .order("match_date", { ascending: true });

      if (error) throw error;
      setMatches(data || []);
    } catch (e: any) {
        toast.error("Erro ao carregar partidas.");
    } finally {
        setLoading(false);
    }
  };
  
  const handleEditClick = (match: Match) => {
    setEditingMatchId(match.id);
    setHomeScoreInput(match.home_score !== null ? String(match.home_score) : "");
    setAwayScoreInput(match.away_score !== null ? String(match.away_score) : "");
  };

  const processMatchResultAndCalculatePoints = async (matchId: string) => {
    const realHomeScore = parseInt(homeScoreInput, 10);
    const realAwayScore = parseInt(awayScoreInput, 10);

    if (isNaN(realHomeScore) || isNaN(realAwayScore) || realHomeScore < 0 || realAwayScore < 0) {
      toast.error("Por favor, insira placares válidos.");
      return;
    }

    setLoading(true);
    try {
      // 1. Atualiza o resultado da partida
      const { error: updateError } = await supabase
        .from("matches")
        .update({ home_score: realHomeScore, away_score: realAwayScore, is_finished: true })
        .eq("id", matchId);
      if (updateError) throw updateError;
      
      toast.success("Resultado salvo! Calculando pontos...");

      // 2. Chama a função SQL para processar os pontos
      const { error: rpcError } = await supabase.rpc('update_user_points_for_match', {
        match_id_param: matchId
      });
      if (rpcError) throw rpcError;

      toast.success("Pontuações para esta partida foram processadas!");
      await fetchMatches();
      setEditingMatchId(null);
    } catch (error: any) {
      toast.error("Erro ao processar resultado: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-fifa-blue flex items-center gap-2">
                <PlayCircle className="h-6 w-6 text-fifa-gold" /> Administração de Partidas
            </h2>
            <p className="text-muted-foreground text-sm">Insira os resultados dos jogos para atualizar os pontos dos bolões.</p>
        </div>
      </div>

      {loading && matches.length === 0 ? (
         <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-fifa-blue" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((match) => {
                const isEditing = editingMatchId === match.id;
                return (
                    <Card key={match.id} className={`transition-all duration-300 border-l-4 ${match.is_finished ? 'border-l-green-500 bg-white/50' : 'border-l-blue-500 bg-white shadow-md hover:shadow-lg'}`}>
                        <CardContent className="p-5">
                            <div className="flex justify-between items-center mb-4">
                                <Badge variant="outline" className="text-xs font-normal text-gray-500 border-gray-200 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(match.match_date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </Badge>
                                {match.is_finished ? (
                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 text-xs gap-1">
                                        <CheckCircle className="w-3 h-3" /> Finalizado
                                    </Badge>
                                ) : (
                                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 text-xs gap-1">
                                        Aguardando
                                    </Badge>
                                )}
                            </div>

                            <div className="text-center mb-6">
                                <div className="flex items-center justify-center gap-3 text-lg font-bold text-gray-800">
                                    <span className="flex-1 text-right truncate">{match.home_team?.name ?? 'A definir'}</span>
                                    <span className="text-gray-400 font-light px-2">x</span>
                                    <span className="flex-1 text-left truncate">{match.away_team?.name ?? 'A definir'}</span>
                                </div>
                                
                                {/* Placar (Visualização) */}
                                {!isEditing && (
                                    <div className="mt-2 text-3xl font-black text-fifa-blue tracking-widest">
                                        {match.home_score !== null ? match.home_score : '-'} : {match.away_score !== null ? match.away_score : '-'}
                                    </div>
                                )}
                            </div>

                            {/* Área de Edição */}
                            {isEditing ? (
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
                                    <p className="text-xs font-bold text-gray-500 uppercase text-center mb-3">Editar Placar</p>
                                    <div className="flex items-center justify-center gap-3 mb-4">
                                        <Input 
                                            type="number" 
                                            min="0"
                                            value={homeScoreInput} 
                                            onChange={(e) => setHomeScoreInput(e.target.value)} 
                                            disabled={loading} 
                                            className="w-16 text-center text-lg font-bold h-12 border-blue-200 focus:border-blue-500 bg-white"
                                            placeholder="0"
                                        />
                                        <span className="text-gray-400 font-bold">:</span>
                                        <Input 
                                            type="number" 
                                            min="0"
                                            value={awayScoreInput} 
                                            onChange={(e) => setAwayScoreInput(e.target.value)} 
                                            disabled={loading} 
                                            className="w-16 text-center text-lg font-bold h-12 border-blue-200 focus:border-blue-500 bg-white"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={() => processMatchResultAndCalculatePoints(match.id)} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white h-9 text-xs uppercase font-bold tracking-wide">
                                            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-1" />} Salvar
                                        </Button>
                                        <Button variant="outline" onClick={() => setEditingMatchId(null)} disabled={loading} className="h-9 w-9 p-0 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button 
                                    onClick={() => handleEditClick(match)} 
                                    disabled={loading} 
                                    variant="outline" 
                                    className="w-full border-blue-100 text-blue-600 hover:bg-blue-50 hover:text-blue-800 font-medium"
                                >
                                    <Edit className="mr-2 h-4 w-4" />
                                    {match.is_finished ? "Corrigir Resultado" : "Inserir Resultado"}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
      )}

      {!loading && matches.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
             <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
             <h3 className="text-lg font-medium text-gray-900">Nenhuma partida encontrada</h3>
             <p className="text-gray-500 text-sm mt-1">Cadastre jogos no banco de dados ou verifique o campeonato selecionado.</p>
        </div>
      )}
    </div>
  );
};

export default AdminMatches;