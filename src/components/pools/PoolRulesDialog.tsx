import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
    Target, Trophy, AlertTriangle, BookOpen, Crown, 
    LayoutGrid, CircleDollarSign, Ban, Goal, Shuffle, Equal, X
} from "lucide-react";

interface PoolRulesProps {
  pool: any;
  triggerButton?: React.ReactNode;
}

export function PoolRulesDialog({ pool, triggerButton }: PoolRulesProps) {
  // Mapeamento de Pontos (Fallback para 0/padrão se nulo)
  const points = {
    // JOGOS
    exact: pool.points_exact_score ?? 10,
    diff: pool.points_winner_diff ?? 7,
    draw: pool.points_match_draw ?? 5,
    winner: pool.points_winner ?? 5,
    partial: pool.points_match_one_score ?? 2,
    wrong: pool.points_wrong ?? 0,
    
    // GRUPOS
    g_exact: pool.points_group_winner ?? 10,
    g_invert: pool.points_group_inverted ?? 5,
    g_single: pool.points_group_single ?? 3,

    // LONGO PRAZO
    final_score: pool.points_final_score ?? 25,
    top4: pool.points_top4_bonus ?? 30,
    champion: pool.points_champion ?? 20,
    runner: pool.points_runner_up ?? 15,
    third: pool.points_third_place ?? 10,
    fourth: pool.points_fourth_place ?? 5,
  };

  // Função para fechar o modal via ID (truque para manter componente stateless)
  const closeDialog = () => document.getElementById('close-rule-dialog')?.click();

  return (
    <Dialog>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" size="sm" className="gap-2">
            <BookOpen className="h-4 w-4" /> Critérios
          </Button>
        )}
      </DialogTrigger>
      
      {/* Container Principal: Altura fixa alta e Flexbox */}
      <DialogContent className="max-w-3xl w-full h-[85vh] md:h-auto md:max-h-[90vh] flex flex-col p-0 gap-0 bg-gray-50 overflow-hidden border-none shadow-2xl">
        
        {/* CABEÇALHO (Com botão de fechar X) */}
        <div className="bg-fifa-blue p-6 shrink-0 flex justify-between items-start">
            <div className="space-y-1">
                <DialogTitle className="flex items-center gap-2 text-xl text-fifa-gold">
                    <BookOpen className="h-6 w-6" /> Regras e Pontuação
                </DialogTitle>
                <DialogDescription className="text-blue-100">
                    Confira todos os critérios para somar pontos neste bolão.
                </DialogDescription>
            </div>
            <Button 
                variant="ghost" 
                size="icon" 
                className="text-white/70 hover:text-white hover:bg-white/10 -mt-2 -mr-2"
                onClick={closeDialog}
            >
                <X className="h-6 w-6" />
            </Button>
        </div>

        {/* CORPO COM SCROLL (Ocupa o resto do espaço) */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="space-y-8 pb-8"> 
            
            {/* 1. JOGOS (MATCH) */}
            <section>
              <h4 className="text-sm font-bold text-gray-900 uppercase mb-3 flex items-center gap-2 border-l-4 border-purple-500 pl-2">
                <Target className="h-5 w-5 text-purple-500" /> Partidas (Dia a Dia)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <RuleItem 
                    label="Cravada (Exato)" 
                    desc="Acertou o placar cheio (Ex: 2x1)" 
                    points={points.exact} 
                    color="purple" 
                    isMain 
                  />
                  <RuleItem 
                    label="Vencedor + Saldo" 
                    desc="Acertou vencedor e diferença de gols" 
                    points={points.diff} 
                    color="blue" 
                  />
                  <RuleItem 
                    label="Empate Garantido" 
                    desc="Apostou empate (2x2), foi (0x0)" 
                    points={points.draw} 
                    color="gray" 
                    icon={<Equal className="h-3 w-3 mr-1"/>}
                  />
                  <RuleItem 
                    label="Vencedor Simples" 
                    desc="Acertou apenas quem ganhou" 
                    points={points.winner} 
                    color="gray" 
                  />
                  <RuleItem 
                    label="Gol Parcial (1 Time)" 
                    desc="Acertou gols de apenas um time" 
                    points={points.partial} 
                    color="orange" 
                    icon={<Goal className="h-3 w-3 mr-1"/>}
                  />
                  {points.wrong !== 0 && (
                    <RuleItem label="Erro Total" desc="Errou tudo" points={points.wrong} color="red" />
                  )}
              </div>
            </section>

            <Separator className="bg-gray-200"/>

            {/* 2. GRUPOS E FINAIS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Grupos */}
                <section>
                    <h4 className="text-sm font-bold text-gray-900 uppercase mb-3 flex items-center gap-2 border-l-4 border-blue-500 pl-2">
                        <LayoutGrid className="h-5 w-5 text-blue-500" /> Classificação Grupos
                    </h4>
                    <div className="flex flex-col gap-2">
                        <RuleItem label="Ordem Exata (1º e 2º)" points={points.g_exact} color="blue" compact />
                        <RuleItem label="Ordem Invertida" desc="Acertou os 2 classificados mas trocou" points={points.g_invert} color="gray" compact icon={<Shuffle className="h-3 w-3 mr-1"/>} />
                        <RuleItem label="Apenas 1 Classificado" points={points.g_single} color="gray" compact />
                    </div>
                </section>

                {/* Longo Prazo */}
                <section>
                    <h4 className="text-sm font-bold text-gray-900 uppercase mb-3 flex items-center gap-2 border-l-4 border-yellow-500 pl-2">
                        <Crown className="h-5 w-5 text-yellow-500" /> Finais & Bônus
                    </h4>
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <RuleItem label="Placar da Final" points={points.final_score} color="purple" compact />
                            <RuleItem label="Bônus G4 (Top 4)" points={points.top4} color="yellow" compact />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-3 grid grid-cols-2 gap-2 text-center shadow-sm">
                            <MiniBadge label="Campeão" points={points.champion} color="yellow" />
                            <MiniBadge label="Vice" points={points.runner} color="gray" />
                            <MiniBadge label="3º Lugar" points={points.third} color="orange" />
                            <MiniBadge label="4º Lugar" points={points.fourth} color="blue" />
                        </div>
                    </div>
                </section>
            </div>

            <Separator className="bg-gray-200"/>

            {/* 3. FINANCEIRO E PUNIÇÃO (Agora visíveis!) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Financeiro */}
                <section>
                    <h4 className="text-sm font-bold text-gray-900 uppercase mb-3 flex items-center gap-2 border-l-4 border-green-500 pl-2">
                        <CircleDollarSign className="h-5 w-5 text-green-500" /> Premiação
                    </h4>
                    {pool.entry_fee > 0 ? (
                        <div className="bg-white border border-green-100 rounded-lg p-4 shadow-sm h-full">
                            <div className="flex justify-between items-center mb-3 border-b border-green-50 pb-2">
                                <span className="text-xs text-gray-500 uppercase font-bold">Valor da Entrada</span>
                                <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50 text-base font-bold px-3">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pool.entry_fee)}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <PrizeBox label="1º Lugar" percent={pool.prize_percent_1st} color="yellow" />
                                <PrizeBox label="2º Lugar" percent={pool.prize_percent_2nd} color="gray" />
                                <PrizeBox label="3º Lugar" percent={pool.prize_percent_3rd} color="orange" />
                            </div>
                            {pool.admin_fee_percent > 0 && (
                                <p className="text-[10px] text-gray-400 mt-3 text-center italic">
                                    *Descontada taxa de administração de {pool.admin_fee_percent}%
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-200 p-4 rounded-lg text-center text-gray-400 text-sm h-full flex items-center justify-center italic">
                            Bolão gratuito (sem premiação).
                        </div>
                    )}
                </section>

                {/* Punição */}
                <section>
                    <h4 className="text-sm font-bold text-gray-900 uppercase mb-3 flex items-center gap-2 border-l-4 border-red-500 pl-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" /> Zona de Punição
                    </h4>
                    {pool.enable_punishment ? (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex flex-col gap-2 h-full shadow-sm">
                            <div className="flex items-center gap-2 text-red-800 font-bold">
                                <Ban className="h-5 w-5"/> Destino do Lanterna
                            </div>
                            <div className="bg-white/60 p-3 rounded border border-red-100">
                                <p className="text-sm text-red-700 italic leading-relaxed">
                                    "{pool.punishment_description || 'Prenda indefinida'}"
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-200 p-4 rounded-lg text-center text-gray-400 text-sm h-full flex items-center justify-center italic">
                            Sem punição definida.
                        </div>
                    )}
                </section>
            </div>

          </div>
        </div>
        
        {/* Trigger Invisível para manter a lógica de abrir/fechar do botão X */}
        <DialogTrigger id="close-rule-dialog" className="hidden" />
      </DialogContent>
    </Dialog>
  );
}

// --- SUB-COMPONENTES (Design System) ---

const RuleItem = ({ label, desc, points, color, isMain, compact, icon }: any) => {
    const bgMap: any = { purple: "bg-purple-50 border-purple-100", blue: "bg-blue-50 border-blue-100", gray: "bg-white border-gray-200", orange: "bg-orange-50 border-orange-100", red: "bg-red-50 border-red-100", yellow: "bg-yellow-50 border-yellow-100" };
    const badgeMap: any = { purple: "bg-purple-600", blue: "bg-blue-600", gray: "bg-gray-500", orange: "bg-orange-500", red: "bg-red-500", yellow: "bg-yellow-600" };
    
    return (
        <div className={`flex items-center justify-between p-3 rounded-lg border shadow-sm transition-all hover:shadow-md ${bgMap[color]} ${compact ? 'py-2' : ''}`}>
            <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                    {icon}
                    <span className={`text-gray-800 ${isMain ? 'font-bold text-base' : 'font-medium text-sm'}`}>{label}</span>
                </div>
                {desc && <span className="text-[10px] text-gray-500 mt-0.5 ml-0.5">{desc}</span>}
            </div>
            <Badge className={`${badgeMap[color]} hover:${badgeMap[color]} text-white border-none min-w-[50px] justify-center shadow-sm`}>
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
    const bg = color === 'yellow' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : color === 'orange' ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-gray-50 border-gray-200 text-gray-700';
    return (
        <div className={`flex flex-col p-2 rounded border ${bg}`}>
            <span className="text-xs font-bold">{label}</span>
            <span className="text-lg font-black">{percent}%</span>
        </div>
    )
}