// src/components/admin/AdminTournamentResults.tsx - VERSÃO CORRIGIDA

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, CheckCircle } from 'lucide-react';
import { Team } from '@/types/matches';

// Interface para o estado local
interface ResultState {
  id?: string;
  champion_id: string | null;
  runner_up_id: string | null;
  third_place_id: string | null;
  fourth_place_id: string | null;
  final_home_score: number | null;
  final_away_score: number | null;
  is_completed?: boolean;
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
        .maybeSingle(); // .maybeSingle() não dá erro se não encontrar nada

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

  const handleSelectChange = (field: keyof ResultState, teamId: string) => {
    setResult(prev => ({ ...prev, [`${field}_id`]: teamId }));
  };

  const handleScoreChange = (field: 'final_home_score' | 'final_away_score', value: string) => {
    const score = value === '' ? null : parseInt(value, 10);
    setResult(prev => ({ ...prev, [field]: score }));
  };

  const handleSubmit = async () => {
    // Validações
    const { champion_id, runner_up_id, third_place_id, fourth_place_id, final_home_score, final_away_score } = result;
    if (!champion_id || !runner_up_id || !third_place_id || !fourth_place_id || final_home_score === null || final_away_score === null) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }
    const finalPositions = [champion_id, runner_up_id, third_place_id, fourth_place_id];
    if (new Set(finalPositions).size !== 4) {
      toast.error("As posições finais devem ser ocupadas por times distintos.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Salva/Atualiza o resultado final do torneio
      const { data: savedResult, error: upsertError } = await supabase
        .from('tournament_results')
        .upsert({
          id: result.id || undefined, // Envia o ID apenas se ele já existir
          champion_id: champion_id,
          runner_up_id: runner_up_id,
          third_place_id: third_place_id,
          fourth_place_id: fourth_place_id,
          final_home_score: final_home_score,
          final_away_score: final_away_score,
          is_completed: true,
        }, { onConflict: 'id' }) // Usar o 'id' para a lógica de upsert
        .select()
        .single();
      
      if (upsertError) throw upsertError;

      toast.success('Resultado final salvo! Iniciando cálculo de pontos...');

      // 2. Chama a função SQL para processar os pontos
      const { error: rpcError } = await supabase.rpc('process_final_results');
      if (rpcError) throw rpcError;

      toast.success("Pontuações dos palpites finais calculadas com sucesso!");
      
      // Atualiza o estado local com os dados salvos
      setResult(savedResult);

    } catch (e: any) {
      toast.error('Erro ao processar resultado final.', { description: e.message });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados Finais do Torneio</CardTitle>
        <CardDescription>Defina os quatro primeiros colocados e o placar da final.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Campeão</Label>
            <Select value={result.champion_id || ''} onValueChange={(value) => handleSelectChange('champion' as any, value)} disabled={isSaving}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Vice-Campeão</Label>
            <Select value={result.runner_up_id || ''} onValueChange={(value) => handleSelectChange('runner_up' as any, value)} disabled={isSaving}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>3º Lugar</Label>
            <Select value={result.third_place_id || ''} onValueChange={(value) => handleSelectChange('third_place' as any, value)} disabled={isSaving}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>4º Lugar</Label>
            <Select value={result.fourth_place_id || ''} onValueChange={(value) => handleSelectChange('fourth_place' as any, value)} disabled={isSaving}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Placar da Final (Campeão x Vice)</Label>
          <div className="flex items-center gap-2 max-w-xs mx-auto pt-2">
            <Input type="number" min="0" className="text-center" value={result.final_home_score ?? ''} onChange={e => handleScoreChange('final_home_score', e.target.value)} disabled={isSaving} />
            <span>x</span>
            <Input type="number" min="0" className="text-center" value={result.final_away_score ?? ''} onChange={e => handleScoreChange('final_away_score', e.target.value)} disabled={isSaving} />
          </div>
        </div>
        <div className='pt-4'>
            <Button className="w-full" onClick={handleSubmit} disabled={isSaving || result.is_completed}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {result.is_completed ? <><CheckCircle className="mr-2 h-4 w-4" /> Processado</> : 'Salvar e Pontuar'}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminTournamentResults;