// src/components/admin/AdminTournamentResults.tsx

import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";

interface Team {
  id: string;
  name: string;
}

interface TournamentResultDbRow {
  id?: string;
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
  const [champion, setChampion] = useState<string | null>(null);
  const [runnerUp, setRunnerUp] = useState<string | null>(null);
  const [thirdPlace, setThirdPlace] = useState<string | null>(null);
  const [fourthPlace, setFourthPlace] = useState<string | null>(null);
  const [finalHomeScore, setFinalHomeScore] = useState<string>("");
  const [finalAwayScore, setFinalAwayScore] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isProcessingPoints, setIsProcessingPoints] = useState(false);
  const [isResultsCompleted, setIsResultsCompleted] = useState(false);
  
  useEffect(() => {
    fetchTeamsAndResults();
  }, []);

  const fetchTeamsAndResults = async () => {
    setLoading(true);
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name")
        .order("name", { ascending: true });
      if (teamsError) throw teamsError;
      setTeams((teamsData as Team[]) || []);

      const { data: resultsData, error: resultsError } = await supabase
        .from("tournament_results")
        .select("id, champion_id, runner_up_id, third_place_id, fourth_place_id, final_home_score, final_away_score, is_completed")
        .maybeSingle(); 
      
      if (resultsError && resultsError.code !== 'PGRST116') { 
        toast.error(`Erro ao buscar resultados: ${resultsError.message}`);
      }

      if (resultsData) {
        const typedResultsData = resultsData as TournamentResultDbRow;
        setChampion(typedResultsData.champion_id);
        setRunnerUp(typedResultsData.runner_up_id);
        setThirdPlace(typedResultsData.third_place_id);
        setFourthPlace(typedResultsData.fourth_place_id);
        setFinalHomeScore(typedResultsData.final_home_score?.toString() || "");
        setFinalAwayScore(typedResultsData.final_away_score?.toString() || "");
        setIsResultsCompleted(typedResultsData.is_completed);
      }
    } catch (error: any) {
      toast.error("Falha ao carregar dados iniciais: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const processTournamentResultsAndCalculatePoints = async () => {
    if (!champion || !runnerUp || !thirdPlace || !fourthPlace || finalHomeScore.trim() === "" || finalAwayScore.trim() === "") {
      toast.error("Por favor, preencha todos os campos dos resultados finais.");
      return;
    }
    const homeScoreNum = parseInt(finalHomeScore, 10);
    const awayScoreNum = parseInt(finalAwayScore, 10);
    if (isNaN(homeScoreNum) || isNaN(awayScoreNum) || homeScoreNum < 0 || awayScoreNum < 0) {
      toast.error("Por favor, insira placares válidos.");
      return;
    }
    const finalPositions = [champion, runnerUp, thirdPlace, fourthPlace];
    if (new Set(finalPositions).size !== 4) {
        toast.error("Os times do Campeão, Vice, Terceiro e Quarto lugar devem ser distintos.");
        return;
    }
    
    setIsProcessingPoints(true);
    try {
      await supabase
        .from("tournament_results")
        .upsert({
          id: '1', 
          champion_id: champion,
          runner_up_id: runnerUp,
          third_place_id: thirdPlace,
          fourth_place_id: fourthPlace,
          final_home_score: homeScoreNum,
          final_away_score: awayScoreNum,
          is_completed: true,
        }, { onConflict: 'id' });

      toast.success("Resultados finais salvos! Calculando pontos...");

      const { error: rpcError } = await supabase.rpc('process_final_results');

      if (rpcError) throw rpcError;

      toast.success("Pontos dos palpites finais calculados e atualizados!");
      setIsResultsCompleted(true);
      await fetchTeamsAndResults();
    } catch (error: any) {
      toast.error(`Erro ao salvar/pontuar: ${error.message}`);
    } finally {
      setIsProcessingPoints(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-fifa-blue" />
        <p className="ml-2">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-fifa-blue">Gerenciar Resultados Finais</CardTitle>
          <CardDescription>Defina as posições finais e o placar da final.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
            <div>
              <label className="block mb-1 text-sm font-medium">Campeão</label>
              <Select onValueChange={setChampion} value={champion || ""} disabled={isProcessingPoints || isResultsCompleted}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{teams.map((team) => (<SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Vice-Campeão</label>
              <Select onValueChange={setRunnerUp} value={runnerUp || ""} disabled={isProcessingPoints || isResultsCompleted}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{teams.map((team) => (<SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Terceiro Lugar</label>
              <Select onValueChange={setThirdPlace} value={thirdPlace || ""} disabled={isProcessingPoints || isResultsCompleted}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{teams.map((team) => (<SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Quarto Lugar</label>
              <Select onValueChange={setFourthPlace} value={fourthPlace || ""} disabled={isProcessingPoints || isResultsCompleted}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{teams.map((team) => (<SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block mb-1 text-sm font-medium">Placar da Final</label>
              <div className="flex gap-2 items-center">
                <Input type="number" placeholder="Gols Campeão" value={finalHomeScore} onChange={(e) => setFinalHomeScore(e.target.value)} className="w-32 text-center" disabled={isProcessingPoints || isResultsCompleted} min="0"/>
                <span className="font-bold">x</span>
                <Input type="number" placeholder="Gols Vice" value={finalAwayScore} onChange={(e) => setFinalAwayScore(e.target.value)} className="w-32 text-center" disabled={isProcessingPoints || isResultsCompleted} min="0"/>
              </div>
            </div>
          </div>
          <Button onClick={processTournamentResultsAndCalculatePoints} className="w-full bg-fifa-blue" disabled={isProcessingPoints || isResultsCompleted}>
            {isProcessingPoints ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processando...</>) : 
             isResultsCompleted ? (<><CheckCircle className="mr-2 h-5 w-5" /> Processados</>) : 
             ("Salvar e Calcular Pontos")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTournamentResults;