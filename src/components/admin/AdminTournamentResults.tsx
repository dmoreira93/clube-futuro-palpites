// src/components/admin/AdminTournamentResults.tsx (VERSÃO CORRIGIDA)

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Team } from '@/types/matches';

// Interface para os dados que vamos buscar e manipular
interface TournamentResult {
  id: string;
  champion: Team | null;
  runner_up: Team | null;
  third_place: Team | null;
  fourth_place: Team | null;
  final_home_score: number | null;
  final_away_score: number | null;
}

const AdminTournamentResults = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [result, setResult] = useState<Partial<TournamentResult>>({});
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Busca os times para preencher os menus
  const fetchTeams = useCallback(async () => {
    const { data } = await supabase.from('teams').select('*').order('name');
    setTeams(data || []);
  }, []);

  // Busca o resultado final já cadastrado
  const fetchTournamentResult = useCallback(async () => {
    setLoading(true);
    try {
      // --- CORREÇÃO PRINCIPAL AQUI ---
      // Agora selecionamos explicitamente as colunas para evitar ambiguidade
      const { data, error } = await supabase
        .from('tournament_results')
        .select(`
          id,
          final_home_score,
          final_away_score,
          champion:champion_id(id, name),
          runner_up:runner_up_id(id, name),
          third_place:third_place_id(id, name),
          fourth_place:fourth_place_id(id, name)
        `)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // Ignora erro se não houver resultado
      if (data) setResult(data as TournamentResult);

    } catch (e: any) {
      toast.error('Erro ao buscar resultado do torneio.', { description: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
    fetchTournamentResult();
  }, [fetchTeams, fetchTournamentResult]);

  const handleSelectChange = (field: keyof TournamentResult, teamId: string) => {
    const team = teams.find(t => t.id === teamId) || null;
    setResult(prev => ({ ...prev, [field]: team }));
  };

  const handleScoreChange = (field: 'final_home_score' | 'final_away_score', value: string) => {
    const score = value === '' ? null : parseInt(value, 10);
    setResult(prev => ({ ...prev, [field]: score }));
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      // Prepara o payload apenas com os IDs, como o banco espera
      const payload = {
        champion_id: result.champion?.id,
        runner_up_id: result.runner_up?.id,
        third_place_id: result.third_place?.id,
        fourth_place_id: result.fourth_place?.id,
        final_home_score: result.final_home_score,
        final_away_score: result.final_away_score,
        // Se já existe um resultado (tem id), usa para o upsert
        ...(result.id ? { id: result.id } : {})
      };

      const { error } = await supabase.from('tournament_results').upsert(payload);
      if (error) throw error;
      
      toast.success('Resultado final salvo com sucesso!');
      fetchTournamentResult(); // Recarrega os dados para garantir consistência
    } catch (e: any) {
      toast.error('Erro ao salvar resultado final.', { description: e.message });
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
          {/* Campeão */}
          <div>
            <Label>Campeão</Label>
            <Select value={result.champion?.id || ''} onValueChange={(value) => handleSelectChange('champion', value)}>
              <SelectTrigger><SelectValue placeholder="Selecione o campeão..." /></SelectTrigger>
              <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {/* Vice-Campeão */}
          <div>
            <Label>Vice-Campeão</Label>
            <Select value={result.runner_up?.id || ''} onValueChange={(value) => handleSelectChange('runner_up', value)}>
              <SelectTrigger><SelectValue placeholder="Selecione o vice..." /></SelectTrigger>
              <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {/* 3º Lugar */}
          <div>
            <Label>3º Lugar</Label>
            <Select value={result.third_place?.id || ''} onValueChange={(value) => handleSelectChange('third_place', value)}>
              <SelectTrigger><SelectValue placeholder="Selecione o 3º lugar..." /></SelectTrigger>
              <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {/* 4º Lugar */}
          <div>
            <Label>4º Lugar</Label>
            <Select value={result.fourth_place?.id || ''} onValueChange={(value) => handleSelectChange('fourth_place', value)}>
              <SelectTrigger><SelectValue placeholder="Selecione o 4º lugar..." /></SelectTrigger>
              <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Placar da Final (Campeão x Vice)</Label>
          <div className="flex items-center gap-2 max-w-xs mx-auto pt-2">
            <Input type="number" min="0" className="text-center" value={result.final_home_score ?? ''} onChange={e => handleScoreChange('final_home_score', e.target.value)} />
            <span>x</span>
            <Input type="number" min="0" className="text-center" value={result.final_away_score ?? ''} onChange={e => handleScoreChange('final_away_score', e.target.value)} />
          </div>
        </div>
        <div className='pt-4'>
            <Button className="w-full" onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Resultado Final'}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminTournamentResults;