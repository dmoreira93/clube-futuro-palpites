import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Match as MatchType } from "@/types/matches";
import { Loader2 } from "lucide-react";

type ResultFormProps = {
  match: MatchType | undefined;
  onComplete: () => void;
};

export const ResultForm = ({ match, onComplete }: ResultFormProps) => {
  const { toast } = useToast();
  const [homeScore, setHomeScore] = useState(match?.home_score?.toString() || "");
  const [awayScore, setAwayScore] = useState(match?.away_score?.toString() || "");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!match) return null;

  const handleSubmitResult = async () => {
    const homeScoreNum = parseInt(homeScore, 10);
    const awayScoreNum = parseInt(awayScore, 10);

    if (isNaN(homeScoreNum) || isNaN(awayScoreNum) || homeScoreNum < 0 || awayScoreNum < 0) {
      toast({ title: "Erro de Validação", description: "Por favor, insira placares válidos.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      // Etapa 1: Salvar o resultado na tabela 'matches'
      const { error: updateError } = await supabase
        .from('matches')
        .update({
          home_score: homeScoreNum,
          away_score: awayScoreNum,
          is_finished: true
        })
        .eq('id', match.id);

      if (updateError) throw updateError;
      toast({ title: "Resultado salvo!", description: "Agora calculando os pontos dos usuários..." });

      // Etapa 2: Chamar a função do Supabase para calcular os pontos de todos os usuários para esta partida
      const { error: rpcError } = await supabase.rpc('update_user_points_for_match', {
        match_id_param: match.id
      });
      
      if (rpcError) throw rpcError;

      // Sucesso!
      onComplete();

    } catch (error: any) {
      console.error("Erro ao salvar resultado ou processar pontos:", error);
      toast({
        title: "Erro no Processamento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="shadow-xl border-2 border-fifa-blue rounded-xl overflow-hidden">
      <CardHeader className="bg-fifa-blue text-white p-4">
        <CardTitle className="text-lg md:text-xl">{match.is_finished ? "Corrigir Resultado" : "Inserir Resultado"}</CardTitle>
        <CardDescription className="text-blue-100 text-xs md:text-sm">
          Partida: <span className="font-semibold">{match.home_team?.name || "Casa"} vs {match.away_team?.name || "Fora"}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-around gap-2">
            <div className="flex-1 text-center">
              <label htmlFor={`homeScore-${match.id}`} className="block text-sm font-medium text-gray-700 mb-1 truncate">{match.home_team?.name || "Time da Casa"}</label>
              <Input id={`homeScore-${match.id}`} type="number" min="0" className="text-center w-full sm:w-24 h-12 text-lg mx-auto" value={homeScore} onChange={(e) => setHomeScore(e.target.value)} placeholder="0" disabled={isProcessing}/>
            </div>
            <div className="text-2xl font-bold text-gray-400 pt-6">×</div>
            <div className="flex-1 text-center">
              <label htmlFor={`awayScore-${match.id}`} className="block text-sm font-medium text-gray-700 mb-1 truncate">{match.away_team?.name || "Time Visitante"}</label>
              <Input id={`awayScore-${match.id}`} type="number" min="0" className="text-center w-full sm:w-24 h-12 text-lg mx-auto" value={awayScore} onChange={(e) => setAwayScore(e.target.value)} placeholder="0" disabled={isProcessing}/>
            </div>
          </div>
          <div className="flex justify-center pt-2">
            <Button className="bg-fifa-green hover:bg-green-700 text-white font-semibold py-3 px-6 text-base" onClick={handleSubmitResult} disabled={isProcessing || !homeScore || !awayScore}>
              {isProcessing ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processando...</>) : (match.is_finished ? "Atualizar Resultado e Reprocessar Pontos" : "Registrar Resultado e Calcular Pontos")}
            </Button>
          </div>
          {match.is_finished && (<p className="text-xs text-center text-orange-600 mt-2">Atenção: Atualizar um resultado já finalizado irá reprocessar todas as pontuações.</p>)}
        </div>
      </CardContent>
    </Card>
  );
};