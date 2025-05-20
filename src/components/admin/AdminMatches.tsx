import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const AdminMatches = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMatches = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("matches")
      .select(`
        id, 
        home_score, 
        away_score, 
        match_date, 
        stage, 
        stadium, 
        is_finished, 
        created_at, 
        update_at,
        home_team:home_team_id (id, name),
        away_team:away_team_id (id, name)
      `)
      .order("match_date", { ascending: true });

    if (error) {
      console.error("Erro ao buscar partidas:", error.message);
    } else {
      setMatches(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Administração de Partidas</h1>
      {loading ? (
        <p>Carregando partidas...</p>
      ) : (
        <div className="grid gap-4">
          {matches.map((match) => (
            <div
              key={match.id}
              className="border rounded-xl p-4 shadow-sm bg-white"
            >
              <p className="font-semibold text-lg">{match.stage}</p>
              <p className="text-sm text-gray-600">
                {new Date(match.match_date).toLocaleString()}
              </p>
              <p>
                <strong>Times:</strong> {match.home_team?.name} vs {match.away_team?.name}
              </p>
              <p>
                <strong>Placar:</strong> {match.home_score} x {match.away_score}
              </p>
              <p>
                <strong>Estádio:</strong> {match.stadium}
              </p>
              <p>
                <strong>Finalizado:</strong> {match.is_finished ? "Sim" : "Não"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMatches;
