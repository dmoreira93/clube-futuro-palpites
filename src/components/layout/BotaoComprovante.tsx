import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BotaoComprovante() {
  const [loading, setLoading] = useState(true);
  const [podeEmitir, setPodeEmitir] = useState(false);
  
  const { poolId: paramPoolId } = useParams<{ poolId: string }>();
  const location = useLocation();

  // Captura o ID do bolão de forma resiliente na URL para passar para a validação
  const poolId = paramPoolId || location.pathname.split('/')[2];

  useEffect(() => {
    async function validarStatus() {
      // Se não houver ID do bolão na URL (ex: na Home ou no Dashboard Geral),
      // o botão apenas fica desabilitado por padrão sem estourar o banco
      if (!poolId) {
        setPodeEmitir(false);
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase.rpc('check_comprovante_status');
        if (!error && data && data.length > 0) {
          setPodeEmitir(data[0].pode_emitir || false);
        }
      } catch (err) {
        console.error("Erro ao validar status do comprovante:", err);
      } finally {
        setLoading(false);
      }
    }
    validarStatus();
  }, [poolId]);

  if (loading) {
    return (
      <Button variant="ghost" disabled className="h-9 min-w-[130px] text-white/50 text-xs gap-1">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Validando...</span>
      </Button>
    );
  }

  const emitirComprovante = () => {
    if (!podeEmitir) return;
    const printWindow = window.open(`/comprovante/imprimir`, '_blank');
    if (printWindow) {
      printWindow.focus();
    }
  };

  return (
    <Button
      disabled={!podeEmitir}
      onClick={emitirComprovante}
      type="button"
      className={`h-9 px-3 text-xs font-bold gap-1.5 transition-all uppercase tracking-wider min-w-[130px] inline-flex items-center justify-center rounded-md border
        ${podeEmitir 
          ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-500 text-white shadow-md cursor-pointer animate-pulse hover:animate-none' 
          : 'bg-slate-800/90 border-slate-700 text-slate-400 cursor-not-allowed opacity-80'
        }`}
      title={podeEmitir 
        ? "Gerar Comprovante Oficial de Palpites" 
        : poolId 
          ? "Ainda faltam palpites! Preencha a classificação e o mata-mata para liberar o comprovante."
          : "Entre em um bolão ativo para visualizar os seus palpites."
      }
    >
      {podeEmitir ? <FileText className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5 text-slate-500" />}
      <span>Comprovante</span>
    </Button>
  );
}