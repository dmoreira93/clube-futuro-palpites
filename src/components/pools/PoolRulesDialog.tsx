import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Target, Trophy, AlertTriangle, BookOpen } from "lucide-react";

interface PoolRulesProps {
  pool: any;
  triggerButton?: React.ReactNode;
}

export function PoolRulesDialog({ pool, triggerButton }: PoolRulesProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" size="sm" className="gap-2">
            <BookOpen className="h-4 w-4" /> Ver Critérios
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-fifa-blue">
            <BookOpen className="h-5 w-5 text-fifa-gold" /> Regras do Bolão
          </DialogTitle>
          <DialogDescription>
            Confira como pontuar e as regras deste campeonato.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            
            {/* Pontuação */}
            <div>
              <h4 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" /> Sistema de Pontos
              </h4>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Cravada (Placar Exato)</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">{pool.points_exact_score ?? 10} pts</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Vencedor + Saldo</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">{pool.points_winner_diff ?? 7} pts</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Apenas Vencedor</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-200">{pool.points_winner ?? 5} pts</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Erro Total</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{pool.points_wrong ?? 0} pts</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Punição */}
            {pool.enable_punishment && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <h4 className="text-sm font-bold text-red-800 uppercase mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Zona de Punição
                </h4>
                <p className="text-sm text-red-700">
                  O último colocado deverá: <strong>{pool.punishment_description}</strong>
                </p>
              </div>
            )}

            {/* Financeiro / Premiação */}
            {pool.entry_fee > 0 && (
                <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                        <Trophy className="h-4 w-4" /> Distribuição de Prêmios
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                            <span className="block font-bold text-yellow-700">1º Lugar</span>
                            {pool.prize_percent_1st}%
                        </div>
                        <div className="bg-gray-50 p-2 rounded border border-gray-200">
                            <span className="block font-bold text-gray-700">2º Lugar</span>
                            {pool.prize_percent_2nd}%
                        </div>
                        <div className="bg-orange-50 p-2 rounded border border-orange-200">
                            <span className="block font-bold text-orange-700">3º Lugar</span>
                            {pool.prize_percent_3rd}%
                        </div>
                    </div>
                    {pool.admin_fee_percent > 0 && (
                        <p className="text-[10px] text-gray-400 mt-2 text-center">
                            *Descontada taxa administrativa de {pool.admin_fee_percent}% do valor total.
                        </p>
                    )}
                </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}