import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Badge,
  toast,
} from "@some-ui-library"; // Ajuste para sua biblioteca UI
import { format, parseISO } from "date-fns";
import { Edit, Trash, Save, X } from "react-icons"; // Ajuste para seu pacote de ícones
import { supabase } from "./supabaseClient"; // Configuração do Supabase

const stages = ["Grupos", "Oitavas", "Quartas", "Semifinal", "Final"];

const AdminMatches = () => {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [editingMatch, setEditingMatch] = useState(null);
  const [editingResult, setEditingResult] = useState(null);

  // Carregar partidas e times
  useEffect(() => {
    fetchMatches();
    fetchTeams();
  }, []);

  async function fetchMatches() {
    const { data, error } = await supabase
      .from("matches")
      .select("*, home_team:home_team_id(name), away_team:away_team_id(name)")
      .order("match_date", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar partidas.");
      return;
    }
    setMatches(data);
  }

  async function fetchTeams() {
    const { data, error } = await supabase.from("teams").select("*");
    if (error) {
      toast.error("Erro ao carregar times.");
      return;
    }
    setTeams(data);
  }

  // Editar partida
  const handleEditMatch = (match) => {
    setEditingMatch({
      ...match,
      match_date: format(parseISO(match.match_date), "yyyy-MM-dd'T'HH:mm"),
    });
  };

  // Salvar edição da partida
  async function handleSaveEdit() {
    if (!editingMatch) return;

    if (editingMatch.home_team_id === editingMatch.away_team_id) {
      toast.error("Times da casa e visitante devem ser diferentes.");
      return;
    }

    const { error } = await supabase
      .from("matches")
      .update({
        match_date: editingMatch.match_date,
        stadium: editingMatch.stadium,
        stage: editingMatch.stage,
        home_team_id: editingMatch.home_team_id,
        away_team_id: editingMatch.away_team_id,
      })
      .eq("id", editingMatch.id);

    if (error) {
      toast.error("Erro ao salvar partida.");
    } else {
      toast.success("Partida atualizada com sucesso!");
      setEditingMatch(null);
      fetchMatches();
    }
  }

  // Deletar partida
  async function handleDeleteMatch(id) {
    if (!confirm("Deseja realmente excluir esta partida?")) return;

    const { error } = await supabase.from("matches").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao deletar partida.");
    } else {
      toast.success("Partida deletada.");
      fetchMatches();
    }
  }

  // Editar resultado da partida
  const handleEditResult = (match) => {
    setEditingResult({
      id: match.id,
      homeScore: match.home_score ?? 0,
      awayScore: match.away_score ?? 0,
    });
  };

  // Salvar resultado
  async function handleSaveResult() {
    if (!editingResult) return;

    if (
      isNaN(editingResult.homeScore) ||
      isNaN(editingResult.awayScore) ||
      editingResult.homeScore < 0 ||
      editingResult.awayScore < 0
    ) {
      toast.error("Placar deve ser número inteiro positivo.");
      return;
    }

    const { error } = await supabase
      .from("matches")
      .update({
        home_score: Number(editingResult.homeScore),
        away_score: Number(editingResult.awayScore),
        is_finished: true,
      })
      .eq("id", editingResult.id);

    if (error) {
      toast.error("Erro ao salvar resultado.");
    } else {
      toast.success("Resultado atualizado!");
      setEditingResult(null);
      fetchMatches();
    }
  }

  return (
    <div>
      <Card>
        <CardContent>
          {matches.length === 0 ? (
            <p>Nenhuma partida encontrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data e Hora</TableHead>
                  <TableHead>Estádio</TableHead>
                  <TableHead>Fase</TableHead>
                  <TableHead>Casa</TableHead>
                  <TableHead>Visitante</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {matches.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell>
                      {editingMatch?.id === match.id ? (
                        <input
                          type="datetime-local"
                          className="border rounded px-2 py-1"
                          value={editingMatch.match_date}
                          onChange={(e) =>
                            setEditingMatch((prev) =>
                              prev ? { ...prev, match_date: e.target.value } : null
                            )
                          }
                        />
                      ) : (
                        format(parseISO(match.match_date), "dd/MM/yyyy HH:mm")
                      )}
                    </TableCell>

                    <TableCell>
                      {editingMatch?.id === match.id ? (
                        <Input
                          value={editingMatch.stadium}
                          onChange={(e) =>
                            setEditingMatch((prev) =>
                              prev ? { ...prev, stadium: e.target.value } : null
                            )
                          }
                        />
                      ) : (
                        match.stadium
                      )}
                    </TableCell>

                    <TableCell>
                      {editingMatch?.id === match.id ? (
                        <Select
                          value={editingMatch.stage}
                          onValueChange={(value) =>
                            setEditingMatch((prev) =>
                              prev ? { ...prev, stage: value } : null
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {stages.map((stage) => (
                              <SelectItem key={stage} value={stage}>
                                {stage}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        match.stage
                      )}
                    </TableCell>

                    <TableCell>
                      {editingMatch?.id === match.id ? (
                        <Select
                          value={editingMatch.home_team_id}
                          onValueChange={(value) =>
                            setEditingMatch((prev) =>
                              prev ? { ...prev, home_team_id: value } : null
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        match.home_team?.name || "N/A"
                      )}
                    </TableCell>

                    <TableCell>
                      {editingMatch?.id === match.id ? (
                        <Select
                          value={editingMatch.away_team_id}
                          onValueChange={(value) =>
                            setEditingMatch((prev) =>
                              prev ? { ...prev, away_team_id: value } : null
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        match.away_team?.name || "N/A"
                      )}
                    </TableCell>

                    <TableCell>
                      {editingResult?.id === match.id ? (
                        <div className="flex space-x-2 items-center">
                          <Input
                            type="number"
                            min={0}
                            value={editingResult.homeScore}
                            onChange={(e) =>
                              setEditingResult((prev) =>
                                prev
                                  ? { ...prev, homeScore: e.target.value }
                                  : null
                              )
                            }
                            className="w-12"
                          />
                          <span>:</span>
                          <Input
                            type="number"
                            min={0}
                            value={editingResult.awayScore}
                            onChange={(e) =>
                              setEditingResult((prev) =>
                                prev
                                  ? { ...prev, awayScore: e.target.value }
                                  : null
                              )
                            }
                            className="w-12"
                          />
                          <Button size="sm" onClick={handleSaveResult}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingResult(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : match.is_finished && match.home_score !== null && match.away_score !== null ? (
                        <>
                          {match.home_score} : {match.away_score}
                        </>
                      ) : (
                        <Badge variant="secondary">Sem resultado</Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      {match.is_finished ? (
                        <Badge variant="success">Finalizada</Badge>
                      ) : (
                        <Badge variant="warning">Pendente</Badge>
                      )}
                    </TableCell>

                    <TableCell className="space-x-2">
                      {editingMatch?.id === match.id ? (
                        <>
                          <Button size="sm" onClick={handleSaveEdit}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingMatch(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" onClick={() => handleEditMatch(match)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteMatch(match.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditResult(match)}
                          >
                            Resultado
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMatches;
