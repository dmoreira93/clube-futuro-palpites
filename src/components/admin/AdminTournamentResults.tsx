import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, CheckCircle, Trophy, Medal, AlertTriangle } from 'lucide-react';
import { Team } from '@/types/matches';
import { Badge } from '@/components/ui/badge';

interface ResultState {
  id: string;
  champion_id: string | null;
  runner_up_id: string | null;
  third_place_id: string | null;
  fourth_place_id: string | null;
  final_home_score: number | null;
  final_away_score: number | null;
  is_completed: boolean;
}

const AdminTournamentResults = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [result, setResult] = useState<Partial<ResultState>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams').select('id, name').order('name');
      if (teamsError) throw teamsError;
      setTeams(teamsData || []);

      const { data: resultData, error: resultError } = await supabase
        .from('tournament_results')
        .select('*')
        .maybeSingle();

      if (resultError) throw resultError;
      
      if (resultData) {
        setResult(resultData);
      }
    } catch (e: any) {
      toast.error('Erro ao buscar dados.', { description: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleSelectChange = (field: 'champion' | 'runner_up' | 'third_place' | 'fourth_place', teamId: string) => {
    setResult(prev => ({ ...prev, [`${field}_id`]: teamId }));
  };

  const handleScoreChange = (field: 'final_home_score' | 'final_away_score', value: string) => {
    const score = value === '' ? null : parseInt(value, 10);
    setResult(prev => ({ ...prev, [field]: score }));
  };

  const handleSubmit = async () => {
    // Validações
    const { champion_id, runner_up_id, third_place_id, fourth_place_id, final_home_score, final_away_score } = result;
    if (!champion_id || !runner_up_id || !third_place_id || !fourth_place_id || final_home_score === null || isNaN(final_home_score) || final_away_score === null || isNaN(final_away_score)) {
      toast.error("Por favor, preencha todos os campos corretamente.");
      return;
    }
    const finalPositions = [champion_id, runner_up_id, third_place_id, fourth_place_id];
    if (new Set(finalPositions).size !== 4) {
      toast.error("As posições finais devem ser ocupadas por times distintos.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Salva/Atualiza o resultado final
      const { data: savedResult, error: upsertError } = await supabase
        .from('tournament_results')
        .upsert({
          id: result.id || '1', // Usa o ID fixo '1' ou lógica correta de ID
          champion_id: champion_id,
          runner_up_id: runner_up_id,
          third_place_id: third_place_id,
          fourth_place_id: fourth_place_id,
          final_home_score: final_home_score,
          final_away_score: final_away_score,
          is_completed: true,
        }, { onConflict: 'id' })
        .select()
        .single();
      
      if (upsertError) throw upsertError;

      toast.success('Resultado final salvo! Iniciando cálculo de pontos...');

      // 2. Chama a função SQL para processar os pontos
      const { error: rpcError } = await supabase.rpc('process_final_results');
      if (rpcError) throw rpcError;

      toast.success("Pontuações dos palpites finais calculadas com sucesso!");
      setResult(savedResult);

    } catch (e: any) {
      toast.error('Erro ao processar resultado final.', { description: e.message });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-fifa-blue" /></div>;

  return (
    <div className="space-y-6">
        
        {/* Cabeçalho da Seção */}
        <div>
            <h2 className="text-2xl font-bold text-fifa-blue flex items-center gap-2">
                <Trophy className="h-6 w-6 text-fifa-gold" /> Resultados Finais
            </h2>
            <p className="text-muted-foreground text-sm">Defina o pódio e o placar da grande final para encerrar a pontuação.</p>
        </div>

        <Card className="border-t-4 border-t-fifa-gold shadow-lg">
            <CardHeader className="pb-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl text-gray-800">Pódio do Torneio</CardTitle>
                        <CardDescription>Selecione os quatro primeiros colocados.</CardDescription>
                    </div>
                    {result.is_completed ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 px-3 py-1">
                            <CheckCircle className="w-4 h-4 mr-1" /> Processado
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50 px-3 py-1">
                            <AlertTriangle className="w-4 h-4 mr-1" /> Pendente
                        </Badge>
                    )}
                </div>
            </CardHeader>
            
            <CardContent className="space-y-8 pt-6">
                
                {/* SEÇÃO DO PÓDIO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-fifa-gold font-bold text-lg">
                            <Trophy className="w-5 h-5" /> Campeão
                        </Label>
                        <Select value={result.champion_id || ''} onValueChange={(value) => handleSelectChange('champion', value)} disabled={isSaving}>
                            <SelectTrigger className="h-12 text-lg border-yellow-400 bg-yellow-50/50 focus:ring-yellow-400">
                                <SelectValue placeholder="Selecione o Campeão..." />
                            </SelectTrigger>
                            <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-gray-600 font-bold text-lg">
                            <Medal className="w-5 h-5 text-gray-400" /> Vice-Campeão
                        </Label>
                        <Select value={result.runner_up_id || ''} onValueChange={(value) => handleSelectChange('runner_up', value)} disabled={isSaving}>
                            <SelectTrigger className="h-12 text-lg">
                                <SelectValue placeholder="Selecione o Vice..." />
                            </SelectTrigger>
                            <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-orange-700 font-semibold">
                            <Medal className="w-4 h-4 text-orange-600" /> 3º Lugar
                        </Label>
                        <Select value={result.third_place_id || ''} onValueChange={(value) => handleSelectChange('third_place', value)} disabled={isSaving}>
                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-gray-700 font-semibold">
                            <Medal className="w-4 h-4 text-gray-500" /> 4º Lugar
                        </Label>
                        <Select value={result.fourth_place_id || ''} onValueChange={(value) => handleSelectChange('fourth_place', value)} disabled={isSaving}>
                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="border-t border-gray-100 my-6"></div>

                {/* SEÇÃO DO PLACAR FINAL */}
                <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                    <Label className="block text-center text-fifa-blue font-bold mb-4 uppercase tracking-wide">Placar Oficial da Final (Campeão x Vice)</Label>
                    <div className="flex items-center justify-center gap-4">
                        <div className="text-center">
                            <span className="block text-xs text-gray-500 mb-1">Campeão</span>
                            <Input 
                                type="number" 
                                min="0" 
                                className="text-center text-2xl font-bold h-16 w-24 bg-white border-blue-200 shadow-sm" 
                                value={result.final_home_score ?? ''} 
                                onChange={e => handleScoreChange('final_home_score', e.target.value)} 
                                disabled={isSaving} 
                            />
                        </div>
                        <span className="text-2xl text-gray-400 font-light">X</span>
                        <div className="text-center">
                            <span className="block text-xs text-gray-500 mb-1">Vice</span>
                            <Input 
                                type="number" 
                                min="0" 
                                className="text-center text-2xl font-bold h-16 w-24 bg-white border-blue-200 shadow-sm" 
                                value={result.final_away_score ?? ''} 
                                onChange={e => handleScoreChange('final_away_score', e.target.value)} 
                                disabled={isSaving} 
                            />
                        </div>
                    </div>
                </div>

                <div className='pt-4'>
                    <Button 
                        className={`w-full h-12 text-lg font-bold shadow-md transition-all ${result.is_completed ? 'bg-green-600 hover:bg-green-700' : 'bg-fifa-gold text-fifa-blue hover:bg-yellow-500'}`}
                        onClick={handleSubmit} 
                        disabled={isSaving || (result.is_completed && !window.confirm("O resultado já foi processado. Deseja reprocessar? Isso pode alterar pontos existentes."))}
                    >
                        {isSaving ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processando...</>
                        ) : (
                            result.is_completed ? <><CheckCircle className="mr-2 h-5 w-5" /> Resultado Processado (Clique para reprocessar)</> : 'Salvar Resultados e Calcular Pontos'
                        )}
                    </Button>
                    <p className="text-center text-xs text-gray-400 mt-3">
                        Atenção: Esta ação dispara o cálculo de pontos para todos os participantes.
                    </p>
                </div>
            </CardContent>
        </Card>
    </div>
  );
};

export default AdminTournamentResults;