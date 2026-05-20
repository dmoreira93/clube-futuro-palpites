import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { SimulatedGroup } from '@/lib/simulationEngine';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  simulatedGroups: SimulatedGroup[];
  onAdoptPrediction: (groupId: string, firstTeamId: string, secondTeamId: string) => void;
  isDeadlinePassed: boolean;
}

const SimulatedGroupTables = ({ simulatedGroups, onAdoptPrediction, isDeadlinePassed }: Props) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
      {simulatedGroups.map((group) => {
        const first = group.standings[0];
        const second = group.standings[1];
        
        const handleAdoptClick = () => {
          if (!first?.teamId || !second?.teamId) {
            return toast.error("Por favor, preencha os placares dos jogos para calcular as posições do grupo antes de adotar.");
          }
          onAdoptPrediction(group.groupId, first.teamId, second.teamId);
        };

        return (
          <Card key={group.groupId} className="print:shadow-none print:border print:break-inside-avoid">
            <CardHeader className="print:p-2">
              <CardTitle className="text-xl print:text-sm print:font-semibold">Grupo {group.groupName}</CardTitle>
            </CardHeader>
            <CardContent className="print:p-1">
              <Table className="print:text-[10px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/2 print:p-1">Time</TableHead>
                    <TableHead className="print:p-1 text-center">P</TableHead>
                    <TableHead className="print:p-1 text-center">J</TableHead>
                    <TableHead className="print:p-1 text-center">V</TableHead>
                    <TableHead className="print:p-1 text-center">E</TableHead>
                    <TableHead className="print:p-1 text-center">D</TableHead>
                    <TableHead className="print:p-1 text-center">SG</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.standings.map((team, index) => (
                    <TableRow key={team.teamId} className={index < 2 ? 'bg-green-100 dark:bg-green-900/30' : ''}>
                      <TableCell className="font-medium print:p-1 print:font-normal">
                        <span className="mr-2">{index + 1}º</span>{team.teamName}
                      </TableCell>
                      <TableCell className="font-bold print:p-1 text-center">{team.points}</TableCell>
                      <TableCell className="print:p-1 text-center">{team.gamesPlayed}</TableCell>
                      <TableCell className="print:p-1 text-center">{team.wins}</TableCell>
                      <TableCell className="print:p-1 text-center">{team.draws}</TableCell>
                      <TableCell className="print:p-1 text-center">{team.losses}</TableCell>
                      <TableCell className="print:p-1 text-center">{team.goalDifference}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-3 text-right print:hidden">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                  onClick={handleAdoptClick}
                  disabled={isDeadlinePassed}
                >
                  <Save className="h-4 w-4 mr-1" /> 
                  {isDeadlinePassed ? 'Prazo Encerrado' : 'Adotar posições do grupo'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SimulatedGroupTables;