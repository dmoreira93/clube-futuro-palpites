
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Volleyball as SoccerBallIcon, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const NextMatches = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcomingMatches = async () => {
      setLoading(true);
      try {
        // Get current date
        const now = new Date();
        
        // Fetch upcoming matches
        const { data, error } = await supabase
          .from('matches')
          .select(`
            id,
            match_date,
            stage,
            home_team:home_team_id(id, name, flag_url),
            away_team:away_team_id(id, name, flag_url)
          `)
          .gt('match_date', now.toISOString())
          .is('is_finished', false)
          .order('match_date', { ascending: true })
          .limit(5);
          
        if (error) {
          console.error("Error fetching upcoming matches:", error);
        } else {
          setMatches(data || []);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUpcomingMatches();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };
  
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "HH:mm", { locale: ptBR });
  };

  if (loading) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="bg-fifa-blue text-white">
          <div className="flex items-center gap-2">
            <SoccerBallIcon className="h-5 w-5 text-fifa-gold" />
            <CardTitle>Próximos Jogos</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-fifa-blue" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-fifa-blue text-white">
        <div className="flex items-center gap-2">
          <SoccerBallIcon className="h-5 w-5 text-fifa-gold" />
          <CardTitle>Próximos Jogos</CardTitle>
        </div>
        <CardDescription className="text-gray-300">
          Prepare seus palpites para estas partidas
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {matches.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Não há jogos programados para os próximos dias
          </div>
        ) : (
          <div className="divide-y">
            {matches.map((match) => (
              <div key={match.id} className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">
                    {formatDate(match.match_date)} • {formatTime(match.match_date)}
                  </span>
                  <Badge variant="outline" className="border-fifa-blue text-fifa-blue">
                    {match.stage}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex-1 text-right flex items-center justify-end gap-2">
                    <div className="w-6 h-6 flex justify-center">
                      <Avatar className="h-6 w-6">
                        {match.home_team?.flag_url ? (
                          <AvatarImage src={match.home_team.flag_url} alt={match.home_team?.name} />
                        ) : (
                          <AvatarFallback className="text-xs">
                            {match.home_team?.name?.substring(0, 2) || ""}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                    <span className="font-semibold">{match.home_team?.name}</span>
                  </div>
                  <div className="mx-3 px-4 py-1 bg-gray-100 rounded-lg font-bold">
                    vs
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="font-semibold">{match.away_team?.name}</span>
                    <div className="w-6 h-6 flex justify-center">
                      <Avatar className="h-6 w-6">
                        {match.away_team?.flag_url ? (
                          <AvatarImage src={match.away_team.flag_url} alt={match.away_team?.name} />
                        ) : (
                          <AvatarFallback className="text-xs">
                            {match.away_team?.name?.substring(0, 2) || ""}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NextMatches;
