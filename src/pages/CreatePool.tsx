// src/pages/CreatePool.tsx - VERSÃO ATUALIZADA COM PUNIÇÃO

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
import { Checkbox } from '@/components/ui/checkbox'; // Importa o Checkbox

const CreatePoolPage = () => {
  const { user, fetchAndSyncProfile } = useAuth();
  const [poolName, setPoolName] = useState('');
  const [prize1st, setPrize1st] = useState('60');
  const [prize2nd, setPrize2nd] = useState('25');
  const [prize3rd, setPrize3rd] = useState('15');
  
  // --- NOVOS ESTADOS PARA A PUNIÇÃO ---
  const [enablePunishment, setEnablePunishment] = useState(false);
  const [punishmentDescription, setPunishmentDescription] = useState('Paga um café da manhã para o campeão!');

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreatePool = async () => {
    // ... validação de nome e prêmios ...
    if (!poolName.trim()) { /* ... */ return; }
    const p1 = parseFloat(prize1st) || 0;
    const p2 = parseFloat(prize2nd) || 0;
    const p3 = parseFloat(prize3rd) || 0;
    if (p1 + p2 + p3 !== 100) { /* ... */ return; }
    
    // Validação da punição
    if (enablePunishment && !punishmentDescription.trim()) {
      toast({ title: 'Erro de Validação', description: 'Por favor, descreva a punição do último colocado.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('create_pool', {
        pool_name: poolName.trim(),
        owner_id_param: user.id,
        prize_1st: p1,
        prize_2nd: p2,
        prize_3rd: p3,
        // --- NOVOS PARÂMETROS ENVIADOS ---
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
          
          <div>
            <Label>Distribuição dos Prêmios (%)</Label>
            {/* ... campos de prêmios ... */}
             <div className="grid grid-cols-3 gap-2 mt-2">
              <div><Label htmlFor="prize-1st" className="text-xs text-muted-foreground">1º Lugar</Label><Input id="prize-1st" type="number" value={prize1st} onChange={(e) => setPrize1st(e.target.value)} /></div>
              <div><Label htmlFor="prize-2nd" className="text-xs text-muted-foreground">2º Lugar</Label><Input id="prize-2nd" type="number" value={prize2nd} onChange={(e) => setPrize2nd(e.target.value)} /></div>
              <div><Label htmlFor="prize-3rd" className="text-xs text-muted-foreground">3º Lugar</Label><Input id="prize-3rd" type="number" value={prize3rd} onChange={(e) => setPrize3rd(e.target.value)} /></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">A soma deve ser 100.</p>
          </div>

          {/* --- NOVA SEÇÃO DE PUNIÇÃO --- */}
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
          {/* --- FIM DA SEÇÃO DE PUNIÇÃO --- */}

          <Button onClick={handleCreatePool} disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : 'Criar Bolão'}
          </Button>
        </CardContent>
      </card>
    </div>
  );
};

export default CreatePoolPage;