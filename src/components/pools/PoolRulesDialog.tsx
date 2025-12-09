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
import { Badge } from "@/components/ui/badge";
import { Target, Trophy, AlertTriangle, BookOpen, Crown, LayoutGrid, CircleDollarSign, Ban, Goal, Shuffle } from "lucide-react";

interface PoolRulesProps {
  pool: any;
  triggerButton?: React.ReactNode;
}

export function PoolRulesDialog({ pool, triggerButton }: PoolRulesProps) {
  // Valores padrão de segurança (Fallback)
  const points = {
    // Jogos
    exact: pool.points_exact_score ?? 10,
    diff: pool.points_winner_diff ?? 7,
    winner: pool.points_winner ?? 5,
    draw: pool.points_match_draw ?? 5,
    partial: pool.points_match_one_score ?? 2,
    wrong: pool.points_wrong ?? 0,
    
    // Grupos
    g_exact: pool.points_group_winner ?? 10,
    g_invert: pool.points_group_inverted ?? 5,
    g_single: pool.points_group_single ?? 3,

    // Finais
    champion: pool.points_champion ?? 20,
    runner: pool.points_runner_up ?? 15,
    third: pool.points_third_place ?? 10,
    fourth: pool.points_fourth_place ?? 5,
    final_score: pool.points_final_score ?? 25,
    top4_bonus: pool.points_top4_bonus ?? 30,
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" size="sm" className="gap-2"><BookOpen className="h-4 w-4" /> Critérios</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-white p-0 overflow-hidden gap-0 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-fifa-blue p-6 text-white shrink-0">
            <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-fifa-gold">
                <BookOpen className="h-6 w-6" /> Regras do Bolão
            </DialogTitle>
            <DialogDescription className="text-blue-100">
                Detalhamento da pontuação e premiação.
            </DialogDescription>
            </DialogHeader>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-8">
            
            {/* 1. JOGOS (DIA A DIA) */}
            <section>
              <h4 className="text-sm font-bold text-gray-900 uppercase mb-3 flex items-center gap-2 border-l-4 border-purple-500 pl-2">
                <Target className="h-5 w-5 text-purple-500" /> Partidas (Dia a Dia)
              </h4>
              <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm text-sm">
                  {/* Cravada */}
                  <div className="flex justify-between p-3 bg-purple-50 border-b border-purple-100">
                      <div><span className="font-bold text-purple-900">Cravada (Exato)</span><p className="text-[10px] text-purple-600">Acertou placar cheio</p></div>
                      <Badge className="bg-purple-600 h-6">{points.exact} pts</Badge>
                  </div>
                  
                  {/* Vencedor + Saldo */}
                  <div className="flex justify-between p-3 bg-white border-b border-gray-100">
                      <div><span className="font-medium">Vencedor + Saldo</span><p className="text-[10px] text-gray-500">Ex: 2x0 e foi 3x1</p></div>
                      <Badge variant="secondary" className="h-6">{points.diff} pts</Badge>
                  </div>

                  {/* Empate (Não Exato) */}
                  <div className="flex justify-between p-3 bg-gray-50 border-b border-gray-100">
                      <div><span className="font-medium">Empate Garantido</span><p className="text-[10px] text-gray-500">Acertou empate, errou placar</p></div>
                      <Badge variant="secondary" className="h-6">{points.draw} pts</Badge>
                  </div>

                  {/* Vencedor Simples */}
                  <div className="flex justify-between p-3 bg-white border-b border-gray-100">
                      <div><span className="font-medium">Vencedor Simples</span><p className="text-[10px] text-gray-500">Acertou quem ganhou</p></div>
                      <Badge variant="secondary" className="h-6">{points.winner} pts</Badge>
                  </div>

                  {/* Gol Parcial */}
                  <div className="flex justify-between p-3 bg-gray-50 border-b border-gray-100">
                      <div className="flex items-center gap-2"><Goal className="h-3 w-3 text-gray-400"/><span className="font-medium text-gray-600">Gol Parcial (1 Time)</span></div>
                      <Badge variant="outline" className="h-6">{points.partial} pts</Badge>
                  </div>

                  {/* Erro */}
                  <div className="flex justify-between p-3 bg-white">
                      <span className="text-red-400">Erro Total</span>
                      <Badge variant="outline" className="text-gray-400 border-gray-200">{points.wrong} pts</Badge>
                  </div>
              </div>
            </section>

            {/* 2. GRUPOS */}
            <section>
                <h4 className="text-sm font-bold text-gray-900 uppercase mb-3 flex items-center gap-2 border-l-4 border-blue-500 pl-2">
                <LayoutGrid className="h-5 w-5 text-blue-500" /> Classificação de Grupos
                </h4>
                <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm text-sm">
                    <div className="flex justify-between p-3 bg-blue-50 border-b border-blue-100">
                        <span className="font-bold text-blue-900">Ordem Exata (1º e 2º)</span>
                        <Badge className="bg-blue-600 h-6">{points.g_exact} pts</Badge>
                    </div>
                    <div className="flex justify-between p-3 bg-white border-b border-gray-100">
                        <div className="flex items-center gap-2"><Shuffle className="h-3 w-3 text-orange-400"/><span>Ordem Invertida</span></div>
                        <Badge variant="secondary" className="h-6">{points.g_invert} pts</Badge>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50">
                        <span>Apenas 1 Classificado</span>
                        <Badge variant="secondary" className="h-6">{points.g_single} pts</Badge>
                    </div>
                </div>
            </section>

            {/* 3. LONGO PRAZO */}
            <section>
              <h4 className="text-sm font-bold text-gray-900 uppercase mb-3 flex items-center gap-2 border-l-4 border-yellow-500 pl-2">
                <Crown className="h-5 w-5 text-yellow-500" /> Finais & Bônus
              </h4>
              
              <div className="mb-3 bg-gradient-to-r from-yellow-50 to-white border border-yellow-200 p-3 rounded-lg flex justify-between items-center">
                  <div className="flex flex-col">
                      <span className="text-xs font-bold text-yellow-800 uppercase">Campeão</span>
                      <span className="text-sm text-yellow-600">Acertar o vencedor da taça</span>
                  </div>
                  <span className="text-2xl font-black text-yellow-500">{points.champion} <span className="text-xs font-normal text-gray-400">pts</span></span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-center">
                      <span className="block text-xs font-bold text-gray-500 uppercase">Vice</span>
                      <span className="text-lg font-bold text-gray-700">{points.runner} pts</span>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg text-center">
                      <span className="block text-xs font-bold text-purple-500 uppercase">Placar da Final</span>
                      <span className="text-lg font-bold text-purple-700">{points.final_score} pts</span>
                  </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                      <span className="text-blue-800">Acertar 3º Lugar</span>
                      <strong className="text-blue-900">{points.third} pts</strong>
                  </div>
                  <div className="w-full border-t border-blue-200"></div>
                  <div className="flex justify-between text-sm">
                      <span className="text-blue-800">Acertar 4º Lugar</span>
                      <strong className="text-blue-900">{points.fourth} pts</strong>
                  </div>
                  <div className="w-full border-t border-blue-200"></div>
                  <div className="flex justify-between text-sm items-center">
                      <span className="text-blue-800 font-bold flex items-center gap-1"><Crown className="h-3 w-3"/> Bônus Top 4 (G4)</span>
                      <Badge className="bg-blue-600">{points.top4_bonus} pts</Badge>
                  </div>
              </div>
            </section>

            {/* 4. PREMIAÇÃO E PUNIÇÃO */}
            {pool.entry_fee > 0 && (
                <section>
                    <h4 className="text-sm font-bold text-gray-900 uppercase mb-3 flex items-center gap-2 border-l-4 border-green-500 pl-2">
                        <CircleDollarSign className="h-5 w-5 text-green-500" /> Finanças
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-green-50 p-2 rounded border border-green-200">
                            <span className="block font-bold text-green-700">1º</span> {pool.prize_percent_1st}%
                        </div>
                        <div className="bg-gray-50 p-2 rounded border border-gray-200">
                            <span className="block font-bold text-gray-700">2º</span> {pool.prize_percent_2nd}%
                        </div>
                        <div className="bg-orange-50 p-2 rounded border border-orange-200">
                            <span className="block font-bold text-orange-700">3º</span> {pool.prize_percent_3rd}%
                        </div>
                    </div>
                    {pool.admin_fee_percent > 0 && (
                        <p className="text-[10px] text-gray-400 mt-2 text-center">*Taxa Adm: {pool.admin_fee_percent}%</p>
                    )}
                </section>
            )}

            {pool.enable_punishment && (
              <section>
                <h4 className="text-sm font-bold text-gray-900 uppercase mb-3 flex items-center gap-2 border-l-4 border-red-500 pl-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" /> Punição
                </h4>
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-800 flex gap-3 items-start">
                    <Ban className="h-5 w-5 mt-0.5 shrink-0"/>
                    <span>Lanterna: <strong>{pool.punishment_description}</strong></span>
                </div>
              </section>
            )}

          </div>
        </ScrollArea>
        
        <div className="bg-gray-50 p-4 border-t border-gray-100 shrink-0">
            <Button variant="outline" onClick={() => document.getElementById('close-dialog')?.click()} className="w-full">
                Fechar
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}