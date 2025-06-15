// src/components/admin/AdminTeams.tsx - VERSÃO ATUALIZADA

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
import { useToast } from "@/components/ui/use-toast";
import { Edit, Save, X, Loader2 } from "lucide-react";

// ATUALIZADO: Adiciona o novo campo ao tipo
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

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("teams")
      .select("id, name, flag_url, api_football_id") // Puxa o novo campo
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
        api_football_id: editingTeam.api_football_id, // Salva o novo campo
      })
      .eq("id", editingTeam.id);

    if (error) {
      toast({ title: "Erro ao atualizar time", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Time atualizado com sucesso!" });
      // Atualiza a lista localmente para refletir a mudança instantaneamente
      setTeams(teams.map(t => (t.id === editingTeam.id ? editingTeam : t)));
      setEditingTeam(null);
    }
    setIsSubmitting(false);
  };
  
  // Adiciona um estado separado para o loading do save
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Mapeamento de Times da API</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Associe cada time do seu sistema ao ID correspondente da API-Football. Isso é crucial para a automação dos placares.
      </p>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time no Sistema</TableHead>
              <TableHead>URL da Bandeira</TableHead>
              <TableHead>ID da API-Football</TableHead>
              <TableHead className="text-right w-28">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map(team => (
              <TableRow key={team.id}>
                {editingTeam?.id === team.id ? (
                  <>
                    <TableCell><Input value={editingTeam.name} onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })} /></TableCell>
                    <TableCell><Input value={editingTeam.flag_url || ''} onChange={(e) => setEditingTeam({ ...editingTeam, flag_url: e.target.value })} /></TableCell>
                    <TableCell><Input type="number" placeholder="Ex: 50" value={editingTeam.api_football_id || ''} onChange={(e) => setEditingTeam({ ...editingTeam, api_football_id: parseInt(e.target.value, 10) || null })} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="icon" onClick={handleSave} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </Button>
                        <Button size="icon" variant="outline" onClick={handleCancel}><X className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell className="text-xs truncate max-w-[200px]">{team.flag_url}</TableCell>
                    <TableCell>{team.api_football_id || <span className="text-muted-foreground">Não definido</span>}</TableCell>
                    <TableCell className="text-right"><Button size="icon" variant="ghost" onClick={() => handleEdit(team)}><Edit className="h-4 w-4" /></Button></TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminTeams;