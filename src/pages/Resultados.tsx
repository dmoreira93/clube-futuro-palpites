import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Volleyball as SoccerBallIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { updateUserPoints } from "@/utils/pointsCalculator";

// Sample matches data
const matchesData = [
  {
    id: 1,
    homeTeam: "Real Madrid",
    awayTeam: "Manchester City",
    date: "2025-06-15",
    time: "15:00",
    group: "A",
    status: "upcoming",
  },
  {
    id: 2,
    homeTeam: "Fluminense",
    awayTeam: "Bayern Munich",
    date: "2025-06-15",
    time: "18:00",
    group: "B",
    status: "upcoming",
  },
  {
    id: 3,
    homeTeam: "Inter Miami",
    awayTeam: "Al-Hilal",
    date: "2025-06-16",
    time: "15:00",
    group: "C",
    status: "upcoming",
  },
];

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR");
};

const Resultados = () => {
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [selectedMatch, setSelectedMatch] = useState<number | null>(null);
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectMatch = (matchId: number) => {
    setSelectedMatch(matchId);
    setHomeScore("");
    setAwayScore("");
  };

  const handleSubmitResult = async () => {
    // In a real app, we would validate the admin password and send the data to a server
    if (adminPassword !== "admin123") {
      toast({
        title: "Erro de autenticação",
        description: "Senha do administrador incorreta",
        variant: "destructive",
      });
      return;
    }

    if (!homeScore || !awayScore) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, informe o placar de ambos os times",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Em uma implementação real, atualiza o resultado no Supabase
      
      // Simulação para ambiente de desenvolvimento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Atualizar o resultado da partida (em implementação real)
      // const { error } = await supabase
      //   .from('matches')
      //   .update({
      //     home_score: parseInt(homeScore),
      //     away_score: parseInt(awayScore),
      //     is_finished: true,
      //     updated_at: new Date().toISOString()
      //   })
      //   .eq('id', selectedMatch);
      
      // if (error) {
      //   throw error;
      // }
      
      // Chamada para atualizar pontuações dos usuários
      // await updateUserPoints(selectedMatch);
      
      toast({
        title: "Resultado registrado",
        description: "O resultado foi salvo e os pontos foram calculados com sucesso!",
      });
      
      // Reset form
      setSelectedMatch(null);
      setHomeScore("");
      setAwayScore("");
      setAdminPassword("");
      
    } catch (error) {
      toast({
        title: "Erro ao processar",
        description: "Houve um erro ao registrar o resultado",
        variant: "destructive",
      });
      console.error("Erro:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredMatches = filter === "all" 
    ? matchesData 
    : matchesData.filter(match => match.group === filter);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-fifa-blue">Resultados dos Jogos</h1>
          <p className="text-gray-600 mt-2">
            Administrador: insira os resultados das partidas para atualizar a pontuação dos participantes
          </p>
        </div>

        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertTitle className="text-amber-800">Área restrita</AlertTitle>
          <AlertDescription className="text-amber-700">
            Apenas administradores podem inserir resultados. Os participantes devem aguardar a atualização oficial.
            <strong className="block mt-2">
              Ao registrar um resultado, o sistema calculará automaticamente os pontos dos participantes conforme os critérios estabelecidos.
            </strong>
          </AlertDescription>
        </Alert>

        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-fifa-blue">Jogos</h2>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os jogos</SelectItem>
                <SelectItem value="A">Grupo A</SelectItem>
                <SelectItem value="B">Grupo B</SelectItem>
                <SelectItem value="C">Grupo C</SelectItem>
                <SelectItem value="D">Grupo D</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {filteredMatches.map((match) => (
            <Card 
              key={match.id} 
              className={`cursor-pointer transition-all ${
                selectedMatch === match.id ? "ring-2 ring-fifa-blue" : ""
              }`}
              onClick={() => handleSelectMatch(match.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-sm font-medium">Grupo {match.group}</CardTitle>
                    <CardDescription>
                      {formatDate(match.date)} • {match.time}
                    </CardDescription>
                  </div>
                  <SoccerBallIcon className="h-5 w-5 text-fifa-blue" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{match.homeTeam}</span>
                  <div className="mx-3 px-4 py-1 bg-gray-100 rounded-lg font-bold">
                    vs
                  </div>
                  <span className="font-semibold">{match.awayTeam}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedMatch && (
          <Card className="shadow-lg mb-8">
            <CardHeader className="bg-fifa-blue text-white">
              <CardTitle className="text-lg">Inserir Resultado</CardTitle>
              <CardDescription className="text-gray-200">
                Adicione o placar final da partida selecionada e os pontos serão calculados automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {matchesData.find(m => m.id === selectedMatch) && (
                <div className="space-y-6">
                  <div className="text-center font-semibold">
                    {matchesData.find(m => m.id === selectedMatch)?.homeTeam} vs {matchesData.find(m => m.id === selectedMatch)?.awayTeam}
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <p className="text-sm mb-1">{matchesData.find(m => m.id === selectedMatch)?.homeTeam}</p>
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
                      <p className="text-sm mb-1">{matchesData.find(m => m.id === selectedMatch)?.awayTeam}</p>
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
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Resultados;
