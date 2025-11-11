// src/components/admin/AdminMatches.tsx

import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Match {
  id: string;
  home_score: number | null;
  away_score: number | null;
  match_date: string;
  is_finished: boolean;
  home_team: { name: string } | null;
  away_team: { name: string } | null;
}

const AdminMatches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [homeScoreInput, setHomeScoreInput] = useState<string>("");
  const [awayScoreInput, setAwayScoreInput] = useState<string>("");

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("matches")
        .select(`*, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name)`)
        .order("match_date", { ascending: true });

      if (error) throw error;
      setMatches(data || []);
    } catch (e: any) {
        toast.error("Erro ao carregar partidas.");
    } finally {
        setLoading(false);
    }
  };
  
  const handleEditClick = (match: Match) => {
    setEditingMatchId(match.id);
    setHomeScoreInput(match.home_score !== null ? String(match.home_score) : "");
    setAwayScoreInput(match.away_score !== null ? String(match.away_score) : "");
  };

  const processMatchResultAndCalculatePoints = async (matchId: string) => {
    const realHomeScore = parseInt(homeScoreInput, 10);
    const realAwayScore = parseInt(awayScoreInput, 10);

    if (isNaN(realHomeScore) || isNaN(realAwayScore) || realHomeScore < 0 || realAwayScore < 0) {
      toast.error("Por favor, insira placares válidos.");
      return;
    }

    setLoading(true);
    try {
      // 1. Atualiza o resultado da partida
      const { error: updateError } = await supabase
        .from("matches")
        .update({ home_score: realHomeScore, away_score: realAwayScore, is_finished: true })
        .eq("id", matchId);
      if (updateError) throw updateError;
      
      toast.success("Resultado salvo!");
      
      // Note: Points calculation will happen automatically via triggers or batch processing
      await fetchMatches();
      setEditingMatchId(null);
    } catch (error: any) {
      toast.error("Erro ao processar resultado: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-fifa-blue">Administração de Partidas</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {matches.map((match) => (
          <div key={match.id} className={`border rounded-xl p-4 shadow-sm bg-white ${editingMatchId === match.id ? 'ring-2 ring-fifa-blue' : ''}`}>
            <p className="font-semibold text-lg">{match.home_team?.name ?? 'A definir'} vs {match.away_team?.name ?? 'A definir'}</p>
            <p className="text-sm text-gray-500">{new Date(match.match_date).toLocaleString('pt-BR')}</p>
            {editingMatchId === match.id ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Input type="number" value={homeScoreInput} onChange={(e) => setHomeScoreInput(e.target.value)} disabled={loading} className="w-20 text-center"/>
                  <span>x</span>
                  <Input type="number" value={awayScoreInput} onChange={(e) => setAwayScoreInput(e.target.value)} disabled={loading} className="w-20 text-center"/>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => processMatchResultAndCalculatePoints(match.id)} disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : "Salvar e Pontuar"}
                  </Button>
                  <Button variant="outline" onClick={() => setEditingMatchId(null)} disabled={loading}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex justify-center">
                <Button onClick={() => handleEditClick(match)} disabled={loading && editingMatchId !== null}>
                  {match.is_finished ? "Corrigir Resultado" : "Inserir Resultado"}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminMatches;