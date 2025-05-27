// src/components/results/ResultForm.tsx
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMatchResults } from "@/hooks/useMatchResults"; //
import { Match as MatchType } from "@/types/matches";
import { Loader2 } from "lucide-react";

type ResultFormProps = {
  match: MatchType | undefined;
  onComplete: () => void;
};

export const ResultForm = ({ match, onComplete }: ResultFormProps) => {
  const [homeScore, setHomeScore] = useState(match?.home_score?.toString() || "");
  const [awayScore, setAwayScore] = useState(match?.away_score?.toString() || "");
  // Removida a senha do admin, pois a lógica de permissão está no useAuth
  const { submitResult, isProcessing } = useMatchResults(); //

  if (!match) return null;

  const handleSubmitResult = async () => {
    // A senha do admin não é mais passada aqui
    const success = await submitResult(match.id, homeScore, awayScore, "admin_password_placeholder"); //
    
    if (success) {
      // Não limpar os campos aqui, pois o componente pode ser desmontado
      // A atualização da lista mostrará os novos valores
      onComplete();
    }
  };

  return (
    <Card className="shadow-xl border-2 border-fifa-blue rounded-xl overflow-hidden">
      <CardHeader className="bg-fifa-blue text-white p-4">
        <CardTitle className="text-lg md:text-xl">
          {match.is_finished ? "Corrigir Resultado" : "Inserir Resultado"}
        </CardTitle>
        <CardDescription className="text-blue-100 text-xs md:text-sm">
          Partida: <span className="font-semibold">{match.home_team?.name || "Casa"} vs {match.away_team?.name || "Fora"}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-around gap-2">
            <div className="flex-1 text-center">
              <label htmlFor={`homeScore-${match.id}`} className="block text-sm font-medium text-gray-700 mb-1 truncate">
                {match.home_team?.name || "Time da Casa"}
              </label>
              <Input
                id={`homeScore-${match.id}`}
                type="number"
                min="0"
                className="text-center w-full sm:w-24 h-12 text-lg mx-auto" // Aumentado e centralizado
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                placeholder="0"
                disabled={isProcessing}
              />
            </div>
            <div className="text-2xl font-bold text-gray-400 pt-6">×</div> {/* Alinhado com inputs */}
            <div className="flex-1 text-center">
              <label htmlFor={`awayScore-${match.id}`} className="block text-sm font-medium text-gray-700 mb-1 truncate">
                {match.away_team?.name || "Time Visitante"}
              </label>
              <Input
                id={`awayScore-${match.id}`}
                type="number"
                min="0"
                className="text-center w-full sm:w-24 h-12 text-lg mx-auto" // Aumentado e centralizado
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                placeholder="0"
                disabled={isProcessing}
              />
            </div>
          </div>

          {/* Removido campo de senha do admin, a verificação deve ser feita no backend ou via useAuth */}

          <div className="flex justify-center pt-2">
            <Button 
              className="bg-fifa-green hover:bg-green-700 text-white font-semibold py-3 px-6 text-base"
              onClick={handleSubmitResult}
              disabled={isProcessing || !homeScore || !awayScore } // Desabilita se campos vazios
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processando...
                </>
              ) : (match.is_finished ? "Atualizar Resultado e Reprocessar Pontos" : "Registrar Resultado e Calcular Pontos")}
            </Button>
          </div>
           {match.is_finished && (
            <p className="text-xs text-center text-orange-600 mt-2">
                Atenção: Atualizar um resultado já finalizado irá reprocessar todas as pontuações relacionadas a esta partida.
            </p>
           )}
        </div>
      </CardContent>
    </Card>
  );
};