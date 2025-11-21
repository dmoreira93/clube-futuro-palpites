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
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, Edit, Trash2, Trophy, Calendar, CheckCircle, Lock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Championship {
  id: string;
  name: string;
  logo_url: string | null;
  start_date: string | null;
  end_date: string | null;
  is_finished: boolean; // Campo novo
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

  // --- NOVA FUNÇÃO PARA ENCERRAR CAMPEONATO ---
  const handleCloseChampionship = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja encerrar o campeonato "${name}"? Isso calculará os pontos finais de todos os bolões vinculados.`)) return;

    try {
        // Chama a RPC que criamos no banco de dados
        const { error } = await supabase.rpc('close_championship', { p_championship_id: id });
        if (error) throw error;
        
        toast.success("Campeonato Encerrado", { description: "Pontos finais calculados com sucesso!" });
        fetchChampionships(); // Recarrega a lista para atualizar o status
    } catch (error: any) {
        toast.error("Erro ao encerrar", { description: error.message });
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
        const { error: updateError } = await supabase
          .from("championships")
          .update(championshipData)
          .eq("id", editingChampionship.id);
        error = updateError;
      } else {
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
    <div className="space-y-6">
      
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-fifa-blue flex items-center gap-2">
                <Trophy className="h-6 w-6 text-fifa-gold" /> Gerenciar Campeonatos
            </h2>
            <p className="text-muted-foreground text-sm">Crie e edite as competições disponíveis para bolões.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-fifa-blue hover:bg-blue-900 text-white shadow-md transition-all hover:scale-105">
              <Plus className="mr-2 h-4 w-4" /> Novo Campeonato
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] border-t-4 border-t-fifa-gold">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle className="text-fifa-blue text-xl flex items-center gap-2">
                    {editingChampionship ? <Edit className="w-5 h-5"/> : <Plus className="w-5 h-5"/>}
                    {editingChampionship ? "Editar" : "Novo"} Campeonato
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados básicos da competição.
                </DialogDescription>
              </DialogHeader>
              <div className="py-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700 font-semibold">Nome do Campeonato</Label>
                  <Input id="name" name="name" defaultValue={editingChampionship?.name} required placeholder="Ex: Copa do Mundo 2026" className="border-gray-300 focus:border-fifa-blue" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo_url" className="text-gray-700 font-semibold">URL do Logo (Opcional)</Label>
                  <Input id="logo_url" name="logo_url" defaultValue={editingChampionship?.logo_url || ""} placeholder="https://..." className="border-gray-300 focus:border-fifa-blue" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date" className="text-gray-700 font-semibold">Data de Início</Label>
                    <Input id="start_date" name="start_date" type="date" defaultValue={editingChampionship?.start_date || ""} className="border-gray-300 focus:border-fifa-blue" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date" className="text-gray-700 font-semibold">Data de Fim</Label>
                    <Input id="end_date" name="end_date" type="date" defaultValue={editingChampionship?.end_date || ""} className="border-gray-300 focus:border-fifa-blue" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Cancelar</Button>
                <Button type="submit" disabled={isSaving} className="bg-fifa-blue hover:bg-blue-900 text-white font-bold">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Salvar Campeonato
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabela de Campeonatos */}
      <Card className="border-t-4 border-t-fifa-blue shadow-lg bg-white">
        <CardHeader className="pb-2 border-b border-gray-100 mb-2">
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-lg text-gray-800">Lista de Competições</CardTitle>
                    <CardDescription>Total: {championships.length} campeonatos cadastrados.</CardDescription>
                </div>
                <Trophy className="h-8 w-8 text-gray-100" />
            </div>
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-fifa-blue" /></div>
            ) : (
                <div className="rounded-md border border-gray-200 overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                    <TableRow>
                        <TableHead className="font-bold text-fifa-blue">Nome</TableHead>
                        <TableHead className="font-bold text-fifa-blue">Período</TableHead>
                        <TableHead className="font-bold text-fifa-blue text-center">Status</TableHead>
                        <TableHead className="font-bold text-fifa-blue text-right">Ações</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {championships.length > 0 ? (
                        championships.map((champ) => (
                            <TableRow key={champ.id} className="hover:bg-blue-50/50 transition-colors group">
                            <TableCell className="font-medium text-gray-900 flex items-center gap-3">
                                {champ.logo_url ? (
                                    <img src={champ.logo_url} alt={champ.name} className="w-10 h-10 object-contain rounded-full bg-white border p-1 shadow-sm" />
                                ) : (
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"><Trophy className="w-5 h-5 text-gray-400"/></div>
                                )}
                                <span className="text-base">{champ.name}</span>
                            </TableCell>
                            <TableCell className="text-gray-600">
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4 text-fifa-gold" />
                                    <div className="flex flex-col">
                                        <span>{champ.start_date ? new Date(champ.start_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'ND'}</span>
                                        <span className="text-xs text-gray-400">até {champ.end_date ? new Date(champ.end_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'ND'}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                {champ.is_finished ? (
                                    <Badge variant="secondary" className="bg-gray-200 text-gray-600 hover:bg-gray-200 gap-1">
                                        <Lock className="w-3 h-3" /> Encerrado
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50 gap-1">
                                        <CheckCircle className="w-3 h-3" /> Ativo
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2 items-center">
                                    
                                    {/* Botão Encerrar Campeonato */}
                                    {!champ.is_finished && (
                                        <Button 
                                            variant="destructive" 
                                            size="sm" 
                                            onClick={() => handleCloseChampionship(champ.id, champ.name)}
                                            className="h-8 text-xs bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white shadow-none"
                                        >
                                            Encerrar
                                        </Button>
                                    )}

                                    <div className="h-4 w-px bg-gray-300 mx-1"></div>

                                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(champ)} className="h-8 w-8 p-0 text-gray-500 hover:text-fifa-blue hover:bg-blue-50">
                                        <Edit className="h-4 w-4" />
                                        <span className="sr-only">Editar</span>
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(champ.id)}>
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Excluir</span>
                                    </Button>
                                </div>
                            </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-32 text-center text-gray-500">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <Trophy className="h-8 w-8 text-gray-300" />
                                    <p>Nenhum campeonato encontrado.</p>
                                    <Button variant="link" onClick={() => handleOpenDialog()} className="text-fifa-blue">Crie o primeiro agora</Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminChampionships;