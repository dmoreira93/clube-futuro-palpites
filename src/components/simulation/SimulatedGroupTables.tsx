// src/components/simulation/SimulatedGroupTables.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { SimulatedGroup } from '@/lib/simulationEngine';
import { Save } from 'lucide-react';

// A interface de Props foi atualizada para receber a função de callback
interface Props {
  simulatedGroups: SimulatedGroup[];
  onAdoptPrediction: (groupId: string, teamId: string, position: 1 | 2) => void;
}

const SimulatedGroupTables = ({ simulatedGroups, onAdoptPrediction }: Props) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {simulatedGroups.map((group) => (
        <Card key={group.groupId}>
          <CardHeader>
            <CardTitle className="text-xl">Grupo {group.groupName}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2">Time</TableHead>
                  <TableHead>P</TableHead>
                  <TableHead>SG</TableHead>
                  {/* Adicionamos uma coluna para as ações */}
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.standings.map((team, index) => (
                  <TableRow key={team.teamId} className={index < 2 ? 'bg-green-100 dark:bg-green-900/30' : ''}>
                    <TableCell className="font-medium">
                      <span className="mr-2">{index + 1}º</span>
                      {team.teamName}
                    </TableCell>
                    <TableCell className="font-bold">{team.points}</TableCell>
                    <TableCell>{team.goalDifference}</TableCell>
                    <TableCell className="text-right">
                      {/* Renderiza o botão apenas para os dois primeiros colocados */}
                      {index < 2 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onAdoptPrediction(group.groupId, team.teamId, (index + 1) as 1 | 2)}
                          className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Adotar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SimulatedGroupTables;