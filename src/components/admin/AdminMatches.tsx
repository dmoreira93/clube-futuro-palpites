import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Filter, Plus, Trash2, Edit, Save, Loader2, PlayCircle, Trophy } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function AdminMatches() {
  const [matches, setMatches] = useState<any[]>([]);
  const [championships, setChampionships] = useState<any[]>([]);
  const [selectedChampionship, setSelectedChampionship] = useState<string>("");
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Create Match State
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [round, setRound] = useState("Fase de Grupos");

  // Edit Result State
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchChampionships();
  }, []);

  useEffect(() => {
    if (selectedChampionship) {
      fetchMatches();
      fetchTeams();
    } else {
        setMatches([]);
        setTeams([]);
    }
  }, [selectedChampionship]);

  const fetchChampionships = async () => {
    const { data } = await supabase.from("championships").select("id, name");
    setChampionships(data || []);
  };

  const fetchTeams = async () => {
    const { data } = await supabase
        .from("teams")
        .select("id, name")
        .eq("championship_id", selectedChampionship)
        .order("name");
    setTeams(data || []);
  };

  const fetchMatches = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("matches")
      .select(`*, home_team:home_team_id(name), away_team:away_team_id(name)`)
      .eq("championship_id", selectedChampionship)
      .order("match_date", { ascending: true });

    if (error) toast.error("Erro ao buscar partidas");
    else setMatches(data || []);
    setLoading(false);
  };

  const handleAddMatch = async () => {
    if (!homeTeam || !awayTeam || !matchDate || !selectedChampionship) {
        return toast.error("Preencha todos os campos");
    }

    const { error } = await supabase.from("matches").insert({
      championship_id: selectedChampionship,
      home_team_id: homeTeam,
      away_team_id: awayTeam,
      match_date: new Date(matchDate).toISOString(),
      stage: round,
      status: 'scheduled'
    });

    if (error) toast.error("Erro ao criar partida");
    else {
      toast.success("Partida criada!");
      fetchMatches();
    }
  };

  const handleDelete = async (id: string) => {
      if (!confirm("Tem certeza que deseja excluir esta partida?")) return;
      const { error } = await supabase.from("matches").delete().eq("id", id);
      if (error) toast.error("Erro ao excluir");
      else fetchMatches();
  };

  // --- RESULTADOS ---
  const openResultDialog = (match: any) => {
      setSelectedMatch(match);
      setHomeScore(match.home_score !== null ? String(match.home_score) : "");
      setAwayScore(match.away_score !== null ? String(match.away_score) : "");
      setIsResultDialogOpen(true);
  };

  const handleSaveResult = async () => {
      if (!selectedMatch) return;
      
      const hScore = parseInt(homeScore);
      const aScore = parseInt(awayScore);

      if (isNaN(hScore) || isNaN(aScore)) return toast.error("Placar inválido");

      setProcessing(true);
      try {
          // 1. Atualiza Match
          const { error } = await supabase.from("matches").update({
              home_score: hScore,
              away_score: aScore,
              is_finished: true,
              status: 'finished'
          }).eq("id", selectedMatch.id);

          if (error) throw error;

          // 2. Dispara Pontuação
//  COLE ESTE TRECHO ATUALIZADO:
const { error: rpcError } = await supabase.rpc('calculate_match_score', { 
    p_match_id: selectedMatch.id 
});
          
          if (rpcError) throw rpcError;

          toast.success("Resultado salvo e pontos calculados!");
          setIsResultDialogOpen(false);
          fetchMatches();
      } catch (err: any) {
          toast.error("Erro: " + err.message);
      } finally {
          setProcessing(false);
      }
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold text-fifa-blue">Gerenciar Partidas</h2>
            <p className="text-muted-foreground">Crie jogos e lance os resultados oficiais.</p>
        </div>
        <div className="w-full md:w-64">
            <Select value={selectedChampionship} onValueChange={setSelectedChampionship}>
                <SelectTrigger><SelectValue placeholder="Selecione o Campeonato" /></SelectTrigger>
                <SelectContent>
                    {championships.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
      </div>

      {!selectedChampionship ? (
          <div className="text-center py-12 bg-gray-50 border-2 border-dashed rounded-lg">
              <Filter className="mx-auto h-10 w-10 text-gray-300"/>
              <p className="text-gray-500 mt-2">Selecione um campeonato para ver e criar jogos.</p>
          </div>
      ) : (
          <>
            {/* CRIAR PARTIDA */}
            <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Agendar Nova Partida</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="space-y-1 md:col-span-1">
                        <span className="text-xs font-bold text-gray-500">Data e Hora</span>
                        <Input type="datetime-local" value={matchDate} onChange={e => setMatchDate(e.target.value)} />
                    </div>
                    <div className="space-y-1 md:col-span-1">
                        <span className="text-xs font-bold text-gray-500">Mandante</span>
                        <Select value={homeTeam} onValueChange={setHomeTeam}>
                            <SelectTrigger><SelectValue placeholder="Casa" /></SelectTrigger>
                            <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1 md:col-span-1">
                        <span className="text-xs font-bold text-gray-500">Visitante</span>
                        <Select value={awayTeam} onValueChange={setAwayTeam}>
                            <SelectTrigger><SelectValue placeholder="Fora" /></SelectTrigger>
                            <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1 md:col-span-1">
                        <span className="text-xs font-bold text-gray-500">Fase (Grupo)</span>
                        <Input value={round} onChange={e => setRound(e.target.value)} placeholder="Ex: Grupo A" />
                    </div>
                    <Button onClick={handleAddMatch} className="md:col-span-1 bg-green-600 hover:bg-green-700"><Plus className="mr-2 h-4 w-4"/> Criar</Button>
                </CardContent>
            </Card>

            {/* LISTA DE PARTIDAS */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Fase</TableHead>
                                <TableHead className="text-right">Mandante</TableHead>
                                <TableHead className="text-center w-[100px]">Placar</TableHead>
                                <TableHead>Visitante</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {matches.map(m => (
                                <TableRow key={m.id}>
                                    <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                                        {format(new Date(m.match_date), 'dd/MM HH:mm')}
                                    </TableCell>
                                    <TableCell className="text-xs text-gray-500">{m.stage}</TableCell>
                                    <TableCell className="text-right font-semibold">{m.home_team?.name}</TableCell>
                                    
                                    {/* COLUNA PLACAR */}
                                    <TableCell className="text-center">
                                        {m.is_finished ? (
                                            <Badge variant="outline" className="font-mono text-sm border-gray-300 bg-gray-50">
                                                {m.home_score} x {m.away_score}
                                            </Badge>
                                        ) : (
                                            <span className="text-gray-300 text-xs">vs</span>
                                        )}
                                    </TableCell>
                                    
                                    <TableCell className="font-semibold">{m.away_team?.name}</TableCell>
                                    
                                    <TableCell className="text-center">
                                        {m.is_finished ? (
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Finalizado</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">Agendado</Badge>
                                        )}
                                    </TableCell>
                                    
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {/* BOTÃO DE EDITAR RESULTADO */}
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className={`h-8 px-2 ${m.is_finished ? 'border-gray-200 text-gray-500' : 'border-blue-200 text-blue-600 bg-blue-50'}`}
                                                onClick={() => openResultDialog(m)}
                                            >
                                                {m.is_finished ? <Edit className="h-4 w-4"/> : <PlayCircle className="h-4 w-4 mr-1"/>}
                                                {m.is_finished ? "" : "Resultado"}
                                            </Button>
                                            
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(m.id)}>
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {matches.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                        Nenhuma partida cadastrada para este campeonato.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* DIALOG DE LANÇAR RESULTADO */}
            <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Lançar Resultado</DialogTitle>
                        <DialogDescription>
                            {selectedMatch?.home_team?.name} vs {selectedMatch?.away_team?.name}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex items-center justify-center gap-4 py-6">
                        <div className="text-center">
                            <span className="block text-xs font-bold text-gray-500 mb-1">CASA</span>
                            <Input 
                                type="number" 
                                value={homeScore} 
                                onChange={e => setHomeScore(e.target.value)} 
                                className="text-center text-2xl w-20 h-14 font-bold"
                            />
                        </div>
                        <span className="text-xl text-gray-400">X</span>
                        <div className="text-center">
                            <span className="block text-xs font-bold text-gray-500 mb-1">FORA</span>
                            <Input 
                                type="number" 
                                value={awayScore} 
                                onChange={e => setAwayScore(e.target.value)} 
                                className="text-center text-2xl w-20 h-14 font-bold"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsResultDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveResult} disabled={processing} className="bg-green-600 hover:bg-green-700">
                            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                            Salvar e Calcular Pontos
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </>
      )}
    </div>
  );
}