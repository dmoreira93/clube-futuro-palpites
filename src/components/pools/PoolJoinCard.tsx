import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PoolRulesDialog } from "./PoolRulesDialog";
import { Users, Trophy, Calendar, Lock, Globe, DollarSign, ArrowRight, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PoolJoinCardProps {
  pool: any;
  onJoin: (poolId: string) => void;
  loading?: boolean;
}

export function PoolJoinCard({ pool, onJoin, loading }: PoolJoinCardProps) {
  // Cálculos Financeiros Estimados
  const totalParticipants = pool.participants_count || 0; // Você precisa garantir que sua query traga o count
  const grossPot = totalParticipants * pool.entry_fee;
  const adminFee = grossPot * (pool.admin_fee_percent / 100);
  const netPot = grossPot - adminFee;

  const prize1st = netPot * (pool.prize_percent_1st / 100);
  
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl border-t-4 border-t-fifa-blue overflow-hidden">
      <div className="bg-gray-50/50 p-6 border-b border-gray-100">
        <div className="flex justify-between items-start mb-4">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Badge variant={pool.is_public ? "default" : "secondary"} className={pool.is_public ? "bg-green-600" : "bg-gray-600"}>
                        {pool.is_public ? <Globe className="w-3 h-3 mr-1"/> : <Lock className="w-3 h-3 mr-1"/>}
                        {pool.is_public ? "Público" : "Privado"}
                    </Badge>
                    <Badge variant="outline" className="text-fifa-blue border-fifa-blue">{pool.championship_name || "Campeonato"}</Badge>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">{pool.name}</CardTitle>
                <CardDescription className="line-clamp-2 mt-1">
                    {pool.description || "Sem descrição definida."}
                </CardDescription>
            </div>
            <div className="text-center bg-white p-3 rounded-lg border shadow-sm">
                <span className="block text-xs text-gray-400 uppercase font-bold">Entrada</span>
                <span className={`block text-xl font-black ${pool.entry_fee > 0 ? 'text-green-600' : 'text-blue-600'}`}>
                    {pool.entry_fee > 0 ? formatCurrency(pool.entry_fee) : 'Grátis'}
                </span>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mt-4">
            <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4 text-gray-400"/>
                <span><strong>{totalParticipants}</strong> Participantes</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400"/>
                <span>Fecha: <strong>{pool.prediction_deadline ? format(new Date(pool.prediction_deadline), 'dd/MM', {locale: ptBR}) : 'Início Jogos'}</strong></span>
            </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        
        {/* ESTIMATIVA DE PRÊMIOS (Só aparece se for pago) */}
        {pool.entry_fee > 0 && (
            <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Trophy className="w-3 h-3"/> Premiação Estimada (Atual)
                </h4>
                <div className="bg-gradient-to-r from-yellow-50 to-white border border-yellow-100 rounded-lg p-4">
                    <div className="flex justify-between items-end">
                        <div>
                            <span className="text-xs text-yellow-700 font-bold block mb-1">1º Lugar ({pool.prize_percent_1st}%)</span>
                            <span className="text-2xl font-bold text-yellow-600">{formatCurrency(prize1st)}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-gray-400 block">Pote Líquido Total</span>
                            <span className="text-sm font-medium text-gray-600">{formatCurrency(netPot)}</span>
                        </div>
                    </div>
                    {pool.admin_fee_percent > 0 && (
                        <p className="text-[10px] text-gray-400 mt-2 italic border-t border-yellow-100 pt-2">
                            *O administrador retém {pool.admin_fee_percent}% do valor total arrecadado.
                        </p>
                    )}
                </div>
            </div>
        )}

        {/* PUNIÇÃO EM DESTAQUE */}
        {pool.enable_punishment && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-3">
                <div className="bg-white p-2 rounded-full shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-red-900">Risco de Lanterna</h4>
                    <p className="text-xs text-red-700 mt-1">
                        O último colocado terá que: <strong>{pool.punishment_description}</strong>
                    </p>
                </div>
            </div>
        )}

      </CardContent>

      <CardFooter className="bg-gray-50 p-4 flex gap-3">
        {/* Botão para ver regras detalhadas */}
        <PoolRulesDialog 
            pool={pool} 
            triggerButton={
                <Button variant="ghost" className="flex-1">
                    Ver Regras
                </Button>
            }
        />
        
        <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold shadow-sm" onClick={() => onJoin(pool.id)} disabled={loading}>
            {loading ? "Entrando..." : (
                <>Entrar no Bolão <ArrowRight className="ml-2 h-4 w-4"/></>
            )}
        </Button>
      </CardFooter>
    </Card>
  );
}