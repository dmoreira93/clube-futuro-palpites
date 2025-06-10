// src/components/simulation/KnockoutBracket.tsx

import { SimulatedGroup } from '@/lib/simulationEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface Props {
  simulatedGroups: SimulatedGroup[];
}

// Função auxiliar para encontrar um time classificado
const getTeam = (groups: SimulatedGroup[], groupName: string, position: number) => {
  const group = groups.find(g => g.groupName === groupName);
  return group?.standings[position - 1] ?? { teamName: 'A definir', teamId: '' };
};

const KnockoutBracket = ({ simulatedGroups }: Props) => {
  // Define os confrontos das Oitavas de Final
  const roundOf16 = [
    { matchId: 'Oitavas 1', team1: getTeam(simulatedGroups, 'A', 1), team2: getTeam(simulatedGroups, 'B', 2) },
    { matchId: 'Oitavas 2', team1: getTeam(simulatedGroups, 'C', 1), team2: getTeam(simulatedGroups, 'D', 2) },
    { matchId: 'Oitavas 3', team1: getTeam(simulatedGroups, 'E', 1), team2: getTeam(simulatedGroups, 'F', 2) },
    { matchId: 'Oitavas 4', team1: getTeam(simulatedGroups, 'G', 1), team2: getTeam(simulatedGroups, 'H', 2) },
    { matchId: 'Oitavas 5', team1: getTeam(simulatedGroups, 'B', 1), team2: getTeam(simulatedGroups, 'A', 2) },
    { matchId: 'Oitavas 6', team1: getTeam(simulatedGroups, 'D', 1), team2: getTeam(simulatedGroups, 'C', 2) },
    { matchId: 'Oitavas 7', team1: getTeam(simulatedGroups, 'F', 1), team2: getTeam(simulatedGroups, 'E', 2) },
    { matchId: 'Oitavas 8', team1: getTeam(simulatedGroups, 'H', 1), team2: getTeam(simulatedGroups, 'G', 2) },
  ];

  const Matchup = ({ matchId, team1, team2 }: { matchId: string, team1: {teamName: string}, team2: {teamName: string} }) => (
    <div className="border p-2 rounded-md mb-2 bg-gray-50 text-sm">
      <p className="font-bold text-gray-600 mb-1">{matchId}</p>
      <div className="flex justify-between items-center">
        <span>{team1.teamName}</span>
        <span className="mx-2 text-gray-400">vs</span>
        <span>{team2.teamName}</span>
      </div>
    </div>
  );
  
  const BlankMatchup = ({ title }: { title: string }) => (
     <div className="border p-2 rounded-md mb-2 bg-gray-50 text-sm h-[68px] flex flex-col justify-center">
        <p className="font-bold text-gray-600 mb-1">{title}</p>
        <div className="border-b border-gray-300 w-full my-1"></div>
        <div className="border-b border-gray-300 w-full my-1"></div>
    </div>
  );


  return (
    <Card id="printable-bracket">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl md:text-3xl font-bold text-fifa-blue">Chaveamento do Mata-Mata</CardTitle>
        <Button variant="outline" onClick={() => window.print()} className="print-hidden">
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Oitavas de Final */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-center">Oitavas de Final</h3>
          {roundOf16.slice(0, 4).map(match => <Matchup key={match.matchId} {...match} />)}
          <hr className="md:hidden my-4"/>
          {roundOf16.slice(4, 8).map(match => <Matchup key={match.matchId} {...match} />)}
        </div>

        {/* Quartas de Final (Em branco para preenchimento) */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-center">Quartas de Final</h3>
          <BlankMatchup title="Quartas 1" />
          <BlankMatchup title="Quartas 2" />
          <hr className="md:hidden my-4"/>
          <div className="md:mt-[104px]"></div>
          <BlankMatchup title="Quartas 3" />
          <BlankMatchup title="Quartas 4" />
        </div>

        {/* Semifinais (Em branco para preenchimento) */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-center">Semifinais</h3>
          <div className="md:mt-[104px]"></div>
          <BlankMatchup title="Semi 1" />
          <hr className="md:hidden my-4"/>
          <div className="md:mt-[280px]"></div>
          <BlankMatchup title="Semi 2" />
        </div>
        
        {/* Final (Em branco para preenchimento) */}
         <div className="space-y-4">
          <h3 className="font-bold text-lg text-center">Final</h3>
           <div className="md:mt-[280px]"></div>
          <BlankMatchup title="Final" />
        </div>
      </CardContent>
    </Card>
  );
};

export default KnockoutBracket;