
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Football as SoccerBallIcon, Trophy as TrophyIcon, Users as UsersIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Sample teams data
const teams = [
  "Real Madrid",
  "Manchester City",
  "Bayern Munich",
  "Fluminense",
  "Inter Miami",
  "Al-Hilal",
  "Urawa Red Diamonds",
  "Auckland City",
];

// Sample group matches data
const groupMatches = [
  {
    id: 101,
    homeTeam: "Real Madrid",
    awayTeam: "Manchester City",
    date: "2025-06-15",
    group: "A",
  },
  {
    id: 102,
    homeTeam: "Bayern Munich",
    awayTeam: "Fluminense",
    date: "2025-06-15",
    group: "B",
  },
  {
    id: 103,
    homeTeam: "Inter Miami",
    awayTeam: "Al-Hilal",
    date: "2025-06-16",
    group: "C",
  },
  {
    id: 104,
    homeTeam: "Urawa Red Diamonds",
    awayTeam: "Auckland City",
    date: "2025-06-16",
    group: "D",
  },
];

const groups = [
  { id: "A", teams: ["Real Madrid", "Manchester City", "Urawa Red Diamonds", "Auckland City"] },
  { id: "B", teams: ["Bayern Munich", "Fluminense", "Al-Hilal", "Inter Miami"] },
];

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR");
};

const Palpites = () => {
  const { toast } = useToast();
  const [matchBets, setMatchBets] = useState<{ [key: number]: { home: string, away: string } }>({});
  const [groupPredictions, setGroupPredictions] = useState<{ [key: string]: { first: string, second: string } }>({});
  const [finalPredictions, setFinalPredictions] = useState({
    champion: "",
    viceChampion: "",
    third: "",
    fourth: "",
  });
  const [userPassword, setUserPassword] = useState("");

  const handleMatchBetChange = (matchId: number, team: 'home' | 'away', value: string) => {
    setMatchBets(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId] || { home: '', away: '' },
        [team]: value
      }
    }));
  };

  const handleGroupPredictionChange = (groupId: string, position: 'first' | 'second', value: string) => {
    setGroupPredictions(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId] || { first: '', second: '' },
        [position]: value
      }
    }));
  };

  const handleFinalPredictionChange = (position: keyof typeof finalPredictions, value: string) => {
    setFinalPredictions(prev => ({
      ...prev,
      [position]: value
    }));
  };

  const handleSubmitBets = () => {
    if (!userPassword) {
      toast({
        title: "Senha não informada",
        description: "Por favor, digite sua senha para confirmar os palpites.",
        variant: "destructive",
      });
      return;
    }

    // In a real app, we would validate the password and save the bets to a server
    toast({
      title: "Palpites registrados com sucesso!",
      description: "Seus palpites foram salvos e não poderão mais ser alterados.",
    });

    // Reset password field
    setUserPassword("");
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-fifa-blue">Meus Palpites</h1>
          <p className="text-gray-600 mt-2">
            Registre aqui seus palpites para o Mundial de Clubes FIFA 2025
          </p>
        </div>

        <Alert className="mb-6">
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            Os palpites só podem ser registrados antes do início da competição. Após confirmar seus palpites, eles não poderão ser alterados.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="matches" className="mb-8">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="matches" className="flex items-center gap-2">
              <SoccerBallIcon className="h-4 w-4" />
              Jogos
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              Grupos
            </TabsTrigger>
            <TabsTrigger value="finals" className="flex items-center gap-2">
              <TrophyIcon className="h-4 w-4" />
              Final
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="matches" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Palpites para Jogos</CardTitle>
                <CardDescription>
                  Registre o placar que você acredita para cada jogo da competição
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {groupMatches.map((match) => (
                  <div key={match.id} className="p-4 border rounded-md">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-gray-500">
                        {formatDate(match.date)} • Grupo {match.group}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 text-right">
                        <p className="font-medium mb-1">{match.homeTeam}</p>
                        <Input 
                          type="number" 
                          min="0"
                          className="w-16 ml-auto" 
                          value={matchBets[match.id]?.home || ""}
                          onChange={(e) => handleMatchBetChange(match.id, 'home', e.target.value)}
                        />
                      </div>
                      <div className="mx-2">vs</div>
                      <div className="flex-1">
                        <p className="font-medium mb-1">{match.awayTeam}</p>
                        <Input 
                          type="number" 
                          min="0"
                          className="w-16" 
                          value={matchBets[match.id]?.away || ""}
                          onChange={(e) => handleMatchBetChange(match.id, 'away', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="groups" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Classificação nos Grupos</CardTitle>
                <CardDescription>
                  Preveja quais times ficarão em 1º e 2º lugar em cada grupo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {groups.map(group => (
                  <div key={group.id} className="p-4 border rounded-md">
                    <h3 className="font-bold mb-3">Grupo {group.id}</h3>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor={`group-${group.id}-1st`}>1º Lugar</Label>
                        <Select 
                          value={groupPredictions[group.id]?.first || ""} 
                          onValueChange={(value) => handleGroupPredictionChange(group.id, 'first', value)}
                        >
                          <SelectTrigger id={`group-${group.id}-1st`}>
                            <SelectValue placeholder="Selecione um time" />
                          </SelectTrigger>
                          <SelectContent>
                            {group.teams.map(team => (
                              <SelectItem key={team} value={team}>
                                {team}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`group-${group.id}-2nd`}>2º Lugar</Label>
                        <Select 
                          value={groupPredictions[group.id]?.second || ""} 
                          onValueChange={(value) => handleGroupPredictionChange(group.id, 'second', value)}
                        >
                          <SelectTrigger id={`group-${group.id}-2nd`}>
                            <SelectValue placeholder="Selecione um time" />
                          </SelectTrigger>
                          <SelectContent>
                            {group.teams.map(team => (
                              <SelectItem key={team} value={team}>
                                {team}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="finals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Classificação Final</CardTitle>
                <CardDescription>
                  Preveja quem será o campeão, vice, terceiro e quarto colocados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="champion" className="flex items-center gap-1">
                      <TrophyIcon className="h-4 w-4 text-fifa-gold" /> Campeão
                    </Label>
                    <Select 
                      value={finalPredictions.champion} 
                      onValueChange={(value) => handleFinalPredictionChange('champion', value)}
                    >
                      <SelectTrigger id="champion">
                        <SelectValue placeholder="Selecione um time" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map(team => (
                          <SelectItem key={team} value={team}>
                            {team}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vice-champion">Vice-Campeão</Label>
                    <Select 
                      value={finalPredictions.viceChampion} 
                      onValueChange={(value) => handleFinalPredictionChange('viceChampion', value)}
                    >
                      <SelectTrigger id="vice-champion">
                        <SelectValue placeholder="Selecione um time" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map(team => (
                          <SelectItem key={team} value={team}>
                            {team}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="third-place">Terceiro Lugar</Label>
                    <Select 
                      value={finalPredictions.third} 
                      onValueChange={(value) => handleFinalPredictionChange('third', value)}
                    >
                      <SelectTrigger id="third-place">
                        <SelectValue placeholder="Selecione um time" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map(team => (
                          <SelectItem key={team} value={team}>
                            {team}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fourth-place">Quarto Lugar</Label>
                    <Select 
                      value={finalPredictions.fourth} 
                      onValueChange={(value) => handleFinalPredictionChange('fourth', value)}
                    >
                      <SelectTrigger id="fourth-place">
                        <SelectValue placeholder="Selecione um time" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map(team => (
                          <SelectItem key={team} value={team}>
                            {team}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="shadow-lg mb-8">
          <CardHeader className="bg-fifa-blue text-white">
            <CardTitle>Confirme seus Palpites</CardTitle>
            <CardDescription className="text-gray-200">
              Para salvar seus palpites, digite sua senha e confirme
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Digite sua senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Senha para confirmar seus palpites"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
              />
            </div>
            
            <Button 
              className="w-full bg-fifa-blue hover:bg-opacity-90"
              onClick={handleSubmitBets}
            >
              Confirmar Palpites
            </Button>

            <p className="text-sm text-gray-500 text-center">
              Atenção: Após confirmar, seus palpites ficarão registrados e não poderão ser alterados.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Palpites;
