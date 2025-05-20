import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash, Calendar, Clock, Edit, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Match } from "@/types/matches";

interface Team {
  id: string;
  name: string;
  flag_url?: string;
  group_id?: string;
}

const AdminMatches = () => {
  const { toast } = useToast();
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editingResult, setEditingResult] = useState<{id: string, homeScore: string, awayScore: string} | null>(null);
  
  const [newMatch, setNewMatch] = useState<Partial<Match>>({
    home_team_id: "",
    away_team_id: "",
    match_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    stage: "Fase de Grupos",
    stadium: "",
  });

  const stages = ["Fase de Grupos", "Oitavas de Final", "Quartas de Final", "Semifinal", "Final"];

  useEffect(() => {
    const fetchTeamsAndMatches = async () => {
      setIsLoading(true);
      try {
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .order('name');
        
        if (teamsError) throw teamsError;
        setTeams(teamsData || []);

        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select(`
            id, 
            match_date, 
            home_score, 
            away_score, 
            is_finished,
            stage,
            stadium,
            home_team_id, 
            away_team_id,
            home_team:teams!home_team_id(id, name, group_id, flag_url),
            away_team:teams!away_team_id(id, name, group_id, flag_url)
          `)
          .order('match_date', { ascending: true });
        
        if (matchesError) throw matchesError;
        setMatches(matchesData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar as equipes ou partidas",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeamsAndMatches();
  }, [toast]);

  const getTeamById = (id: string): Team | undefined => teams.find(team => team.id === id);

  // As funções handleAddMatch, handleDeleteMatch, handleEditMatch, handleSaveEdit, handleEditResult, handleSaveResult seguem abaixo
  // ...
};

export default AdminMatches;
