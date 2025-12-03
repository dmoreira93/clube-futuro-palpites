import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save, Filter, Edit } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminTeams() {
  const [teams, setTeams] = useState<any[]>([]);
  const [championships, setChampionships] = useState<any[]>([]);
  const [selectedChampionship, setSelectedChampionship] = useState<string>("");
  const [loading, setLoading] = useState(false);
  
  // Batch Insert States
  const [batchMode, setBatchMode] = useState(false);
  const [batchInput, setBatchInput] = useState("");

  // Single Insert/Edit State
  const [editingId, setEditingId] = useState<string | null>(null); // ID do time em edição
  const [teamName, setTeamName] = useState("");
  const [teamFlag, setTeamFlag] = useState("");

  useEffect(() => {
    fetchChampionships();
  }, []);

  useEffect(() => {
    if (selectedChampionship) fetchTeams();
    else setTeams([]);
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
      .eq("championship_id", selectedChampionship)
      .order("name");
    
    if (error) toast.error("Erro ao buscar times");
    else setTeams(data || []);
    setLoading(false);
  };

  const handleSaveTeam = async () => {
    if (!teamName || !selectedChampionship) return toast.error("Preencha o nome");

    if (editingId) {
        // UPDATE
        const { error } = await supabase.from("teams").update({
            name: teamName, flag_url: teamFlag
        }).eq("id", editingId);

        if (error) toast.error("Erro ao atualizar");
        else {
            toast.success("Time atualizado!");
            setEditingId(null);
            setTeamName(""); setTeamFlag("");
            fetchTeams();
        }
    } else {
        // INSERT
        const { error } = await supabase.from("teams").insert({
            name: teamName, flag_url: teamFlag, championship_id: selectedChampionship
        });

        if (error) toast.error("Erro ao criar");
        else {
            toast.success("Time criado!");
            setTeamName(""); setTeamFlag("");
            fetchTeams();
        }
    }
  };

  const handleEditClick = (team: any) => {
      setEditingId(team.id);
      setTeamName(team.name);
      setTeamFlag(team.flag_url || "");
      setBatchMode(false); // Sai do modo batch se estiver
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Sobe para o formulário
  };

  const handleCancelEdit = () => {
      setEditingId(null);
      setTeamName("");
      setTeamFlag("");
  };

  const handleBatchInsert = async () => {
    if (!batchInput || !selectedChampionship) return;
    setLoading(true);
    const lines = batchInput.split("\n").filter(line => line.trim() !== "");
    const newTeams = lines.map(line => {
        const [name, flag] = line.split(",").map(s => s.trim());
        return { name, flag_url: flag || null, championship_id: selectedChampionship };
    });

    const { error } = await supabase.from("teams").insert(newTeams);
    if (error) toast.error("Erro no lote");
    else {
        toast.success(`${newTeams.length} times criados!`);
        setBatchInput("");
        setBatchMode(false);
        fetchTeams();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Tem certeza?")) return;
    const { error } = await supabase.from("teams").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Excluído"); fetchTeams(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-fifa-blue">Gerenciar Times</h2>
            <p className="text-muted-foreground">Cadastre os times vinculados ao campeonato.</p>
        </div>
        <div className="w-64">
            <Select value={selectedChampionship} onValueChange={setSelectedChampionship}>
                <SelectTrigger><SelectValue placeholder="Selecione o Campeonato" /></SelectTrigger>
                <SelectContent>{championships.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
        </div>
      </div>

      {!selectedChampionship ? (
          <div className="text-center py-12 bg-gray-50 border-2 border-dashed rounded-lg">
              <Filter className="h-10 w-10 text-gray-300 mx-auto mb-2"/>
              <p className="text-gray-500">Selecione um campeonato acima.</p>
          </div>
      ) : (
          <>
            {/* ÁREA DE CADASTRO / EDIÇÃO */}
            <Card className={editingId ? "border-yellow-400 border-2" : ""}>
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-base">
                            {editingId ? "Editando Time" : "Adicionar Times"}
                        </CardTitle>
                        {!editingId && (
                            <Button variant="ghost" size="sm" onClick={() => setBatchMode(!batchMode)}>
                                {batchMode ? "Voltar ao Simples" : "Inserir em Lote"}
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {batchMode && !editingId ? (
                        <div className="space-y-4">
                            <CardDescription>Cole: <code>Nome, URL</code> (uma linha por time).</CardDescription>
                            <Textarea rows={6} value={batchInput} onChange={(e) => setBatchInput(e.target.value)}/>
                            <Button onClick={handleBatchInsert} disabled={loading} className="w-full">
                                {loading ? <Loader2 className="mr-2 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>} Salvar Lote
                            </Button>
                        </div>
                    ) : (
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-gray-500">Nome</label>
                                <Input value={teamName} onChange={e => setTeamName(e.target.value)} />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-bold text-gray-500">Bandeira (URL)</label>
                                <Input value={teamFlag} onChange={e => setTeamFlag(e.target.value)} />
                            </div>
                            <Button onClick={handleSaveTeam} className={editingId ? "bg-yellow-500 hover:bg-yellow-600" : ""}>
                                {editingId ? "Atualizar" : <Plus className="h-4 w-4"/>}
                            </Button>
                            {editingId && (
                                <Button variant="outline" onClick={handleCancelEdit}>Cancelar</Button>
                            )}
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
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(team)}>
                                                <Edit className="h-4 w-4 text-blue-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(team.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
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