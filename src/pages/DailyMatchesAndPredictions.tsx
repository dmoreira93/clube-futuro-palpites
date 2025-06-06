import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Info, User as UserIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  fetchMatchesInUTCRange,
  fetchMatchPredictionsForMatches,
  fetchUsersCustom,
} from '@/utils/pointsCalculator/dataAccess';
import {
  SupabaseMatchResultFromMatches,
  SupabaseMatchPrediction,
  User,
} from '@/utils/pointsCalculator/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext'; // <-- ADICIONADO

interface DisplayMatch extends SupabaseMatchResultFromMatches {
  home_team: { name: string; flag_url?: string; group_id?: string; group?: { name: string } } | null;
  away_team: { name: string; flag_url?: string; group_id?: string; group?: { name: string } } | null;
  predictionsByUserId?: { [userId: string]: SupabaseMatchPrediction };
}

const DailyMatchesAndPredictions: React.FC = () => {
  const { signOut } = useAuth(); // <-- ADICIONADO
  const [matches, setMatches] = useState<DisplayMatch[]>([]);
  const [allPredictions, setAllPredictions] = useState<SupabaseMatchPrediction[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const predictionDisplayCutoffDate = useMemo(() => parseISO("2025-06-14T18:00:00-03:00"), []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const day = currentDate.getDate();
        
        const utcStartDate = new Date(Date.UTC(year, month, day, 3, 0, 0));
        const utcEndDate = new Date(Date.UTC(year, month, day + 1, 3, 0, 0));
        
        const utcStartString = utcStartDate.toISOString();
        const utcEndString = utcEndDate.toISOString();

        const matchesData = await fetchMatchesInUTCRange(utcStartString, utcEndString);

        if (!matchesData || matchesData.length === 0) {
          setMatches([]);
          setAllPredictions([]);
          setAllUsers([]);
          return;
        }

        const matchIds = matchesData.map(match => match.id);
        const [predictionsData, usersData] = await Promise.all([
            fetchMatchPredictionsForMatches(matchIds),
            fetchUsersCustom()
        ]);
        
        const nonAdminUsers = usersData.filter(user => !user.is_admin);

        setMatches(matchesData);
        setAllPredictions(predictionsData || []);
        setAllUsers(nonAdminUsers || []);

      } catch (err: any) {
        console.error("Erro ao carregar dados:", err.message);
        setError("Não foi possível carregar os dados das partidas e palpites.");
        // <-- ADICIONADO
        if (err?.message?.includes('JWT') || err?.code === 'PGRST301') {
          await signOut();
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentDate, signOut]); // <-- ADICIONADO

  const handleDateChange = (days: number) => {
    setCurrentDate(prevDate => addDays(prevDate, days));
  };

  // ... O resto do seu código JSX para renderizar a página permanece o mesmo
  return (
    <Layout>
      {/* ... Seu JSX ... */}
    </Layout>
  );
};

export default DailyMatchesAndPredictions;