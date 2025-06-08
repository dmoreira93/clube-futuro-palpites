// src/pages/Resultados.tsx
import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import Layout from "@/components/layout/Layout";
import { MatchCard } from "@/components/results/MatchCard";
import { MatchFilter } from "@/components/results/MatchFilter";
import { ResultForm } from "@/components/results/ResultForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext"; // <-- MUDANÇA: Importa o useAuth
import { Match as MatchType, Team } from "@/types/matches";
import { User as UserCustom } from "@/utils/pointsCalculator/types";
import { Loader2, AlertTriangle, ListChecks, Trophy, Users as UsersIcon, EyeOff, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ... (Suas interfaces permanecem as mesmas)
type FetchedMatch = MatchType & { /* ... */ };
interface GroupResult { /* ... */ };
interface FinalResult { /* ... */ };
interface UserGroupPrediction { /* ... */ };
interface UserFinalPrediction { /* ... */ };

const Resultados = () => {
  const { isAdmin, signOut } = useAuth(); // <-- MUDANÇA: Pega a função signOut
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // ... (Seus states permanecem os mesmos)
  const [filter, setFilter] = useState("all");
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("matches");
  const [showPredictions, setShowPredictions] = useState(false);

  const predictionDisplayCutoffDate = parseISO("2025-06-14T18:00:00-03:00");

  useEffect(() => {
    setShowPredictions(new Date() > predictionDisplayCutoffDate);
  }, [predictionDisplayCutoffDate]);

  // Função de tratamento de erro reutilizável
  const handleQueryError = (error: unknown, title: string) => {
    const err = error as any;
    console.error(`${title}:`, err);
    toast({ title, description: err.message, variant: "destructive" });
    // <-- MUDANÇA: Lógica de signOut adicionada
    if (err?.message?.includes('JWT') || err?.code === 'PGRST301') {
      signOut();
    }
  };

  const { data: matches = [], isLoading: isLoadingMatches, error: errorMatches } = useQuery<FetchedMatch[]>({
    queryKey: ['matchesResults'],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from('matches')
        .select(`id, match_date, is_finished, stage, home_score, away_score, home_team_id, away_team_id, home_team:home_team_id(id, name, flag_url, group:group_id(name)), away_team:away_team_id(id, name, flag_url, group:group_id(name))`)
        .not('home_team_id', 'is', null)
        .not('away_team_id', 'is', null)
        .order('match_date', { ascending: true });
      if (queryError) throw queryError;
      return (data as FetchedMatch[]) || [];
    },
    onError: (error) => handleQueryError(error, "Erro ao carregar partidas"),
  });
  
  // ... (Suas outras chamadas useQuery permanecem as mesmas, mas adicionamos a propriedade onError)

  const { data: groupResultsData = [], isLoading: isLoadingGroupResults, error: errorGroupResults } = useQuery<GroupResult[]>({
    queryKey: ['groupResultsData'],
    queryFn: async () => { /* ... lógica de fetch ... */ },
    enabled: activeTab === 'groups',
    onError: (error) => handleQueryError(error, "Erro ao carregar resultados de grupos"),
  });

  const { data: finalResultData, isLoading: isLoadingFinalResult, error: errorFinalResult } = useQuery<FinalResult | null>({
    queryKey: ['finalResultData'],
    queryFn: async () => { /* ... lógica de fetch ... */ },
    enabled: activeTab === 'final',
    onError: (error) => handleQueryError(error, "Erro ao carregar resultado final"),
  });

  const { data: allUsers = [], isLoading: isLoadingUsers } = useQuery<UserCustom[]>({
    queryKey: ['allUsersForPredictions'],
    queryFn: async () => { /* ... lógica de fetch ... */ },
    enabled: showPredictions && (activeTab === 'groups' || activeTab === 'final'),
    onError: (error) => handleQueryError(error, "Erro ao carregar usuários"),
  });
  
  const { data: groupPredictions = [], isLoading: isLoadingGroupPredictions } = useQuery<UserGroupPrediction[]>({
    queryKey: ['userGroupPredictions'],
    queryFn: async () => { /* ... lógica de fetch ... */ },
    enabled: showPredictions && activeTab === 'groups',
    onError: (error) => handleQueryError(error, "Erro ao carregar palpites de grupos"),
  });

  const { data: finalPredictions = [], isLoading: isLoadingFinalPredictions } = useQuery<UserFinalPrediction[]>({
    queryKey: ['userFinalPredictions'],
    queryFn: async () => { /* ... lógica de fetch ... */ },
    enabled: showPredictions && activeTab === 'final',
    onError: (error) => handleQueryError(error, "Erro ao carregar palpites finais"),
  });
  
  // O resto do seu arquivo (useEffect para toasts, handleSelectMatch, handleFormComplete, filteredMatches, etc.)
  // e todo o seu JSX de renderização permanecem exatamente os mesmos.

  // ...
  return (
    <Layout>
      {/* ... todo o seu JSX permanece aqui ... */}
    </Layout>
  );
};

export default Resultados;