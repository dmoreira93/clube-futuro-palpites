import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BotaoComprovante() {
  const [loading, setLoading] = useState(true);
  const [podeEmitir, setPodeEmitir] = useState(false);
  const { poolId } = useParams<{ poolId: string }>();

  useEffect(() => {
    async function validarStatus() {
      if (!poolId) {
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase.rpc('check_comprovante_status');
        if (!error && data && data.length > 0) {
          setPodeEmitir(data[0].pode_emitir);
        }
      } catch (err) {
        console.error("Erro ao validar status do comprovante:", err);
      } finally {
        setLoading(false);
      }
    }
    validarStatus();
  }, [poolId]);

  // Se não estiver dentro do contexto de um bolão específico, não renderiza o botão
  if (!poolId) return null;

  if (loading) {
    return (
      <Button variant="ghost" disabled className="h-9 text-white/60 text-xs gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Validando...</span>
      </Button>
    );
  }

  const emitirComprovante = () => {
    const printWindow = window.open('/comprovante/imprimir', '_blank');
    if (printWindow) {
      printWindow.focus();
    }
  };

  return (
    <Button
      disabled={!podeEmitir}
      onClick={emitirComprovante}
      className={`h-9 text-xs font-bold gap-1.5 transition-all uppercase tracking-wider
        ${podeEmitir 
          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md animate-pulse hover:animate-none' 
          : 'bg-transparent border border-gray-700 text-gray-500 cursor-not-allowed opacity-40'
        }`}
      title={podeEmitir ? "Gerar Comprovante de Palpites" : "Preencha todos os palpites para desbloquear"}
    >
      <FileText className="h-4 w-4" />
      <span>Comprovante</span>
    </Button>
  );
}