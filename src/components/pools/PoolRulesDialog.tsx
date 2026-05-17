import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { 
    Target, Trophy, AlertTriangle, BookOpen, Crown, 
    LayoutGrid, CircleDollarSign, Ban, Goal, Shuffle, Equal, X, Loader2
} from "lucide-react";

interface PoolRulesProps {
  pool: any;
  triggerButton?: React.ReactNode;
}

export function PoolRulesDialog({ pool, triggerButton }: PoolRulesProps) {
  const [criteria, setCriteria] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Carrega as regras reais da tabela scoring_criteria dinamicamente
  useEffect(() => {
    if (pool?.id) {
      const fetchPoolCriteria = async () => {
        setLoading(true);
        const { data } = await supabase
          .from("scoring_criteria")
          .select("*")
          .eq("pool_id", pool.id);
        setCriteria(data || []);
        setLoading(false);
      };
      fetchPoolCriteria();
    }
  }, [pool?.id]);

  // Função auxiliar para buscar os pontos de um tipo específico no array do banco
  const getPoints = (typeKey: string, fallback: number) => {
    const item = criteria.find(c => c.type === typeKey);
    return item ? item.points : fallback;
  };

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
      
      <DialogContent className="max-w-3xl w-full h-[85vh] md:h-auto md:max-h-[90vh] flex flex-col p-0 gap-0 bg-gray-50 overflow-hidden border-none shadow-2xl">
        
        {/* CABEÇALHO */}
        <div className="bg-fifa-blue p-6 shrink-0 flex justify-between items-start">
            <div className="space-y-1">
                <DialogTitle className="flex items-center gap-2 text-xl text-fifa-gold">
                    <BookOpen className="h-6 w-6" /> Regras e Pontuação Oficial
                </DialogTitle>
                <DialogDescription className="text-blue-100">
                    Estes são os critérios ativos definidos no painel administrativo.
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

        {/* CORPO COM SCROLL */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12 gap-2 text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin text-fifa-blue" />
              <p className="text-sm">Buscando tabela de pontos...</p>
            </div>
          ) : (
            <div className="space-y-8 pb-8"> 
              
              {/* 1. JOGOS (MATCH) */}
              <section>
                <h4 className="text-sm font-bold text-gray-900 uppercase mb-3 flex items-center gap-2 border-l-4 border-purple-500 pl-2">
                  <Target className="h-5 w-5 text-purple-500" /> Partidas (Dia a Dia)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <RuleItem 
                      label="Placar Exato (Cravada)" 
                      desc="Acertou o placar cheio (Ex: 2x1)" 
                      points={getPoints('MATCH_EXACT', 10)} 
                      color="purple" 
                      isMain 
                    />
                    <RuleItem 
                      label="Vencedor + Saldo" 
                      desc="Acertou o vencedor e a diferença exata de gols" 
                      points={getPoints('MATCH_WINNER_SALDO', 5)} 
                      color="blue" 
                    />
                    <RuleItem 
                      label="Empate Garantido" 
                      desc="Apostou empate, mas errou a quantidade de gols" 
                      points={getPoints('MATCH_DRAW', 5)} 
                      color="gray" 
                      icon={<Equal className="h-3 w-3 mr-1"/>}
                    />
                    <RuleItem 
                      label="Vencedor Simples" 
                      desc="Acertou apenas quem ganhou o confronto" 
                      points={getPoints('MATCH_WINNER', 5)} 
                      color="gray" 
                    />
                    <RuleItem 
                      label="Gol Parcial" 
                      desc="Acertou os gols de apenas um dos times" 
                      points={getPoints('MATCH_PARTIAL', 2)} 
                      color="orange" 
                      icon={<Goal className="h-3 w-3 mr-1"/>}
                    />
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
                          <RuleItem label="Ordem Exata (1º e 2º)" points={getPoints('GROUP_EXACT', 10)} color="blue" compact />
                          <RuleItem label="Ordem Invertida" desc="Acertou os 2 classificados mas inverteu as posições" points={getPoints('GROUP_INVERTED', 5)} color="gray" compact icon={<Shuffle className="h-3 w-3 mr-1"/>} />
                          <RuleItem label="Apenas 1 Classificado" points={getPoints('GROUP_SINGLE', 3)} color="gray" compact />
                      </div>
                  </section>

                  {/* Longo Prazo */}
                  <section>
                      <h4 className="text-sm font-bold text-gray-900 uppercase mb-3 flex items-center gap-2 border-l-4 border-yellow-500 pl-2">
                          <Crown className="h-5 w-5 text-yellow-500" /> Finais & Bônus
                      </h4>
                      <div className="space-y-3">
                          <div className="flex gap-2">
                              <RuleItem label="Placar da Final" points={getPoints('TOURNAMENT_FINAL_SCORE', 20)} color="purple" compact />
                              <RuleItem label="Bônus G4 (Top 4 Perfeito)" points={getPoints('TOURNAMENT_TOP4_BONUS', 35)} color="yellow" compact />
                          </div>
                          <div className="bg-white border border-gray-200 rounded-lg p-3 grid grid-cols-2 gap-2 text-center shadow-sm">
                              <MiniBadge label="Campeão" points={getPoints('TOURNAMENT_CHAMPION', 20)} color="yellow" />
                              <MiniBadge label="Vice" points={getPoints('TOURNAMENT_RUNNERUP', 15)} color="gray" />
                              <MiniBadge label="3º Lugar" points={getPoints('TOURNAMENT_3RD', 10)} color="orange" />
                              <MiniBadge label="4º Lugar" points={getPoints('TOURNAMENT_4TH', 5)} color="blue" />
                          </div>
                      </div>
                  </section>
              </div>

              <Separator className="bg-gray-200"/>

              {/* 3. FINANCEIRO E PUNIÇÃO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          </div>
                      ) : (
                          <div className="bg-white border border-gray-200 p-4 rounded-lg text-center text-gray-400 text-sm h-full flex items-center justify-center italic">
                              Bolão gratuito (sem premiação).
                          </div>
                      )}
                  </section>

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
          )}
        </div>
        <DialogTrigger id="close-rule-dialog" className="hidden" />
      </DialogContent>
    </Dialog>
  );
}

// Subcomponentes auxiliares mantidos...
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
    const colorClass = color === 'yellow' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : color === 'orange' ? 'bg-orange-100 text-orange-800 border-orange-200' : color === 'blue' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200';
    return (
        <div className={`flex flex-col items-center justify-center p-2 rounded border ${colorClass}`}>
            <span className="text-[10px] font-bold uppercase">{label}</span>
            <span className="text-sm font-black">{points}</span>
        </div>
    )
};
const PrizeBox = ({ label, percent, color }: any) => {
    const bg = color === 'yellow' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : color === 'orange' ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-gray-50 border-gray-200 text-gray-700';
    return (
        <div className={`flex flex-col p-2 rounded border ${bg}`}>
            <span className="text-xs font-bold">{label}</span>
            <span className="text-lg font-black">{percent}%</span>
        </div>
    )
};