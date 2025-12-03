import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Import necessário
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save, Filter } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminTeams() {
  const [teams, setTeams] = useState<any[]>([]);
  const [championships, setChampionships] = useState<any[]>([]);
  const [selectedChampionship, setSelectedChampionship] = useState<string>("");
  const [loading, setLoading] = useState(false);
  
  // Batch Insert States
  const [batchMode, setBatchMode] = useState(false);
  const [batchInput, setBatchInput] = useState("");

  // Single Insert State
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamFlag, setNewTeamFlag] = useState("");

  useEffect(() => {
    fetchChampionships();
  }, []);

  useEffect(() => {
    if (selectedChampionship) {
      fetchTeams();
    } else {
        setTeams([]);
    }
  }, [selectedChampionship]);

  const fetchChampionships = async () => {
    const { data } = await supabase.from("championships").select("id, name");
    setChampionships(data || []);
  };

  const fetchTeams = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("championship_id", selectedChampionship) // Filtra pelo campeonato
      .order("name");
    
    if (error) toast.error("Erro ao buscar times");
    else setTeams(data || []);
    setLoading(false);
  };

  const handleAddTeam = async () => {
    if (!newTeamName || !selectedChampionship) return toast.error("Preencha nome e selecione o campeonato");

    const { error } = await supabase.from("teams").insert({
      name: newTeamName,
      flag_url: newTeamFlag,
      championship_id: selectedChampionship
    });

    if (error) toast.error("Erro ao adicionar time");
    else {
      toast.success("Time adicionado!");
      setNewTeamName("");
      setNewTeamFlag("");
      fetchTeams();
    }
  };

  const handleBatchInsert = async () => {
    if (!batchInput || !selectedChampionship) return;
    
    setLoading(true);
    // Formato esperado: "Nome do Time, URL da Bandeira" (um por linha)
    const lines = batchInput.split("\n").filter(line => line.trim() !== "");
    const newTeams = lines.map(line => {
        const [name, flag] = line.split(",").map(s => s.trim());
        return {
            name: name,
            flag_url: flag || null,
            championship_id: selectedChampionship
        };
    });

    const { error } = await supabase.from("teams").insert(newTeams);

    if (error) {
        console.error(error);
        toast.error("Erro no cadastro em lote.");
    } else {
        toast.success(`${newTeams.length} times cadastrados com sucesso!`);
        setBatchInput("");
        setBatchMode(false);
        fetchTeams();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("teams").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else {
        toast.success("Time excluído");
        fetchTeams();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-fifa-blue">Gerenciar Times</h2>
            <p className="text-muted-foreground">Cadastre os times vinculados a cada campeonato.</p>
        </div>
        
        {/* SELETOR DE CAMPEONATO (OBRIGATÓRIO) */}
        <div className="w-full md:w-64">
            <Select value={selectedChampionship} onValueChange={setSelectedChampionship}>
                <SelectTrigger>
                    <SelectValue placeholder="Selecione o Campeonato" />
                </SelectTrigger>
                <SelectContent>
                    {championships.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
      </div>

      {!selectedChampionship ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50">
              <Filter className="h-10 w-10 text-gray-300 mx-auto mb-2"/>
              <p className="text-gray-500">Selecione um campeonato acima para gerenciar os times.</p>
          </div>
      ) : (
          <>
            {/* ÁREA DE CADASTRO */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-base">Adicionar Times</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setBatchMode(!batchMode)}>
                            {batchMode ? "Modo Simples" : "Modo em Lote (Rápido)"}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {batchMode ? (
                        <div className="space-y-4">
                            <CardDescription>
                                Cole uma lista abaixo. Formato: <code>Nome do Time, URL da Bandeira</code> (uma linha por time).
                            </CardDescription>
                            <Textarea 
                                rows={6} 
                                placeholder="Real Madrid, https://exemplo.com/real.png&#10;Barcelona, https://exemplo.com/barca.png"
                                value={batchInput}
                                onChange={(e) => setBatchInput(e.target.value)}
                            />
                            <Button onClick={handleBatchInsert} disabled={loading} className="w-full">
                                {loading ? <Loader2 className="mr-2 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>} 
                                Salvar Todos os Times
                            </Button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Input placeholder="Nome do Time" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} />
                            <Input placeholder="URL da Bandeira (Opcional)" value={newTeamFlag} onChange={e => setNewTeamFlag(e.target.value)} />
                            <Button onClick={handleAddTeam}><Plus className="h-4 w-4"/></Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* LISTA DE TIMES */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teams.map(team => (
                                <TableRow key={team.id}>
                                    <TableCell className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={team.flag_url} />
                                            <AvatarFallback>{team.name.substring(0,2)}</AvatarFallback>
                                        </Avatar>
                                        {team.name}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(team.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {teams.length === 0 && (
                                <TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground">Nenhum time cadastrado neste campeonato.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </>
      )}
    </div>
  );
}