
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMatchResults } from "@/hooks/useMatchResults";
import { Match } from "@/hooks/useMatchResults";

type ResultFormProps = {
  match: Match | undefined;
  onComplete: () => void;
};

export const ResultForm = ({ match, onComplete }: ResultFormProps) => {
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const { submitResult, isProcessing } = useMatchResults();

  if (!match) return null;

  const handleSubmitResult = async () => {
    const success = await submitResult(match.id, homeScore, awayScore, adminPassword);
    
    if (success) {
      setHomeScore("");
      setAwayScore("");
      setAdminPassword("");
      onComplete();
    }
  };

  return (
    <Card className="shadow-lg mb-8">
      <CardHeader className="bg-fifa-blue text-white">
        <CardTitle className="text-lg">Inserir Resultado</CardTitle>
        <CardDescription className="text-gray-200">
          Adicione o placar final da partida selecionada e os pontos serão calculados automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="text-center font-semibold">
            {match.homeTeam} vs {match.awayTeam}
          </div>

          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-sm mb-1">{match.homeTeam}</p>
              <Input
                type="number"
                min="0"
                className="text-center w-20"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
              />
            </div>
            <div className="text-2xl font-bold">×</div>
            <div className="text-center">
              <p className="text-sm mb-1">{match.awayTeam}</p>
              <Input
                type="number"
                min="0"
                className="text-center w-20"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium mb-1">
              Senha do Administrador
            </label>
            <Input
              id="admin-password"
              type="password"
              placeholder="Digite a senha de administrador"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />
          </div>

          <div className="flex justify-center">
            <Button 
              className="bg-fifa-blue hover:bg-opacity-90"
              onClick={handleSubmitResult}
              disabled={isProcessing}
            >
              {isProcessing ? "Processando..." : "Registrar Resultado e Calcular Pontos"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
