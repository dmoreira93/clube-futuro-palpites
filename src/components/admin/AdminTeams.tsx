import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Edit, Save, X, Loader2, Users, Globe, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Interface atualizada com o novo campo
interface Team {
  id: string;
  name: string;
  flag_url: string | null;
  api_football_id: number | null;
}

const AdminTeams = () => {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("teams")
      .select("id, name, flag_url, api_football_id")
      .order("name", { ascending: true });

    if (error) {
      toast({ title: "Erro ao carregar times", description: error.message, variant: "destructive" });
    } else {
      setTeams(data || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleEdit = (team: Team) => {
    setEditingTeam({ ...team });
  };

  const handleCancel = () => {
    setEditingTeam(null);
  };

  const handleSave = async () => {
    if (!editingTeam) return;
    setIsSubmitting(true);

    const { error } = await supabase
      .from("teams")
      .update({
        name: editingTeam.name,
        flag_url: editingTeam.flag_url,
        api_football_id: editingTeam.api_football_id,
      })
      .eq("id", editingTeam.id);

    if (error) {
      toast({ title: "Erro ao atualizar time", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Time atualizado com sucesso!" });
      setTeams(teams.map(t => (t.id === editingTeam.id ? editingTeam : t)));
      setEditingTeam(null);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Seção */}
      <div>
        <h2 className="text-2xl font-bold text-fifa-blue flex items-center gap-2">
            <Users className="h-6 w-6 text-fifa-gold" /> Gerenciar Times
        </h2>
        <p className="text-muted-foreground text-sm">Configure os nomes, bandeiras e IDs de integração.</p>
      </div>

      <Card className="border-t-4 border-t-fifa-blue shadow-md">
        <CardHeader className="pb-4 border-b border-gray-100">
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                        <Database className="w-4 h-4 text-blue-500" /> Mapeamento de Times
                    </CardTitle>
                    <CardDescription>Associe os times à API-Football para automação de resultados.</CardDescription>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Total: {teams.length}
                </Badge>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            {loading ? (
                <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-fifa-blue" /></div>
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50/80">
                            <TableRow>
                                <TableHead className="w-[30%] font-bold text-fifa-blue">Time no Sistema</TableHead>
                                <TableHead className="w-[30%] font-bold text-fifa-blue">URL da Bandeira</TableHead>
                                <TableHead className="w-[20%] font-bold text-fifa-blue">ID da API-Football</TableHead>
                                <TableHead className="w-[20%] font-bold text-fifa-blue text-right pr-6">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teams.map(team => (
                                <TableRow key={team.id} className="hover:bg-blue-50/30 transition-colors h-16">
                                    {editingTeam?.id === team.id ? (
                                        // MODO EDIÇÃO
                                        <>
                                            <TableCell>
                                                <Input 
                                                    value={editingTeam.name} 
                                                    onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })} 
                                                    className="h-9 border-blue-300 focus:ring-blue-200"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Input 
                                                        value={editingTeam.flag_url || ''} 
                                                        onChange={(e) => setEditingTeam({ ...editingTeam, flag_url: e.target.value })} 
                                                        className="h-9 border-blue-300 focus:ring-blue-200 text-xs"
                                                        placeholder="https://..."
                                                    />
                                                    {editingTeam.flag_url && (
                                                        <img src={editingTeam.flag_url} alt="Preview" className="w-9 h-9 object-contain border rounded bg-gray-50" />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Input 
                                                    type="number" 
                                                    placeholder="Ex: 50" 
                                                    value={editingTeam.api_football_id || ''} 
                                                    onChange={(e) => setEditingTeam({ ...editingTeam, api_football_id: parseInt(e.target.value, 10) || null })} 
                                                    className="h-9 border-blue-300 focus:ring-blue-200 w-24"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex gap-2 justify-end">
                                                    <Button size="sm" onClick={handleSave} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0">
                                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={handleCancel} className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-50">
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </>
                                    ) : (
                                        // MODO VISUALIZAÇÃO
                                        <>
                                            <TableCell className="font-medium text-gray-900">
                                                <div className="flex items-center gap-3">
                                                    {team.flag_url ? (
                                                        <img src={team.flag_url} alt={team.name} className="w-8 h-8 object-contain rounded-sm border border-gray-100 bg-white p-0.5 shadow-sm" onError={(e) => (e.currentTarget.src = '/placeholder.svg')} />
                                                    ) : (
                                                        <div className="w-8 h-8 bg-gray-100 rounded-sm flex items-center justify-center text-gray-400 text-xs border border-gray-200">?</div>
                                                    )}
                                                    {team.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-gray-500 font-mono truncate max-w-[200px]">
                                                {team.flag_url ? <span className="flex items-center gap-1"><Globe className="w-3 h-3"/> Link configurado</span> : <span className="text-orange-400">Sem bandeira</span>}
                                            </TableCell>
                                            <TableCell>
                                                {team.api_football_id ? (
                                                    <Badge variant="secondary" className="font-mono text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
                                                        ID: {team.api_football_id}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-xs text-gray-400 border-dashed border-gray-300">
                                                        Não vinculado
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Button size="sm" variant="ghost" onClick={() => handleEdit(team)} className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-full">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </>
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
  );
};

export default AdminTeams;