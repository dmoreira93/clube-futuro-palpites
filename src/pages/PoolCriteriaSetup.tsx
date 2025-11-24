import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Save, CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Criteria {
  id: string;
  name: string;
  description: string;
  points: number;
  type: string;
}

const PoolCriteriaSetup = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const navigate = useNavigate();
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCriteria();
  }, [poolId]);

  const fetchCriteria = async () => {
    try {
      const { data, error } = await supabase
        .from('scoring_criteria')
        .select('*')
        .eq('pool_id', poolId)
        .order('points', { ascending: false }); // Mostra os mais valiosos primeiro

      if (error) throw error;
      setCriteria(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar critérios.");
    } finally {
      setLoading(false);
    }
  };

  const handlePointsChange = (id: string, newPoints: string) => {
    const points = parseInt(newPoints) || 0;
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, points } : c));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja anular este critério? Ninguém pontuará por isso.")) return;
    
    try {
        const { error } = await supabase.from('scoring_criteria').delete().eq('id', id);
        if (error) throw error;
        
        setCriteria(prev => prev.filter(c => c.id !== id));
        toast.success("Critério anulado.");
    } catch (error) {
        toast.error("Erro ao deletar.");
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
        // Atualiza todos os registros alterados
        for (const c of criteria) {
            const { error } = await supabase
                .from('scoring_criteria')
                .update({ points: c.points })
                .eq('id', c.id);
            if (error) throw error;
        }
        toast.success("Regras salvas com sucesso!");
        navigate(`/pool/${poolId}`);
    } catch (error) {
        toast.error("Erro ao salvar alterações.");
    } finally {
        setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando regras...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold text-fifa-blue">Configurar Pontuação</h1>
            <p className="text-gray-500">Defina quantos pontos vale cada acerto neste bolão.</p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/pool/${poolId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2"/> Voltar sem Salvar
        </Button>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Tabela de Critérios</CardTitle>
            <CardDescription>
                Edite os valores ou clique na lixeira para remover um critério (anular).
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40%]">Critério</TableHead>
                        <TableHead className="w-[40%] hidden md:table-cell">Descrição</TableHead>
                        <TableHead className="w-[15%] text-center">Pontos</TableHead>
                        <TableHead className="w-[5%]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {criteria.map((c) => (
                        <TableRow key={c.id}>
                            <TableCell className="font-medium">
                                {c.name}
                                <p className="text-xs text-gray-400 md:hidden">{c.description}</p>
                            </TableCell>
                            <TableCell className="text-gray-500 text-sm hidden md:table-cell">{c.description}</TableCell>
                            <TableCell>
                                <Input 
                                    type="number" 
                                    value={c.points} 
                                    onChange={(e) => handlePointsChange(c.id, e.target.value)}
                                    className="text-center font-bold text-fifa-blue"
                                />
                            </TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4"/>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <div className="mt-8 flex justify-end gap-4">
                <Button size="lg" onClick={handleSaveAll} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle className="w-5 h-5 mr-2"/>
                    {saving ? "Salvando..." : "Confirmar e Finalizar"}
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PoolCriteriaSetup;