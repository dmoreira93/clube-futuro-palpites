import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom'; // Adicionado useParams
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // Adicionado
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch'; // Adicionado
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Copy, Lock, DollarSign } from 'lucide-react';
import { Pool } from '@/types/matches';

const PoolSettingsPage = () => {
  const { poolId } = useParams<{ poolId: string }>(); // Pega ID da URL
  const { user, switchPool } = useAuth();
  const { toast } = useToast();
  
  const [pool, setPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados do Formulário
  const [poolName, setPoolName] = useState('');
  const [description, setDescription] = useState('');
  const [entryFee, setEntryFee] = useState('0');
  const [paymentRequired, setPaymentRequired] = useState(false); // Novo
  
  const [prize1st, setPrize1st] = useState('0');
  const [prize2nd, setPrize2nd] = useState('0');
  const [prize3rd, setPrize3rd] = useState('0');
  
  const [enablePunishment, setEnablePunishment] = useState(false);
  const [punishmentDescription, setPunishmentDescription] = useState('');

  const fetchPoolSettings = useCallback(async () => {
    if (!poolId) return; // Validação pelo ID da URL
    
    // Sincroniza o menu lateral
    switchPool(poolId);

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pools')
        .select('*')
        .eq('id', poolId)
        .single();

      if (error) throw error;
      
      if (data) {
        setPool(data);
        setPoolName(data.name);
        setDescription(data.description || '');
        setEntryFee(String(data.entry_fee || '0'));
        setPaymentRequired(data.payment_required || false);
        setPrize1st(String(data.prize_percent_1st));
        setPrize2nd(String(data.prize_percent_2nd));
        setPrize3rd(String(data.prize_percent_3rd));
        setEnablePunishment(data.enable_punishment || false);
        setPunishmentDescription(data.punishment_description || '');
      }
    } catch (error: any) {
      toast({ title: 'Erro ao carregar configurações', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false); // Garante que o loading para
    }
  }, [poolId, toast, switchPool]);

  useEffect(() => {
    fetchPoolSettings();
  }, [fetchPoolSettings]);
  
  const handleUpdateSettings = async () => {
    if (!pool) return;
    
    // Validação de Prêmios
    const p1 = parseFloat(prize1st) || 0;
    const p2 = parseFloat(prize2nd) || 0;
    const p3 = parseFloat(prize3rd) || 0;
    const fee = parseFloat(entryFee) || 0;

    if (fee > 0 && (p1 + p2 + p3 !== 100)) {
        toast({ title: "Erro", description: "A soma das porcentagens deve ser 100%.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    try {
        const { error } = await supabase
            .from('pools')
            .update({
                name: poolName,
                description: description,
                entry_fee: fee,
                payment_required: paymentRequired,
                prize_percent_1st: p1,
                prize_percent_2nd: p2,
                prize_percent_3rd: p3,
                enable_punishment: enablePunishment,
                punishment_description: enablePunishment ? punishmentDescription : null
            })
            .eq('id', pool.id);
        
        if (error) throw error;
        toast({ title: 'Sucesso!', description: 'Configurações do bolão atualizadas.' });
    } catch (error: any) {
        toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const inviteLink = `${window.location.origin}/cadastro/${pool?.invite_code}`;

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({ title: 'Link Copiado!', description: 'Envie para seus amigos.' });
  };
  
  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8 text-fifa-blue" /></div>;
  
  // Verificação de segurança: Só o dono vê
  if (!pool || user?.id !== pool.owner_id) {
      return (
        <div className="container mx-auto p-8 text-center">
            <p className="text-muted-foreground">Você não tem permissão para editar este bolão.</p>
            <Button variant="link" onClick={() => window.history.back()}>Voltar</Button>
        </div>
      );
  }

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <div className="space-y-6">
          
          {/* Card de Convite */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Link de Convite</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-2">
              <Input value={inviteLink} readOnly className="bg-gray-50" />
              <Button size="icon" onClick={copyInviteLink}><Copy className="h-4 w-4" /></Button>
            </CardContent>
          </Card>

          {/* Formulário de Edição */}
          <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-fifa-blue">Editar Regras do Bolão</CardTitle>
                <CardDescription>Ajuste as configurações gerais e financeiras.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 
                 {/* Dados Básicos */}
                 <div className="space-y-2">
                    <Label htmlFor="pool-name">Nome do Bolão</Label>
                    <Input id="pool-name" value={poolName} onChange={(e) => setPoolName(e.target.value)} />
                 </div>

                 <div className="space-y-2">
                    <Label htmlFor="description">Descrição / Regras Extras</Label>
                    <Textarea 
                        id="description" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        placeholder="Ex: Chave Pix para pagamento..."
                        className="resize-none h-24"
                    />
                 </div>

                 {/* Configuração Financeira */}
                 <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="entry-fee">Valor da Inscrição (R$)</Label>
                        <Input id="entry-fee" type="number" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} />
                     </div>

                     <div className="flex flex-row items-center justify-between rounded-lg border bg-white p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <Label className="text-base flex items-center gap-2 text-blue-900">
                              <Lock className="w-4 h-4"/> Bloqueio por Pagamento
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Impedir palpites até confirmação do pagamento?
                          </p>
                        </div>
                        <Switch checked={paymentRequired} onCheckedChange={setPaymentRequired} />
                      </div>
                 </div>

                 {/* Prêmios */}
                 <div className="p-4 bg-gray-50 rounded-lg border space-y-3">
                    <Label className="flex items-center gap-2"><DollarSign className="w-4 h-4"/> Distribuição de Prêmios (%)</Label>
                    <div className="grid grid-cols-3 gap-3">
                        <div><Label htmlFor="prize-1st" className="text-xs text-muted-foreground">1º Lugar</Label><Input id="prize-1st" type="number" value={prize1st} onChange={(e) => setPrize1st(e.target.value)} /></div>
                        <div><Label htmlFor="prize-2nd" className="text-xs text-muted-foreground">2º Lugar</Label><Input id="prize-2nd" type="number" value={prize2nd} onChange={(e) => setPrize2nd(e.target.value)} /></div>
                        <div><Label htmlFor="prize-3rd" className="text-xs text-muted-foreground">3º Lugar</Label><Input id="prize-3rd" type="number" value={prize3rd} onChange={(e) => setPrize3rd(e.target.value)} /></div>
                    </div>
                 </div>

                 {/* Punição */}
                 <div className="space-y-4 pt-2 border-t">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="enable-punishment" checked={enablePunishment} onCheckedChange={(checked) => setEnablePunishment(checked as boolean)} />
                        <Label htmlFor="enable-punishment">Habilitar "punição" para o último colocado?</Label>
                    </div>
                    {enablePunishment && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <Label htmlFor="punishment-description">Qual é a prenda?</Label>
                            <Input id="punishment-description" value={punishmentDescription} onChange={(e) => setPunishmentDescription(e.target.value)} placeholder="Ex: Pagar uma rodada..." />
                        </div>
                    )}
                 </div>

                 <Button onClick={handleUpdateSettings} disabled={isSubmitting} className="w-full bg-fifa-blue hover:bg-blue-900">
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null} Salvar Alterações
                 </Button>
              </CardContent>
            </Card>
      </div>
    </div>
  );
};

export default PoolSettingsPage;