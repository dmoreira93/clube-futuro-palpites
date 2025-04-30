
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
import { toast } from "sonner";
import { Edit, Plus } from "lucide-react";

type ScoringCriteria = {
  id: string;
  name: string;
  description: string;
  points: number;
};

const AdminScoringCriteria = () => {
  const [criteria, setCriteria] = useState<ScoringCriteria[]>([]);
  const [loading, setLoading] = useState(true);
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
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Critérios de Pontuação</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchCriteria}
            disabled={loading}
          >
            Atualizar
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-fifa-blue hover:bg-opacity-90" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Critério
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {currentCriteria ? "Editar Critério" : "Novo Critério de Pontuação"}
                </DialogTitle>
                <DialogDescription>
                  {currentCriteria 
                    ? "Atualize os detalhes do critério de pontuação." 
                    : "Defina um novo critério de pontuação para o bolão."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="points">Pontos</Label>
                    <Input
                      id="points"
                      name="points"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.points}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-fifa-blue hover:bg-opacity-90">
                    {currentCriteria ? "Salvar Alterações" : "Criar Critério"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-fifa-blue border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Pontos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {criteria.length > 0 ? (
                criteria.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>
                      <span className="font-bold text-fifa-blue">{item.points}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openEditDialog(item)}
                      >
                        <Edit className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    Nenhum critério de pontuação encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminScoringCriteria;
