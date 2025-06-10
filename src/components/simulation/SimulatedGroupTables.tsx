// src/components/simulation/SimulatedGroupTables.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SimulatedGroup } from '@/lib/simulationEngine';

interface Props {
  simulatedGroups: SimulatedGroup[];
}

const SimulatedGroupTables = ({ simulatedGroups }: Props) => {
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
                  <TableHead>J</TableHead>
                  <TableHead>V</TableHead>
                  <TableHead>E</TableHead>
                  <TableHead>D</TableHead>
                  <TableHead>SG</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.standings.map((team, index) => (
                  <TableRow key={team.teamId} className={index < 2 ? 'bg-green-100' : ''}>
                    <TableCell className="font-medium">
                      <span className="mr-2">{index + 1}º</span>
                      {team.teamName}
                    </TableCell>
                    <TableCell className="font-bold">{team.points}</TableCell>
                    <TableCell>{team.gamesPlayed}</TableCell>
                    <TableCell>{team.wins}</TableCell>
                    <TableCell>{team.draws}</TableCell>
                    <TableCell>{team.losses}</TableCell>
                    <TableCell>{team.goalDifference}</TableCell>
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