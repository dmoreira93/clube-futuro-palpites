// src/components/admin/AdminPredictions.tsx

import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Tipos adaptados para match_predictions
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

// ATUALIZADO: Tipo de dado para match_predictions
type MatchPrediction = { // Renomeado de 'Prediction' para 'MatchPrediction' para clareza
  id: string;
  user_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  created_at: string;
  user: User | null; // Assumindo que você ainda quer o join do usuário
  match: Match | null; // Assumindo que você ainda quer o join da partida
};

export default function AdminPredictions() {
  const [predictions, setPredictions] = useState<MatchPrediction[]>([]); // Usando MatchPrediction
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  async function fetchPredictions() {
    setLoading(true);
    try {
      // ATUALIZADO AQUI: De "predictions" para "match_predictions"
      const { data, error } = await supabase
        .from("match_predictions") // <--- CORRIGIDO AQUI
        .select(`
          id,
          user_id,
          match_id,
          home_score,
          away_score,
          created_at,
          users:user_id(id, name, username),
          matches:match_id(id, match_date, stage, home_team:home_team_id(name), away_team:away_team_id(name))
        `);

      if (error) throw error;

      // Mapear dados para facilitar o acesso
      const mapped = (data || []).map((p: any) => ({
        ...p,
        user: p.users, // Mapeia o objeto de usuário aninhado
        match: p.matches, // Mapeia o objeto de partida aninhado
      }));

      setPredictions(mapped);
    } catch (error: any) {
      console.error("Erro ao carregar palpites:", error.message);
      // Opcional: exibir toast de erro
    } finally {
      setLoading(false);
    }
  }

  async function deletePrediction(id: string) {
    if (!window.confirm("Tem certeza que deseja excluir este palpite?")) {
      return;
    }
    setLoading(true);
    try {
      // ATUALIZADO AQUI: De "predictions" para "match_predictions"
      const { error } = await supabase.from("match_predictions").delete().eq("id", id); // <--- CORRIGIDO AQUI

      if (error) throw error;
      setPredictions(predictions.filter((p) => p.id !== id));
      // Opcional: exibir toast de sucesso
    } catch (error: any) {
      console.error("Erro ao excluir palpite:", error.message);
      // Opcional: exibir toast de erro
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPredictions();
  }, []);

  const filteredPredictions = predictions.filter(
    (p) =>
      p.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.user?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.match?.home_team_name && p.match.home_team_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.match?.away_team_name && p.match.away_team_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <h2>Gerenciar Palpites de Partidas</h2> {/* Título mais específico */}
      <input
        type="text"
        placeholder="Buscar por usuário ou time..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: 20, padding: 8, width: "300px" }}
        disabled={loading}
      />

      {loading ? (
        <p>Carregando palpites...</p>
      ) : filteredPredictions.length === 0 ? (
        <p>Nenhum palpite de partida encontrado.</p>
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