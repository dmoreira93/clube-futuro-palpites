// src/hooks/useMatchResults.ts

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext'; // <-- ADICIONADO

export interface MatchResult {
  id: string;
  home_score: number | null;
  away_score: number | null;
  match_date: string;
  is_finished: boolean;
  stage: string;
}

const useMatchResults = (matchIds: string[]) => {
  const { signOut } = useAuth(); // <-- ADICIONADO
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!matchIds || matchIds.length === 0) {
        setResults([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('matches')
          .select('id, home_score, away_score, match_date, is_finished, stage')
          .in('id', matchIds);

        if (fetchError) {
          throw fetchError;
        }

        setResults(data || []);
      } catch (error: any) {
        console.error('Error fetching match results:', error);
        setError(error.message);
        // <-- ADICIONADO
        if (error?.message?.includes('JWT') || error?.code === 'PGRST301') {
          await signOut();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [matchIds, signOut]); // <-- ADICIONADO

  return { results, loading, error };
};

export default useMatchResults;