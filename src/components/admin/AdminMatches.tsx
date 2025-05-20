import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type Match = {
  id: number;
  team1: string;
  team2: string;
  date: string;
  score1?: number;
  score2?: number;
};

export default function AdminMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [newMatch, setNewMatch] = useState<Omit<Match, "id">>({
    team1: "",
    team2: "",
    date: "",
  });
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      const { data, error } = await supabase.from("matches").select("*");
      if (error) console.error("Erro ao buscar partidas:", error.message);
      else setMatches(data || []);
    };

    fetchMatches();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMatch({ ...newMatch, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (editingMatch) {
      const { error } = await supabase
        .from("matches")
        .update({
          team1: editingMatch.team1,
          team2: editingMatch.team2,
          date: editingMatch.date,
          score1: editingMatch.score1,
          score2: editingMatch.score2,
        })
        .eq("id", editingMatch.id);

      if (error) {
        console.error("Erro ao atualizar partida:", error.message);
      } else {
        setMatches((prev) =>
          prev.map((m) => (m.id === editingMatch.id ? editingMatch : m))
        );
        setEditingMatch(null);
      }
    } else {
      const { data, error } = await supabase
        .from("matches")
        .insert([newMatch])
        .select()
        .single();

      if (error) {
        console.error("Erro ao adicionar partida:", error.message);
      } else {
        setMatches((prev) => [...prev, data]);
        setNewMatch({ team1: "", team2: "", date: "" });
      }
    }
  };

  const handleEdit = (match: Match) => {
    setEditingMatch(match);
  };

  const handleDelete = async (matchId: number) => {
    const { error } = await supabase
      .from("matches")
      .delete()
      .eq("id", matchId);

    if (error) {
      console.error("Erro ao excluir partida:", error.message);
    } else {
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Gerenciar Partidas</h1>
      <div className="grid grid-cols-3 gap-2">
        <Input
          placeholder="Time 1"
          name="team1"
          value={editingMatch ? editingMatch.team1 : newMatch.team1}
          onChange={(e) =>
            editingMatch
              ? setEditingMatch({ ...editingMatch, team1: e.target.value })
              : handleInputChange(e)
          }
        />
        <Input
          placeholder="Time 2"
          name="team2"
          value={editingMatch ? editingMatch.team2 : newMatch.team2}
          onChange={(e) =>
            editingMatch
              ? setEditingMatch({ ...editingMatch, team2: e.target.value })
              : handleInputChange(e)
          }
        />
        <Input
          placeholder="Data"
          name="date"
          value={editingMatch ? editingMatch.date : newMatch.date}
          onChange={(e) =>
            editingMatch
              ? setEditingMatch({ ...editingMatch, date: e.target.value })
              : handleInputChange(e)
          }
        />
      </div>
      <Button onClick={handleSave}>
        {editingMatch ? "Salvar Edição" : "Adicionar Partida"}
      </Button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map((match) => (
          <Card key={match.id}>
            <CardContent className="p-4 space-y-2">
              <div>
                {match.team1} vs {match.team2}
              </div>
              <div>Data: {match.date}</div>
              {match.score1 !== undefined && match.score2 !== undefined && (
                <div>
                  Placar: {match.score1} x {match.score2}
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleEdit(match)}>
                  Editar
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(match.id)}>
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
