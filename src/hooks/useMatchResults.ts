
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { updateUserPoints } from "@/utils/pointsCalculator";
import { useAuth } from "@/contexts/AuthContext";

export const useMatchResults = () => {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const submitResult = async (
    matchId: string, 
    homeScore: string, 
    awayScore: string, 
    adminPassword: string
  ) => {
    // Verificar se é administrador pelo contexto Auth
    // Mantemos a senha como fallback para compatibilidade
    if (!isAdmin && adminPassword !== "admin123") {
      toast({
        title: "Erro de autenticação",
        description: "Você não possui permissão para esta ação",
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
      await updateUserPoints(matchId);
      
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
