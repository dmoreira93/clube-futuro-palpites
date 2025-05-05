
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { updateUserPoints } from "@/utils/pointsCalculator";

// Exemplo de tipo para as partidas
export type Match = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  group: string;
  status: string;
};

export const useMatchResults = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const submitResult = async (
    matchId: number, 
    homeScore: string, 
    awayScore: string, 
    adminPassword: string
  ) => {
    // Validar senha
    if (adminPassword !== "admin123") {
      toast({
        title: "Erro de autenticação",
        description: "Senha do administrador incorreta",
        variant: "destructive",
      });
      return false;
    }

    if (!homeScore || !awayScore) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, informe o placar de ambos os times",
        variant: "destructive",
      });
      return false;
    }

    setIsProcessing(true);

    try {
      // Em ambiente de produção, salvar o resultado no Supabase
      const { error } = await supabase
        .from('matches')
        .update({
          home_score: parseInt(homeScore),
          away_score: parseInt(awayScore),
          is_finished: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', matchId);
      
      if (error) {
        throw error;
      }
      
      // Chamada para atualizar pontuações dos usuários
      await updateUserPoints(String(matchId));
      
      toast({
        title: "Resultado registrado",
        description: "O resultado foi salvo e os pontos foram calculados com sucesso!",
      });
      
      setIsProcessing(false);
      return true;
      
    } catch (error) {
      toast({
        title: "Erro ao processar",
        description: "Houve um erro ao registrar o resultado",
        variant: "destructive",
      });
      console.error("Erro:", error);
      setIsProcessing(false);
      return false;
    }
  };

  return {
    submitResult,
    isProcessing
  };
};
