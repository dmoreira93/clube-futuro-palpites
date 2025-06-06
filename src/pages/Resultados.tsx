// src/pages/Resultados.tsx

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import MatchCard from "@/components/results/MatchCard";
import MatchFilter, { FilterOptions } from "@/components/results/MatchFilter";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext"; // <-- ADICIONADO

export interface Team {
  id: string;
  name: string;
  flag_url: string;
}

export interface MatchWithTeams {
  id: string;
  match_date: string;
  home_score: number | null;
  away_score: number | null;
  is_finished: boolean;
  stage: string;
  stadium: string;
  home_team: Team;
  away_team: Team;
}

const Resultados = () => {
    const { signOut } = useAuth(); // <-- ADICIONADO
    const [matches, setMatches] = useState<MatchWithTeams[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<FilterOptions>({
        teamId: "all",
        stage: "all",
    });

    useEffect(() => {
        const fetchMatches = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error: fetchError } = await supabase
                    .from("matches")
                    .select("*, home_team:home_team_id(*), away_team:away_team_id(*)")
                    .order("match_date", { ascending: true });

                if (fetchError) {
                    throw fetchError;
                }
                setMatches(data as MatchWithTeams[]);
            } catch (err: any) {
                console.error(err);
                setError("Failed to fetch matches.");
                // <-- ADICIONADO
                if (err?.message?.includes('JWT') || err?.code === 'PGRST301') {
                    await signOut();
                }
            } finally {
                setLoading(false);
            }
        };

        fetchMatches();
    }, [signOut]); // <-- ADICIONADO

    const filteredMatches = useMemo(() => {
        return matches.filter(match => {
            const teamMatch = filters.teamId === 'all' || match.home_team.id === filters.teamId || match.away_team.id === filters.teamId;
            const stageMatch = filters.stage === 'all' || match.stage === filters.stage;
            return teamMatch && stageMatch;
        });
    }, [matches, filters]);
    
    // ... O resto do seu código JSX para renderizar a página permanece o mesmo
    return (
        <Layout>
            {/* ... Seu JSX ... */}
        </Layout>
    );
};

export default Resultados;