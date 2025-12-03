import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { CalendarIcon, Filter, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function AdminMatches() {
  const [matches, setMatches] = useState<any[]>([]);
  const [championships, setChampionships] = useState<any[]>([]);
  const [selectedChampionship, setSelectedChampionship] = useState<string>("");
  
  // Teams for selection (filtered by championship)
  const [teams, setTeams] = useState<any[]>([]);
  
  // Form States
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [round, setRound] = useState("Fase de Grupos");

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
    // Busca times vinculados ao campeonato selecionado
    const { data } = await supabase
        .from("teams")
        .select("id, name")
        .eq("championship_id", selectedChampionship)
        .order("name");
    setTeams(data || []);
  };

  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from("matches")
      .select(`*, home_team:home_team_id(name), away_team:away_team_id(name)`)
      .eq("championship_id", selectedChampionship) // FILTRO ESSENCIAL
      .order("match_date", { ascending: true });

    if (error) toast.error("Erro ao buscar partidas");
    else setMatches(data || []);
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
      const { error } = await supabase.from("matches").delete().eq("id", id);
      if (error) toast.error("Erro ao excluir");
      else fetchMatches();
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold text-fifa-blue">Gerenciar Partidas</h2>
            <p className="text-muted-foreground">Agende os jogos do campeonato.</p>
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
            <Card>
                <CardHeader><CardTitle className="text-base">Nova Partida</CardTitle></CardHeader>
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
                        <span className="text-xs font-bold text-gray-500">Fase</span>
                        <Input value={round} onChange={e => setRound(e.target.value)} placeholder="Ex: Grupo A" />
                    </div>
                    <Button onClick={handleAddMatch} className="md:col-span-1 bg-green-600 hover:bg-green-700"><Plus className="mr-2 h-4 w-4"/> Criar</Button>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Fase</TableHead>
                                <TableHead className="text-right">Mandante</TableHead>
                                <TableHead className="text-center">x</TableHead>
                                <TableHead>Visitante</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {matches.map(m => (
                                <TableRow key={m.id}>
                                    <TableCell className="text-xs">{format(new Date(m.match_date), 'dd/MM HH:mm')}</TableCell>
                                    <TableCell>{m.stage}</TableCell>
                                    <TableCell className="text-right font-semibold">{m.home_team?.name}</TableCell>
                                    <TableCell className="text-center text-gray-400">vs</TableCell>
                                    <TableCell className="font-semibold">{m.away_team?.name}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </>
      )}
    </div>
  );
}