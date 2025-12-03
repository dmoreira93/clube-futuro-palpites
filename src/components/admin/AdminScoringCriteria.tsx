import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Settings, Save, Trash2, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminScoringCriteria() {
  const [pools, setPools] = useState<any[]>([]);
  const [selectedPool, setSelectedPool] = useState<string>("");
  const [criteria, setCriteria] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados para novo critério
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPoints, setNewPoints] = useState(0);

  useEffect(() => {
    fetchPools();
  }, []);

  useEffect(() => {
    if (selectedPool) fetchCriteria();
    else setCriteria([]);
  }, [selectedPool]);

  const fetchPools = async () => {
    const { data } = await supabase.from("pools").select("id, name");
    setPools(data || []);
  };

  const fetchCriteria = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("scoring_criteria")
      .select("*")
      .eq("pool_id", selectedPool)
      .order("name");
    setCriteria(data || []);
    setLoading(false);
  };

  const handleUpdate = async (id: string, points: number) => {
    const { error } = await supabase
      .from("scoring_criteria")
      .update({ points })
      .eq("id", id);

    if (error) toast.error("Erro ao atualizar");
    else toast.success("Salvo!");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("scoring_criteria").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else {
        toast.success("Critério removido");
        fetchCriteria();
    }
  };

  const handleCreate = async () => {
      if (!newName || !selectedPool) return;
      const { error } = await supabase.from("scoring_criteria").insert({
          pool_id: selectedPool,
          name: newName,
          description: newDesc,
          points: newPoints,
          type: 'custom' // Ou lógica para definir tipo
      });
      
      if (error) toast.error("Erro ao criar");
      else {
          toast.success("Critério criado");
          setNewName(""); setNewDesc(""); setNewPoints(0);
          fetchCriteria();
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-fifa-blue">Configuração de Pontuação</h2>
            <p className="text-muted-foreground">Ajuste os pesos de pontuação por bolão.</p>
        </div>
        <div className="w-64">
            <Select value={selectedPool} onValueChange={setSelectedPool}>
                <SelectTrigger><SelectValue placeholder="Selecione o Bolão" /></SelectTrigger>
                <SelectContent>
                    {pools.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
      </div>

      {!selectedPool ? (
          <div className="text-center py-12 bg-gray-50 border-dashed border-2 rounded-lg">
              <Settings className="h-10 w-10 text-gray-300 mx-auto mb-2"/>
              <p className="text-gray-500">Selecione um bolão para editar suas regras.</p>
          </div>
      ) : (
          <>
            {/* LISTA DE CRITÉRIOS EXISTENTES */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {criteria.map((c) => (
                    <Card key={c.id} className="relative group">
                        <CardHeader className="pb-2 pr-12">
                            <CardTitle className="text-sm font-medium">{c.name}</CardTitle>
                            <CardDescription className="line-clamp-2" title={c.description}>{c.description}</CardDescription>
                        </CardHeader>
                        
                        {/* Botão de Excluir (Lixeira) */}
                        <div className="absolute top-2 right-2">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir Critério?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Isso removerá a regra "{c.name}" deste bolão. Pontos já calculados não serão removidos automaticamente, mas novos cálculos ignorarão esta regra.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction className="bg-red-600" onClick={() => handleDelete(c.id)}>Excluir</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>

                        <CardContent>
                            <div className="flex gap-2 items-center">
                                <span className="text-xs font-bold text-gray-500 uppercase">Pts:</span>
                                <Input 
                                    type="number" 
                                    className="h-9 font-bold"
                                    defaultValue={c.points} 
                                    onBlur={(e) => handleUpdate(c.id, Number(e.target.value))}
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* CARD PARA ADICIONAR NOVO */}
            <Card className="border-dashed border-2 bg-gray-50/50">
                <CardHeader><CardTitle className="text-sm">Adicionar Nova Regra</CardTitle></CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-3">
                    <Input placeholder="Nome (ex: Artilheiro)" value={newName} onChange={e => setNewName(e.target.value)} className="flex-1"/>
                    <Input placeholder="Descrição" value={newDesc} onChange={e => setNewDesc(e.target.value)} className="flex-[2]"/>
                    <Input type="number" placeholder="Pts" value={newPoints} onChange={e => setNewPoints(Number(e.target.value))} className="w-20"/>
                    <Button onClick={handleCreate}><Plus className="h-4 w-4 mr-2"/> Criar</Button>
                </CardContent>
            </Card>
          </>
      )}
    </div>
  );
}