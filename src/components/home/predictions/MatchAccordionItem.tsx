
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import PredictionsList from "./PredictionsList";
import { Match } from "@/types/matches";
import { supabase } from "@/integrations/supabase/client";

type MatchAccordionItemProps = {
  match: Match;
};

const MatchAccordionItem = ({ match }: MatchAccordionItemProps) => {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchPredictions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('predictions')
          .select(`
            id,
            home_score,
            away_score,
            user_id,
            users:user_id(name)
          `)
          .eq('match_id', match.id);
          
        if (error) {
          console.error("Error fetching predictions:", error);
        } else {
          setPredictions(data || []);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPredictions();
  }, [match.id]);
  
  const formatMatchDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
  };

  return (
    <AccordionItem key={match.id} value={match.id}>
      <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
        <div className="flex flex-col sm:flex-row w-full justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-fifa-blue text-fifa-blue">
              {match.stage}
            </Badge>
            <span className="text-sm text-gray-500">{formatMatchDate(match.match_date)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold">{match.home_team?.name || "Time da Casa"}</span>
            <div className="bg-gray-100 px-3 py-1 rounded-lg">
              {match.is_finished ? `${match.home_score} - ${match.away_score}` : "vs"}
            </div>
            <span className="font-semibold">{match.away_team?.name || "Time Visitante"}</span>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="px-4 py-2">
          <h3 className="font-medium mb-2">Palpites dos participantes:</h3>
          <PredictionsList 
            predictions={predictions} 
            homeTeamName={match.home_team?.name || "Time da Casa"} 
            awayTeamName={match.away_team?.name || "Time Visitante"} 
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default MatchAccordionItem;
