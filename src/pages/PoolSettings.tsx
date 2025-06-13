import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Copy } from 'lucide-react';
import { Pool } from '@/types/matches';

const PoolSettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pool, setPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [poolName, setPoolName] = useState('');
  const [entryFee, setEntryFee] = useState('0'); // <-- NOVO ESTADO
  const [prize1st, setPrize1st] = useState('0');
  const [prize2nd, setPrize2nd] = useState('0');
  const [prize3rd, setPrize3rd] = useState('0');
  const [enablePunishment, setEnablePunishment] = useState(false);
  const [punishmentDescription, setPunishmentDescription] = useState('');

  const fetchPoolSettings = useCallback(async () => {
    if (!user?.pool_id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase.from('pools').select('*').eq('id', user.pool_id).single();
      if (error) throw error;
      if (data) {
        setPool(data);
        setPoolName(data.name);
        setEntryFee(String(data.entry_fee || '0')); // <-- ATUALIZADO
        setPrize1st(String(data.prize_percent_1st));
        setPrize2nd(String(data.prize_percent_2nd));
        setPrize3rd(String(data.prize_percent_3rd));
        setEnablePunishment(data.enable_punishment || false);
        setPunishmentDescription(data.punishment_description || '');
      }
    } catch (error: any) {
      toast({ title: 'Erro ao carregar configurações', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchPoolSettings();
  }, [fetchPoolSettings]);
  
  const handleUpdateSettings = async () => {
    if (!pool) return;
    const fee = parseFloat(entryFee) || 0;
    // ... (outras validações)
    setIsSubmitting(true);
    try {
        const { error } = await supabase
            .from('pools')
            .update({
                name: poolName,
                entry_fee: fee, // <-- ATUALIZADO
                prize_percent_1st: parseFloat(prize1st) || 0,
                prize_percent_2nd: parseFloat(prize2nd) || 0,
                prize_percent_3rd: parseFloat(prize3rd) || 0,
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
  
  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
  if (!pool) return <p>Você não é o dono de um bolão ou ocorreu um erro.</p>;
  
  const isOwner = user?.id === pool.owner_id;

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Configurações do seu Bolão</CardTitle>
          <CardDescription>Gerencie as regras e convide participantes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Link de Convite</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-2">
              <Input value={inviteLink} readOnly />
              <Button size="icon" onClick={copyInviteLink}><Copy className="h-4 w-4" /></Button>
            </CardContent>
          </Card>

          {isOwner ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Editar Regras</CardTitle>
                <CardDescription>Apenas o dono do bolão pode editar estas informações.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="space-y-2">
                    <Label htmlFor="pool-name">Nome do Bolão</Label>
                    <Input id="pool-name" value={poolName} onChange={(e) => setPoolName(e.target.value)} />
                 </div>
                 {/* CAMPO DE VALOR DA INSCRIÇÃO ADICIONADO */}
                 <div className="space-y-2">
                    <Label htmlFor="entry-fee">Valor da Inscrição (R$)</Label>
                    <Input id="entry-fee" type="number" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} />
                 </div>
                 <div>
                    <Label>Distribuição dos Prêmios (%)</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                        <div><Label htmlFor="prize-1st" className="text-xs text-muted-foreground">1º Lugar</Label><Input id="prize-1st" type="number" value={prize1st} onChange={(e) => setPrize1st(e.target.value)} /></div>
                        <div><Label htmlFor="prize-2nd" className="text-xs text-muted-foreground">2º Lugar</Label><Input id="prize-2nd" type="number" value={prize2nd} onChange={(e) => setPrize2nd(e.target.value)} /></div>
                        <div><Label htmlFor="prize-3rd" className="text-xs text-muted-foreground">3º Lugar</Label><Input id="prize-3rd" type="number" value={prize3rd} onChange={(e) => setPrize3rd(e.target.value)} /></div>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="enable-punishment" checked={enablePunishment} onCheckedChange={(checked) => setEnablePunishment(checked as boolean)} />
                        <Label htmlFor="enable-punishment">Habilitar "punição" para o último colocado?</Label>
                    </div>
                    {enablePunishment && (
                    <div className="space-y-2"><Label htmlFor="punishment-description">Descreva a punição</Label><Input id="punishment-description" value={punishmentDescription} onChange={(e) => setPunishmentDescription(e.target.value)} /></div>
                    )}
                 </div>
                 <Button onClick={handleUpdateSettings} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null} Salvar Alterações
                 </Button>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground">Você está participando do bolão "{pool.name}". Apenas o criador pode editar as regras.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PoolSettingsPage;