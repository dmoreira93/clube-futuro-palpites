import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type User = {
  id: string;
  name: string;
  username: string;
};

type Match = {
  id: string;
  home_team_name: string;
  away_team_name: string;
  match_date: string;
  stage: string;
};

type Prediction = {
  id: string;
  user_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  created_at: string;
  user: User | null;
  match: Match | null;
};

export default function AdminPredictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  async function fetchPredictions() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("predictions")
        .select(`
          id,
          user_id,
          match_id,
          home_score,
          away_score,
          created_at,
          users: user_id (id, name, username),
          matches: match_id (id, match_date, stage, home_team:home_team_id(name), away_team:away_team_id(name))
        `);

      if (error) throw error;

      // Mapear dados para facilitar o acesso
      const mapped = (data || []).map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        match_id: p.match_id,
        home_score: p.home_score,
        away_score: p.away_score,
        created_at: p.created_at,
        user: p.users ?? null,
        match: p.matches
          ? {
              id: p.matches.id,
              match_date: p.matches.match_date,
              stage: p.matches.stage,
              home_team_name: p.matches.home_team?.name ?? "Desconhecido",
              away_team_name: p.matches.away_team?.name ?? "Desconhecido",
            }
          : null,
      }));

      setPredictions(mapped);
    } catch (err) {
      console.error("Erro ao buscar palpites:", err);
      alert("Erro ao carregar os palpites. Veja o console para mais detalhes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPredictions();
  }, []);

  async function deletePrediction(id: string) {
    if (!window.confirm("Confirma a exclusão deste palpite?")) return;

    try {
      const { error } = await supabase.from("predictions").delete().eq("id", id);
      if (error) throw error;

      setPredictions((prev) => prev.filter((p) => p.id !== id));
      alert("Palpite excluído com sucesso.");
    } catch (err) {
      console.error("Erro ao excluir palpite:", err);
      alert("Erro ao excluir palpite. Veja o console para detalhes.");
    }
  }

  // Filtro simples por nome ou username do usuário
  const filteredPredictions = predictions.filter((p) => {
    if (!p.user) return false;
    const term = searchTerm.toLowerCase();
    return (
      p.user.name.toLowerCase().includes(term) ||
      p.user.username.toLowerCase().includes(term)
    );
  });

  return (
    <div style={{ padding: 20 }}>
      <h1>Administração de Palpites</h1>

      <input
        type="text"
        placeholder="Buscar por usuário"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: 20, padding: 8, width: "300px" }}
        disabled={loading}
      />

      {loading ? (
        <p>Carregando palpites...</p>
      ) : filteredPredictions.length === 0 ? (
        <p>Nenhum palpite encontrado.</p>
      ) : (
        <table border={1} cellPadding={8} cellSpacing={0}>
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Partida</th>
              <th>Placar</th>
              <th>Data do Palpite</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredPredictions.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.user?.name} <br />
                  <small>@{p.user?.username}</small>
                </td>
                <td>
                  {p.match
                    ? `${p.match.home_team_name} vs ${p.match.away_team_name} (${new Date(
                        p.match.match_date
                      ).toLocaleDateString()})`
                    : "Desconhecido"}
                </td>
                <td>
                  {p.home_score} x {p.away_score}
                </td>
                <td>{new Date(p.created_at).toLocaleString()}</td>
                <td>
                  <button onClick={() => deletePrediction(p.id)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
