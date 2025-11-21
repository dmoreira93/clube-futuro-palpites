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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Edit, Plus, Target, Loader2, Save, X, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type ScoringCriteria = {
  id: string;
  name: string;
  description: string;
  points: number;
};

const AdminScoringCriteria = () => {
  const [criteria, setCriteria] = useState<ScoringCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCriteria, setCurrentCriteria] = useState<ScoringCriteria | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    points: 0,
  });

  useEffect(() => {
    fetchCriteria();
  }, []);

  const fetchCriteria = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("scoring_criteria")
        .select("*")
        .order("points", { ascending: false });

      if (error) throw error;

      setCriteria(data || []);
    } catch (error) {
      toast.error("Erro ao carregar critérios de pontuação");
      console.error("Error fetching scoring criteria:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "points" ? parseInt(value) || 0 : value,
    });
  };

  const openCreateDialog = () => {
    setCurrentCriteria(null);
    setFormData({
      name: "",
      description: "",
      points: 0,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (criteria: ScoringCriteria) => {
    setCurrentCriteria(criteria);
    setFormData({
      name: criteria.name,
      description: criteria.description || "",
      points: criteria.points,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      if (currentCriteria) {
        // Editar critério existente
        const { error } = await supabase
          .from("scoring_criteria")
          .update({
            name: formData.name,
            description: formData.description,
            points: formData.points,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentCriteria.id);

        if (error) throw error;
        toast.success("Critério atualizado com sucesso");
      } else {
        // Criar novo critério
        const { error } = await supabase
          .from("scoring_criteria")
          .insert({
            name: formData.name,
            description: formData.description,
            points: formData.points,
          });

        if (error) throw error;
        toast.success("Critério criado com sucesso");
      }
      
      setIsDialogOpen(false);
      fetchCriteria();
    } catch (error) {
      toast.error(currentCriteria ? "Erro ao atualizar critério" : "Erro ao criar critério");
      console.error("Error submitting criteria:", error);
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
                <Target className="h-6 w-6 text-fifa-gold" /> Critérios de Pontuação
            </h2>
            <p className="text-muted-foreground text-sm">Defina as regras e pontos para cada tipo de acerto nos bolões.</p>
        </div>
        
        <div className="flex gap-2">
            <Button
                variant="outline"
                onClick={fetchCriteria}
                disabled={loading}
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
                Atualizar Lista
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button className="bg-fifa-blue hover:bg-blue-900 text-white shadow-md transition-all hover:scale-105" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Critério
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-t-4 border-t-fifa-gold">
                <DialogHeader>
                <DialogTitle className="text-fifa-blue text-xl flex items-center gap-2">
                    {currentCriteria ? <Edit className="w-5 h-5"/> : <Plus className="w-5 h-5"/>}
                    {currentCriteria ? "Editar Critério" : "Novo Critério"}
                </DialogTitle>
                <DialogDescription>
                    {currentCriteria 
                    ? "Atualize os detalhes e o valor da pontuação." 
                    : "Crie uma nova regra de pontuação para o sistema."}
                </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                <div className="space-y-5 py-4">
                    <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-700 font-semibold">Nome da Regra</Label>
                    <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Ex: Placar Exato"
                        className="border-gray-300 focus:border-fifa-blue"
                    />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="points" className="text-gray-700 font-semibold">Pontos</Label>
                    <div className="relative">
                        <Input
                            id="points"
                            name="points"
                            type="number"
                            min="0"
                            max="1000"
                            value={formData.points}
                            onChange={handleInputChange}
                            required
                            className="pl-10 border-gray-300 focus:border-fifa-blue font-bold text-lg"
                        />
                        <Trophy className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-fifa-gold" />
                    </div>
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="description" className="text-gray-700 font-semibold">Descrição</Label>
                    <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Explique quando essa pontuação é aplicada..."
                        className="border-gray-300 focus:border-fifa-blue resize-none"
                    />
                    </div>
                </div>
                <DialogFooter>
                    <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isSaving}
                    >
                    Cancelar
                    </Button>
                    <Button type="submit" disabled={isSaving} className="bg-fifa-blue hover:bg-blue-900 text-white font-bold">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {currentCriteria ? "Salvar Alterações" : "Criar Critério"}
                    </Button>
                </DialogFooter>
                </form>
            </DialogContent>
            </Dialog>
        </div>
      </div>

      <Card className="border-t-4 border-t-fifa-blue shadow-md bg-white">
        <CardContent className="p-0">
            {loading ? (
                <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-fifa-blue" /></div>
            ) : (
                <div className="rounded-md overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                    <TableRow>
                        <TableHead className="font-bold text-fifa-blue w-[200px]">Regra</TableHead>
                        <TableHead className="font-bold text-fifa-blue">Descrição</TableHead>
                        <TableHead className="font-bold text-fifa-blue text-center w-[100px]">Pontos</TableHead>
                        <TableHead className="font-bold text-fifa-blue text-right w-[100px]">Ações</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {criteria.length > 0 ? (
                        criteria.map((item) => (
                        <TableRow key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                            <TableCell className="font-bold text-gray-800">{item.name}</TableCell>
                            <TableCell className="text-gray-600 text-sm leading-relaxed">{item.description}</TableCell>
                            <TableCell className="text-center">
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 text-sm font-bold px-3 min-w-[3rem] justify-center">
                                    {item.points}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => openEditDialog(item)}
                                className="text-gray-400 hover:text-fifa-blue hover:bg-blue-50 transition-colors"
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center text-gray-500">
                            <div className="flex flex-col items-center justify-center gap-2">
                                <Target className="h-8 w-8 text-gray-300" />
                                <p>Nenhum critério de pontuação encontrado.</p>
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

export default AdminScoringCriteria;