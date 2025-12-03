import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Trophy, Filter, Save } from 'lucide-react';

export default function AdminTournamentResults() {
  const [championships, setChampionships] = useState<any[]>([]);
  const [selectedChampionship, setSelectedChampionship] = useState<string>("");
  const [teams, setTeams] = useState<any[]>([]);
  
  // Form State
  const [resultId, setResultId] = useState<string | null>(null);
  const [champion, setChampion] = useState("");
  const [runnerUp, setRunnerUp] = useState("");
  const [third, setThird] = useState("");
  const [fourth, setFourth] = useState("");
  const [scoreHome, setScoreHome] = useState("");
  const [scoreAway, setScoreAway] = useState("");
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadChamps() {
        const { data } = await supabase.from("championships").select("id, name");
        setChampionships(data || []);
    }
    loadChamps();
  }, []);

  useEffect(() => {
    if (selectedChampionship) loadData();
    else { setTeams([]); resetForm(); }
  }, [selectedChampionship]);

  const resetForm = () => {
      setResultId(null); setChampion(""); setRunnerUp(""); setThird(""); setFourth(""); setScoreHome(""); setScoreAway("");
  };

  const loadData = async () => {
      setLoading(true);
      // 1. Times do Campeonato
      const { data: teamsData } = await supabase.from("teams").select("id, name").eq("championship_id", selectedChampionship).order("name");
      setTeams(teamsData || []);

      // 2. Resultado Existente
      const { data: res } = await supabase.from("tournament_results").select("*").eq("championship_id", selectedChampionship).maybeSingle();
      
      if (res) {
          setResultId(res.id);
          setChampion(res.champion_id || "");
          setRunnerUp(res.runner_up_id || "");
          setThird(res.third_place_id || "");
          setFourth(res.fourth_place_id || "");
          setScoreHome(res.final_home_score?.toString() || "");
          setScoreAway(res.final_away_score?.toString() || "");
      } else {
          resetForm();
      }
      setLoading(false);
  };

  const handleSave = async () => {
      if (!champion || !runnerUp || !scoreHome || !scoreAway) return toast.error("Preencha ao menos Campeão, Vice e Placar");

      setLoading(true);
      const payload = {
          championship_id: selectedChampionship, // VINCULA AO CAMPEONATO
          champion_id: champion,
          runner_up_id: runnerUp,
          third_place_id: third || null,
          fourth_place_id: fourth || null,
          final_home_score: parseInt(scoreHome),
          final_away_score: parseInt(scoreAway),
          is_completed: true
      };

      // Upsert baseado no ID (se existir) ou championship_id (se tiver constraint unique)
      // Como talvez não tenha constraint unique no championship_id, usamos o ID se tivermos
      let error;
      if (resultId) {
          ({ error } = await supabase.from("tournament_results").update(payload).eq("id", resultId));
      } else {
          ({ error } = await supabase.from("tournament_results").insert(payload));
      }

      if (error) {
          toast.error("Erro ao salvar: " + error.message);
      } else {
          toast.success("Salvo! Calculando pontos...");
          // Dispara Pontuação
          await supabase.rpc('process_final_results'); 
          toast.success("Pontos calculados!");
          loadData(); // Recarrega para pegar o ID se foi insert
      }
      setLoading(false);
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-fifa-blue">Resultados Finais</h2>
            <p className="text-muted-foreground">Defina o pódio e placar da final.</p>
        </div>
        <div className="w-64">
            <Select value={selectedChampionship} onValueChange={setSelectedChampionship}>
                <SelectTrigger><SelectValue placeholder="Selecione o Campeonato" /></SelectTrigger>
                <SelectContent>{championships.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
        </div>
      </div>

      {!selectedChampionship ? (
          <div className="text-center py-12 bg-gray-50 border-2 border-dashed rounded-lg">
              <Filter className="h-10 w-10 text-gray-300 mx-auto mb-2"/>
              <p className="text-gray-500">Selecione um campeonato.</p>
          </div>
      ) : (
          <Card className="border-t-4 border-t-yellow-500">
              <CardHeader><CardTitle>Pódio Oficial</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <Label className="text-yellow-600 font-bold flex items-center gap-2"><Trophy className="h-4 w-4"/> Campeão</Label>
                          <Select value={champion} onValueChange={setChampion}>
                              <SelectTrigger className="bg-yellow-50 border-yellow-200"><SelectValue placeholder="Selecione..."/></SelectTrigger>
                              <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-1">
                          <Label className="text-gray-500 font-bold">Vice-Campeão</Label>
                          <Select value={runnerUp} onValueChange={setRunnerUp}>
                              <SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger>
                              <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-1">
                          <Label>3º Lugar</Label>
                          <Select value={third} onValueChange={setThird}>
                              <SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger>
                              <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-1">
                          <Label>4º Lugar</Label>
                          <Select value={fourth} onValueChange={setFourth}>
                              <SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger>
                              <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                          </Select>
                      </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-center">
                      <Label className="mb-2 block font-bold text-fifa-blue">PLACAR DA FINAL (Campeão x Vice)</Label>
                      <div className="flex justify-center items-center gap-2">
                          <Input type="number" className="w-20 text-center text-xl font-bold" value={scoreHome} onChange={e => setScoreHome(e.target.value)} placeholder="0" />
                          <span className="text-2xl text-gray-300">X</span>
                          <Input type="number" className="w-20 text-center text-xl font-bold" value={scoreAway} onChange={e => setScoreAway(e.target.value)} placeholder="0" />
                      </div>
                  </div>

                  <Button onClick={handleSave} disabled={loading} className="w-full h-12 text-lg bg-green-600 hover:bg-green-700">
                      {loading ? <Loader2 className="mr-2 animate-spin"/> : <Save className="mr-2 h-5 w-5"/>}
                      Salvar Resultado e Processar Pontos
                  </Button>
              </CardContent>
          </Card>
      )}
    </div>
  );
}