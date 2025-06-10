import React, { useState } from 'react';
import { SimulatedGroup, SimulatedTeamStats } from '@/lib/simulationEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface KnockoutBracketProps {
  simulatedGroups: SimulatedGroup[];
  knockoutSelections: { [matchId: string]: string };
  onSelectionChange: (matchId: string, teamId: string) => void;
  onAdoptFinalPrediction: (role: 'champion' | 'runner_up' | 'third_place' | 'fourth_place', teamId: string | undefined) => void;
  onAdoptAllFinalPredictions: (championId: string, runnerUpId: string, thirdPlaceId: string, fourthPlaceId: string, finalHomeScore: number, finalAwayScore: number) => void;
  allTeams: SimulatedTeamStats[];
}

const KnockoutBracket: React.FC<KnockoutBracketProps> = ({
  simulatedGroups,
  knockoutSelections,
  onSelectionChange,
  onAdoptFinalPrediction,
  onAdoptAllFinalPredictions,
  allTeams,
}) => {
  const [finalHomeScore, setFinalHomeScore] = useState('');
  const [finalAwayScore, setFinalAwayScore] = useState('');

  const getTeam = (groupName: string, position: number) => simulatedGroups.find(g => g.groupName === groupName)?.standings[position - 1];
  const findTeamById = (teamId?: string) => teamId ? allTeams.find(t => t.teamId === teamId) : undefined;
  const getLoser = (team1?: SimulatedTeamStats, team2?: SimulatedTeamStats, winnerId?: string) => {
    if (!team1 || !team2 || !winnerId) return undefined;
    return winnerId === team1.teamId ? team2 : team1;
  };

  const final_teams = [findTeamById(knockoutSelections['sf-1']), findTeamById(knockoutSelections['sf-2'])];
  const third_place_teams = [
    getLoser(final_teams[0], final_teams[1], knockoutSelections['final']),
    getLoser(final_teams[1], final_teams[0], knockoutSelections['final'])
  ];

  const champion = findTeamById(knockoutSelections['final']);
  const runnerUp = getLoser(final_teams[0], final_teams[1], knockoutSelections['final']);
  const thirdPlace = findTeamById(knockoutSelections['third_place']);
  const fourthPlace = getLoser(third_place_teams[0], third_place_teams[1], knockoutSelections['third_place']);

  const handleAdoptAll = () => {
    if (!champion || !runnerUp || !thirdPlace || !fourthPlace) return;
    const home = parseInt(finalHomeScore);
    const away = parseInt(finalAwayScore);
    if (isNaN(home) || isNaN(away)) return;
    onAdoptAllFinalPredictions(champion.teamId, runnerUp.teamId, thirdPlace.teamId, fourthPlace.teamId, home, away);
  };

  return (
    <Card id="knockout-bracket-card" className="print:border-none print:shadow-none">
      <CardHeader className="flex flex-row items-center justify-between print-hidden">
        <CardTitle className="text-2xl md:text-3xl font-bold text-fifa-blue">Chaveamento do Mata-Mata</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <p className="font-semibold">Final:</p>
              <Select onValueChange={(val) => onSelectionChange('final', val)} value={knockoutSelections['final'] || ''}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Escolha o campeão" /></SelectTrigger>
                <SelectContent>
                  {final_teams.map(t => t && <SelectItem key={t.teamId} value={t.teamId}>{t.teamName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Placar Campeão" value={finalHomeScore} onChange={(e) => setFinalHomeScore(e.target.value)} />
              <Input type="number" placeholder="Placar Vice" value={finalAwayScore} onChange={(e) => setFinalAwayScore(e.target.value)} />
            </div>

            <div>
              <p className="font-semibold mt-2">3º Lugar:</p>
              <Select onValueChange={(val) => onSelectionChange('third_place', val)} value={knockoutSelections['third_place'] || ''}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Escolha o 3º lugar" /></SelectTrigger>
                <SelectContent>
                  {third_place_teams.map(t => t && <SelectItem key={t.teamId} value={t.teamId}>{t.teamName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-end">
            <Button className="w-full bg-green-600" onClick={handleAdoptAll}>
              <Save className="mr-2 h-4 w-4" /> Adotar todos os palpites finais
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KnockoutBracket;