import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Importado para substituir o window.open
import { supabase } from '@/integrations/supabase/client';
import { FileText, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BotaoComprovanteProps {
  poolId: string;
}

export function BotaoComprovante({ poolId }: BotaoComprovanteProps) {
  const navigate = useNavigate(); // Inicializado o hook de navegação segura do React Router
  const [loading, setLoading] = useState(true);
  const [podeEmitir, setPodeEmitir] = useState(false);

  useEffect(() => {
    async function validarStatus() {
      if (!poolId) {
        setLoading(false);
        return;
      }
      
      try {
        // Envia o ID do bolão atual para o banco calcular as metas dinamicamente
        const { data, error } = await supabase.rpc('check_comprovante_status', { 
          p_pool_id: poolId 
        });
        
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
      <Button variant="outline" disabled className="h-9 min-w-[130px] text-gray-400 text-xs gap-1 border-gray-700 bg-gray-800">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Validando...</span>
      </Button>
    );
  }

  const emitirComprovante = () => {
    if (!podeEmitir) return;
    
    // Navega na mesma aba usando a rota limpa configurada no seu App.tsx.
    // Isso impede de forma absoluta que o navegador barre a ação por bloqueador de pop-ups.
    navigate(`/comprovante/imprimir/${poolId}`);
  };

  return (
    <Button
      disabled={!podeEmitir}
      onClick={emitirComprovante}
      type="button"
      className={`h-9 px-4 text-xs font-bold gap-1.5 transition-all uppercase tracking-wider min-w-[130px] inline-flex items-center justify-center rounded-md border
        ${podeEmitir 
          ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-500 text-white shadow-md cursor-pointer' 
          : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-70'
        }`}
      title={podeEmitir 
        ? "Gerar Comprovante Oficial de Palpites" 
        : "Complete todos os palpites deste bolão (Grupos, Classificação e Finais) para liberar o comprovante."
      }
    >
      {podeEmitir ? <FileText className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5 text-gray-400" />}
      <span>Comprovante</span>
    </Button>
  );
}