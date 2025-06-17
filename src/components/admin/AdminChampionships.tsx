// src/components/admin/AdminChampionships.tsx

import { useState, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/alert-dialog"; // Reutilizando o AlertDialog como modal
import { toast } from "sonner";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import { Label } from "../ui/label";

interface Championship {
  id: string;
  name: string;
  logo_url: string | null;
  start_date: string | null;
  end_date: string | null;
}

const AdminChampionships = () => {
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChampionship, setEditingChampionship] = useState<Championship | null>(null);

  useEffect(() => {
    fetchChampionships();
  }, []);

  const fetchChampionships = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("championships")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      setChampionships(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar campeonatos.", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (championship: Championship | null = null) => {
    setEditingChampionship(championship);
    setIsDialogOpen(true);
  };

  const handleDelete = async (championshipId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este campeonato? Isso pode afetar bolões existentes.")) {
      return;
    }
    try {
      const { error } = await supabase.from("championships").delete().eq("id", championshipId);
      if (error) throw error;
      toast.success("Campeonato excluído com sucesso!");
      fetchChampionships();
    } catch (error: any) {
      toast.error("Erro ao excluir campeonato.", { description: error.message });
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const championshipData = {
      name: formData.get("name") as string,
      logo_url: formData.get("logo_url") as string || null,
      start_date: formData.get("start_date") as string || null,
      end_date: formData.get("end_date") as string || null,
    };

    try {
      let error;
      if (editingChampionship) {
        // Edit
        const { error: updateError } = await supabase
          .from("championships")
          .update(championshipData)
          .eq("id", editingChampionship.id);
        error = updateError;
      } else {
        // Create
        const { error: insertError } = await supabase.from("championships").insert(championshipData);
        error = insertError;
      }

      if (error) throw error;

      toast.success(`Campeonato ${editingChampionship ? 'atualizado' : 'criado'} com sucesso!`);
      setIsDialogOpen(false);
      fetchChampionships();
    } catch (error: any) {
      toast.error(`Erro ao salvar campeonato.`, { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Campeonatos</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" /> Novo Campeonato
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingChampionship ? "Editar" : "Novo"} Campeonato</DialogTitle>
                <DialogDescription>
                  Preencha os dados do campeonato.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Campeonato</Label>
                  <Input id="name" name="name" defaultValue={editingChampionship?.name} required />
                </div>
                <div>
                  <Label htmlFor="logo_url">URL do Logo</Label>
                  <Input id="logo_url" name="logo_url" defaultValue={editingChampionship?.logo_url || ""} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Data de Início</Label>
                    <Input id="start_date" name="start_date" type="date" defaultValue={editingChampionship?.start_date || ""} />
                  </div>
                  <div>
                    <Label htmlFor="end_date">Data de Fim</Label>
                    <Input id="end_date" name="end_date" type="date" defaultValue={editingChampionship?.end_date || ""} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Cancelar</Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Data de Início</TableHead>
                <TableHead>Data de Fim</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {championships.map((champ) => (
                <TableRow key={champ.id}>
                  <TableCell className="font-medium">{champ.name}</TableCell>
                  <TableCell>{champ.start_date ? new Date(champ.start_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/D'}</TableCell>
                  <TableCell>{champ.end_date ? new Date(champ.end_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/D'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(champ)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(champ.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminChampionships;