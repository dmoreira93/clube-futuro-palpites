import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
    Target, Trophy, AlertTriangle, BookOpen, Crown, 
    LayoutGrid, CircleDollarSign, Ban, Goal, Shuffle, CheckCircle2 
} from "lucide-react";

interface PoolRulesProps {
  pool: any;
  triggerButton?: React.ReactNode;
}

export function PoolRulesDialog({ pool, triggerButton }: PoolRulesProps) {
  // Mapeamento dos valores (com fallback para 0 se nulo)
  const points = {
    // Jogos (Match)
    exact: pool.points_exact_score ?? 10,
    diff: pool.points_winner_diff ?? 7,
    draw: pool.points_match_draw ?? 5,
    winner: pool.points_winner ?? 5,
    partial: pool.points_match_one_score ?? 2,
    wrong: pool.points_wrong ?? 0,
    
    // Grupos (Group)
    g_exact: pool.points_group_winner ?? 10,
    g_invert: pool.points_group_inverted ?? 5,
    g_single: pool.points_group_single ?? 3,

    // Longo Prazo (Tournament)
    final_score: pool.points_final_score ?? 25,
    top4: pool.points_top4_bonus ?? 30,
    champion: pool.points_champion ?? 20,
    runner: pool.points_runner_up ?? 15,
    third: pool.points_third_place ?? 10,
    fourth: pool.points_fourth_place ?? 5,
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" size="sm" className="gap-2">
            <BookOpen className="h-4 w-4" /> Critérios
          </Button>
        )}
      </DialogTrigger>
      
      {/* max-w-3xl deixa o modal mais largo para caber as colunas */}
      <DialogContent className="max-w-3xl w-full max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-gray-50">
        
        {/* HEADER */}
        <div className="bg-fifa-blue p-6 shrink-0">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl text-fifa-gold">
                    <BookOpen className="h-6 w-6" /> Regras e Pontuação
                </DialogTitle>
                <DialogDescription className="text-blue-100">
                    Detalhes completos de como somar pontos e premiações.
                </DialogDescription>
            </DialogHeader>
        </div>

        {/* CONTEÚDO COM SCROLL */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-8 pb-4">
            
            {/* 1. CRITÉRIOS DE JOGO (GRID DE 2 COLUNAS) */}
            <section>
              <h4 className="text-sm font-bold text-gray-900 uppercase mb-3 flex items-center gap-2 border-l-4 border-purple-500 pl-2">
                <Target className="h-5 w-5 text-purple-500" /> Partidas (Dia a Dia)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <RuleItem 
                    label="Cravada (Exato)" 
                    desc="Acertou o placar em cheio" 
                    points={points.exact} 
                    color="purple" 
                    isMain 
                  />
                  <RuleItem 
                    label="Vencedor + Saldo" 
                    desc="Ex: Apostou 2x0, foi 3x1" 
                    points={points.diff} 
                    color="blue" 
                  />
                  <RuleItem 
                    label="Empate Garantido" 
                    desc="Apostou 2x2, foi 0x0" 
                    points={points.draw} 
                    color="gray" 
                  />
                  <RuleItem 
                    label="Vencedor Simples" 
                    desc="Acertou apenas quem ganhou" 
                    points={points.winner} 
                    color="gray" 
                  />
                  <RuleItem 
                    label="Gol Parcial" 
                    desc="Acertou gols de 1 time" 
                    points={points.partial} 
                    color="orange" 
                  />
                  {points.wrong !== 0 && (
                    <RuleItem 
                        label="Erro Total" 
                        desc="Não acertou nada" 
                        points={points.wrong} 
                        color="red" 
                    />
                  )}
              </div>
            </section>

            <Separator />

            {/* 2. GRUPOS E FINAIS (GRID DE 2 COLUNAS) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Coluna Esquerda: Grupos */}
                <section>
                    <h4 className="text-sm font-bold text-gray-900 uppercase mb-3 flex items-center gap-2 border-l-4 border-blue-500 pl-2">
                        <LayoutGrid className="h-5 w-5 text-blue-500" /> Fase de Grupos
                    </h4>
                    <div className="flex flex-col gap-2">
                        <RuleItem label="Ordem Exata (1º e 2º)" points={points.g_exact} color="blue" compact />
                        <RuleItem label="Ordem Invertida" points={points.g_invert} color="gray" compact />
                        <RuleItem label="Apenas 1 Classificado" points={points.g_single} color="gray" compact />
                    </div>
                </section>

                {/* Coluna Direita: Longo Prazo */}
                <section>
                    <h4 className="text-sm font-bold text-gray-900 uppercase mb-3 flex items-center gap-2 border-l-4 border-yellow-500 pl-2">
                        <Crown className="h-5 w-5 text-yellow-500" /> Finais & Bônus
                    </h4>
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <RuleItem label="Placar da Final" points={points.final_score} color="purple" compact />
                            <RuleItem label="Bônus G4 (Top 4)" points={points.top4} color="yellow" compact />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            <MiniBadge label="Campeão" points={points.champion} color="yellow" />
                            <MiniBadge label="Vice" points={points.runner} color="gray" />
                            <MiniBadge label="3º Lugar" points={points.third} color="orange" />
                            <MiniBadge label="4º Lugar" points={points.fourth} color="blue" />
                        </div>
                    </div>
                </section>
            </div>

            <Separator />

            {/* 3. FINANCEIRO E PUNIÇÃO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Financeiro */}
                {pool.entry_fee > 0 ? (
                    <section>
                        <h4 className="text-sm font-bold text-gray-900 uppercase mb-3 flex items-center gap-2 border-l-4 border-green-500 pl-2">
                            <CircleDollarSign className="h-5 w-5 text-green-500" /> Premiação
                        </h4>
                        <div className="bg-white border border-green-100 rounded-lg p-3 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-gray-500 uppercase font-bold">Taxa de Entrada</span>
                                <Badge variant="outline" className="text-green-700 border-green-200">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pool.entry_fee)}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-1 text-center mt-3">
                                <PrizeBox label="1º" percent={pool.prize_percent_1st} color="yellow" />
                                <PrizeBox label="2º" percent={pool.prize_percent_2nd} color="gray" />
                                <PrizeBox label="3º" percent={pool.prize_percent_3rd} color="orange" />
                            </div>
                            {pool.admin_fee_percent > 0 && (
                                <p className="text-[10px] text-gray-400 mt-2 text-center italic">
                                    *Desconto de {pool.admin_fee_percent}% (Taxa Adm)
                                </p>
                            )}
                        </div>
                    </section>
                ) : (
                    <section>
                         <h4 className="text-sm font-bold text-gray-900 uppercase mb-3 flex items-center gap-2 border-l-4 border-gray-300 pl-2">
                            <CircleDollarSign className="h-5 w-5 text-gray-400" /> Premiação
                        </h4>
                        <div className="bg-white border border-gray-200 p-4 rounded-lg text-center text-gray-400 text-sm">
                            Este bolão é gratuito (sem premiação em dinheiro).
                        </div>
                    </section>
                )}

                {/* Punição */}
                {pool.enable_punishment ? (
                    <section>
                        <h4 className="text-sm font-bold text-gray-900 uppercase mb-3 flex items-center gap-2 border-l-4 border-red-500 pl-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" /> Zona de Punição
                        </h4>
                        <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-start gap-3 h-full">
                            <Ban className="h-8 w-8 text-red-500 shrink-0" />
                            <div>
                                <h5 className="font-bold text-red-900 text-sm">Destino do Lanterna</h5>
                                <p className="text-sm text-red-700 mt-1 leading-snug">
                                    "{pool.punishment_description || 'Prenda indefinida'}"
                                </p>
                            </div>
                        </div>
                    </section>
                ) : (
                    <section>
                        <h4 className="text-sm font-bold text-gray-900 uppercase mb-3 flex items-center gap-2 border-l-4 border-gray-300 pl-2">
                            <Ban className="h-5 w-5 text-gray-400" /> Punição
                        </h4>
                        <div className="bg-white border border-gray-200 p-4 rounded-lg text-center text-gray-400 text-sm h-full flex items-center justify-center">
                            Sem punição definida para o lanterna.
                        </div>
                    </section>
                )}
            </div>

          </div>
        </ScrollArea>
        
        {/* FOOTER */}
        <div className="bg-white p-4 border-t border-gray-100 shrink-0 flex justify-end">
            <Button onClick={() => document.getElementById('close-rule-dialog')?.click()} className="min-w-[100px] bg-fifa-blue hover:bg-blue-900">
                Fechar
            </Button>
            {/* Truque para fechar o dialog programaticamente se necessário */}
            <DialogTrigger id="close-rule-dialog" className="hidden" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Componentes Auxiliares de Design ---

const RuleItem = ({ label, desc, points, color, isMain, compact }: any) => {
    const bgMap: any = { purple: "bg-purple-50 border-purple-100", blue: "bg-blue-50 border-blue-100", gray: "bg-white border-gray-100", orange: "bg-orange-50 border-orange-100", red: "bg-red-50 border-red-100", yellow: "bg-yellow-50 border-yellow-100" };
    const badgeMap: any = { purple: "bg-purple-600", blue: "bg-blue-600", gray: "bg-gray-500", orange: "bg-orange-500", red: "bg-red-500", yellow: "bg-yellow-600" };
    
    return (
        <div className={`flex items-center justify-between p-3 rounded-lg border shadow-sm ${bgMap[color] || bgMap.gray} ${compact ? 'py-2' : ''}`}>
            <div className="flex flex-col">
                <span className={`text-gray-800 ${isMain ? 'font-bold text-base' : 'font-medium text-sm'}`}>{label}</span>
                {desc && <span className="text-[10px] text-gray-500">{desc}</span>}
            </div>
            <Badge className={`${badgeMap[color]} hover:${badgeMap[color]} text-white border-none min-w-[50px] justify-center`}>
                {points} pts
            </Badge>
        </div>
    );
};

const MiniBadge = ({ label, points, color }: any) => {
    const colorClass = color === 'yellow' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                       color === 'orange' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                       color === 'blue' ? 'bg-blue-100 text-blue-800 border-blue-200' : 
                       'bg-gray-100 text-gray-700 border-gray-200';
    return (
        <div className={`flex flex-col items-center justify-center p-2 rounded border ${colorClass}`}>
            <span className="text-[10px] font-bold uppercase">{label}</span>
            <span className="text-sm font-black">{points}</span>
        </div>
    )
}

const PrizeBox = ({ label, percent, color }: any) => {
    const bg = color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : color === 'orange' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700';
    return (
        <div className={`flex flex-col p-2 rounded ${bg}`}>
            <span className="text-xs font-bold">{label}</span>
            <span className="text-lg font-black">{percent}%</span>
        </div>
    )
}