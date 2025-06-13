// src/pages/CreatePool.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const CreatePoolPage = () => {
  const { user, fetchAndSyncProfile } = useAuth();
  const [poolName, setPoolName] = useState('');
  const [entryFee, setEntryFee] = useState('25'); // <-- NOVO ESTADO PARA A TAXA
  const [prize1st, setPrize1st] = useState('60');
  const [prize2nd, setPrize2nd] = useState('25');
  const [prize3rd, setPrize3rd] = useState('15');
  const [enablePunishment, setEnablePunishment] = useState(false);
  const [punishmentDescription, setPunishmentDescription] = useState('Paga um café da manhã para o campeão!');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreatePool = async () => {
    // ... (validações existentes)
    const fee = parseFloat(entryFee) || 0;
    if (fee <= 0) {
      toast({ title: 'Erro de Validação', description: 'O valor da inscrição deve ser maior que zero.', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    try {
      // ATUALIZADO: Adicionamos o 'entry_fee_param' na chamada da função
      const { error } = await supabase.rpc('create_pool', {
        pool_name: poolName.trim(),
        owner_id_param: user.id,
        entry_fee_param: fee, // <-- NOVO PARÂMETRO
        prize_1st: parseFloat(prize1st) || 0,
        prize_2nd: parseFloat(prize2nd) || 0,
        prize_3rd: parseFloat(prize3rd) || 0,
        enable_punishment_param: enablePunishment,
        punishment_desc_param: enablePunishment ? punishmentDescription.trim() : null
      });
      
      if (error) throw error;
      
      await fetchAndSyncProfile(user);
      toast({ title: 'Bolão Criado!', description: 'Seu novo bolão foi criado com sucesso. Convide seus amigos!' });
      navigate('/dashboard');

    } catch (error: any) {
      toast({ title: 'Erro ao criar o bolão', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Bolão</CardTitle>
          <CardDescription>
            Defina um nome e as regras de premiação e punição para o seu bolão.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="pool-name">Nome do Bolão</Label>
            <Input id="pool-name" placeholder="Ex: Bolão da Galera" value={poolName} onChange={(e) => setPoolName(e.target.value)} />
          </div>
          
          {/* CAMPO DE VALOR DA INSCRIÇÃO ADICIONADO */}
          <div className="space-y-2">
            <Label htmlFor="entry-fee">Valor da Inscrição (R$)</Label>
            <Input id="entry-fee" type="number" placeholder="Ex: 25" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} />
          </div>
          
          <div>
            <Label>Distribuição dos Prêmios (%)</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div><Label htmlFor="prize-1st" className="text-xs text-muted-foreground">1º Lugar</Label><Input id="prize-1st" type="number" value={prize1st} onChange={(e) => setPrize1st(e.target.value)} /></div>
              <div><Label htmlFor="prize-2nd" className="text-xs text-muted-foreground">2º Lugar</Label><Input id="prize-2nd" type="number" value={prize2nd} onChange={(e) => setPrize2nd(e.target.value)} /></div>
              <div><Label htmlFor="prize-3rd" className="text-xs text-muted-foreground">3º Lugar</Label><Input id="prize-3rd" type="number" value={prize3rd} onChange={(e) => setPrize3rd(e.target.value)} /></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">A soma deve ser 100.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="enable-punishment" checked={enablePunishment} onCheckedChange={(checked) => setEnablePunishment(checked as boolean)} />
              <Label htmlFor="enable-punishment" className="cursor-pointer">
                Habilitar "punição" para o último colocado?
              </Label>
            </div>
            {enablePunishment && (
              <div className="space-y-2 animate-in fade-in-0">
                <Label htmlFor="punishment-description">Descreva a punição</Label>
                <Input 
                  id="punishment-description" 
                  placeholder="Ex: Paga um café para o campeão"
                  value={punishmentDescription}
                  onChange={(e) => setPunishmentDescription(e.target.value)}
                />
              </div>
            )}
          </div>

          <Button onClick={handleCreatePool} disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : 'Criar Bolão'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePoolPage;