import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Settings, Save } from "lucide-react";

export default function AdminScoringCriteria() {
  const [pools, setPools] = useState<any[]>([]);
  const [selectedPool, setSelectedPool] = useState<string>("");
  const [criteria, setCriteria] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

  const handleUpdate = async (id: string, newPoints: number) => {
    const { error } = await supabase
      .from("scoring_criteria")
      .update({ points: newPoints })
      .eq("id", id);

    if (error) toast.error("Erro ao atualizar");
    else toast.success("Pontuação atualizada!");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-fifa-blue">Configuração de Pontuação</h2>
            <p className="text-muted-foreground">Ajuste os pesos de pontuação de um bolão específico.</p>
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
              <p className="text-gray-500">Selecione um bolão para editar suas regras de pontuação.</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {criteria.map((c) => (
                  <Card key={c.id}>
                      <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">{c.name}</CardTitle>
                          <CardDescription>{c.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <div className="flex gap-2">
                              <Input 
                                type="number" 
                                defaultValue={c.points} 
                                onChange={(e) => handleUpdate(c.id, Number(e.target.value))}
                              />
                              <Button variant="outline" disabled size="icon"><Save className="h-4 w-4"/></Button>
                          </div>
                      </CardContent>
                  </Card>
              ))}
              {criteria.length === 0 && !loading && (
                  <p className="col-span-full text-center text-gray-500">Este bolão ainda não tem critérios definidos.</p>
              )}
          </div>
      )}
    </div>
  );
}