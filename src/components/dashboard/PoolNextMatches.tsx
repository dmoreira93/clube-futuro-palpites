// src/components/dashboard/PoolNextMatches.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, CalendarClock, ChevronRight } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PoolNextMatchesProps {
  championshipId: string;
  poolId: string;
}

export function PoolNextMatches({ championshipId, poolId }: PoolNextMatchesProps) {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchDate, setMatchDate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchNextGameDay = async () => {
      setLoading(true);
      try {
        const now = new Date().toISOString();

        const { data: nextMatch, error: nextMatchError } = await supabase
          .from('matches')
          .select('match_date')
          .eq('championship_id', championshipId)
          .gt('match_date', now)
          .order('match_date', { ascending: true })
          .limit(1)
          .single();

        if (nextMatchError && nextMatchError.code !== 'PGRST116') {
             console.error("Erro ao buscar data:", nextMatchError);
             setLoading(false);
             return;
        }

        if (!nextMatch) {
            setMatches([]);
            setLoading(false);
            return;
        }

        const targetDate = new Date(nextMatch.match_date);
        setMatchDate(targetDate);

        const start = startOfDay(targetDate).toISOString();
        const end = endOfDay(targetDate).toISOString();

        // CORREÇÃO AQUI: Trocado "round" por "stage" para coincidir com o banco de dados
        const { data: todaysMatches, error: matchesError } = await supabase
          .from('matches')
          .select(`
            id,
            match_date,
            stage,
            home_team:teams!home_team_id(name, flag_url, code),
            away_team:teams!away_team_id(name, flag_url, code)
          `)
          .eq('championship_id', championshipId)
          .gte('match_date', start)
          .lte('match_date', end)
          .order('match_date', { ascending: true });

        if (matchesError) throw matchesError;
        setMatches(todaysMatches || []);

      } catch (error) {
        console.error("Erro ao carregar jogos:", error);
      } finally {
        setLoading(false);
      }
    };

    if (championshipId) {
        fetchNextGameDay();
    }
  }, [championshipId]);

  if (loading) {
    return (
        <Card className="h-full border-blue-100 bg-blue-50/20">
            <CardHeader>
                <CardTitle className="text-lg text-fifa-blue">Próximos Jogos</CardTitle>
            </CardHeader>
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-fifa-blue" /></div>
        </Card>
    );
  }

  return (
    <Card className="h-full border-blue-100 bg-gradient-to-b from-white to-blue-50/30">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-lg text-fifa-blue flex items-center gap-2">
                    <CalendarClock className="h-5 w-5 text-fifa-gold" /> Próximos Jogos
                </CardTitle>
                <CardDescription>
                    {matches.length > 0 && matchDate
                        ? `Jogos de ${format(matchDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}`
                        : "Prepare seus palpites!"
                    }
                </CardDescription>
            </div>
            {matches.length > 0 && (
                <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-800 p-0 h-auto" onClick={() => navigate(`/pool/${poolId}/palpites`)}>
                    Ver todos <ChevronRight className="h-3 w-3 ml-1"/>
                </Button>
            )}
        </div>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            <p className="mb-2">Não há partidas agendadas para os próximos dias neste campeonato.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => (
              <div key={match.id} className="flex flex-col bg-white border border-gray-100 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                
                {/* CORREÇÃO AQUI: Renderizando match.stage em vez de match.round */}
                <div className="flex justify-between items-center mb-2 text-[10px] text-gray-400 uppercase font-bold tracking-wide">
                    <span>{match.stage}</span>
                    <span>{format(new Date(match.match_date), "HH:mm")}</span>
                </div>

                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-8 w-8 border border-gray-100">
                            <AvatarImage src={match.home_team?.flag_url} />
                            <AvatarFallback>{match.home_team?.name?.substring(0,2)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-semibold text-gray-800 truncate">{match.home_team?.name}</span>
                    </div>

                    <span className="text-xs text-gray-300 font-light px-2">X</span>

                    <div className="flex items-center gap-3 flex-1 justify-end">
                        <span className="text-sm font-semibold text-gray-800 truncate text-right">{match.away_team?.name}</span>
                        <Avatar className="h-8 w-8 border border-gray-100">
                            <AvatarImage src={match.away_team?.flag_url} />
                            <AvatarFallback>{match.away_team?.name?.substring(0,2)}</AvatarFallback>
                        </Avatar>
                    </div>
                </div>
              </div>
            ))}
            
            <Button className="w-full mt-2 bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200" variant="outline" onClick={() => navigate(`/pool/${poolId}/palpites`)}>
                Palpitar Agora
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}