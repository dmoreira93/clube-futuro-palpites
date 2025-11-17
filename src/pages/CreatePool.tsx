// src/pages/CreatePool.tsx (VERSÃO COM CORREÇÃO DE DATA E LOG)

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';

interface Championship {
  id: string;
  name: string;
}

const CreatePoolPage = () => {
  const { user, fetchAndSyncProfile } = useAuth();
  const navigate = useNavigate();
  
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados
  const [poolName, setPoolName] = useState('');
  const [selectedChampionship, setSelectedChampionship] = useState<string | undefined>(undefined);
  const [entryFee, setEntryFee] = useState('25');
  const [prize1st, setPrize1st] = useState('70');
  const [prize2nd, setPrize2nd] = useState('30');
  const [prize3rd, setPrize3rd] = useState('0');
  const [adminFee, setAdminFee] = useState('0');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [predictionDeadline, setPredictionDeadline] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [enablePunishment, setEnablePunishment] = useState(false);
  const [punishmentDescription, setPunishmentDescription] = useState('Paga um café para o campeão!');
  const [paymentRequired, setPaymentRequired] = useState(false);

  useEffect(() => {
    const fetchChampionships = async () => {
      const { data, error } = await supabase.from('championships').select('id, name');
      if (error) {
        toast.error("Erro ao carregar campeonatos.");
      } else {
        setChampionships(data);
      }
    };
    fetchChampionships();
  }, []);

  const handleCreatePool = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para criar um bolão.");
      return;
    }
    if (!poolName.trim() || !selectedChampionship) {
      toast.error("Nome do Bolão e Campeonato são obrigatórios.");
      return;
    }
    const totalPrizes = parseFloat(prize1st) + parseFloat(prize2nd) + parseFloat(prize3rd) + parseFloat(adminFee);
    if (totalPrizes !== 100) {
      toast.error("A soma dos prêmios e da taxa de admin deve ser exatamente 100%.");
      return;
    }

    setLoading(true);
    try {
      // CORREÇÃO 1: Formatar a data para ISO String (que o banco aceita)
      let formattedDeadline = null;
      if (predictionDeadline) {
        formattedDeadline = new Date(predictionDeadline).toISOString();
      }

      const { data, error } = await supabase.rpc('create_pool', {
        p_pool_name: poolName.trim(),
        p_owner_id: user.id,
        p_championship_id: selectedChampionship,
        p_entry_fee: parseFloat(entryFee) || 0,
        p_prize_1st: parseFloat(prize1st) || 0,
        p_prize_2nd: parseFloat(prize2nd) || 0,
        p_prize_3rd: parseFloat(prize3rd) || 0,
        p_admin_fee: parseFloat(adminFee) || 0,
        p_prediction_deadline: formattedDeadline, // Usando a data formatada
        p_max_participants: maxParticipants ? parseInt(maxParticipants) : null,
        p_is_public: isPublic,
        p_enable_punishment: enablePunishment,
        p_punishment_desc: enablePunishment ? punishmentDescription.trim() : null,
        p_payment_required: paymentRequired
      });

      if (error) throw error;
      
      await fetchAndSyncProfile(user);
      toast.success('Bolão criado com sucesso! Você será redirecionado.');
      
      // Se a função retornar o ID, usamos. Se não, dashboard.
      // Algumas versões da sua função retornavam VOID, outras UUID. 
      // O código original tentava usar 'data' como ID, mas se for void, data é null.
      // Redirecionando para dashboard para garantir.
      navigate('/dashboard');

    } catch (error: any) {
      // CORREÇÃO 2: Melhorar o log para ver o erro real se acontecer de novo
      console.error("Detalhe do Erro (JSON):", JSON.stringify(error, null, 2));
      toast.error('Erro ao criar o bolão', { description: error.message || error.details || "Verifique o console" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Bolão</CardTitle>
          <CardDescription>
            Defina um nome e as regras de premiação e punição para o seu bolão.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pool-name">Nome do Bolão</Label>
              <Input id="pool-name" placeholder="Ex: Bolão da Galera" value={poolName} onChange={(e) => setPoolName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="championship">Campeonato</Label>
              {/* value={selectedChampionship || undefined} ajuda a evitar o warning de uncontrolled */}
              <Select value={selectedChampionship} onValueChange={setSelectedChampionship}>
                <SelectTrigger id="championship"><SelectValue placeholder="Selecione o campeonato..." /></SelectTrigger>
                <SelectContent>
                  {championships.map(champ => (
                    <SelectItem key={champ.id} value={champ.id}>{champ.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entry-fee">Valor da Inscrição (R$)</Label>
              <Input id="entry-fee" type="number" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prediction-deadline">Prazo Final para Palpites</Label>
              <Input id="prediction-deadline" type="datetime-local" value={predictionDeadline} onChange={(e) => setPredictionDeadline(e.target.value)} />
            </div>
          </div>
          
          <div>
            <Label>Distribuição dos Prêmios + Taxa (%)</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              <div><Label htmlFor="prize-1st" className="text-xs text-muted-foreground">1º Lugar</Label><Input id="prize-1st" type="number" value={prize1st} onChange={(e) => setPrize1st(e.target.value)} /></div>
              <div><Label htmlFor="prize-2nd" className="text-xs text-muted-foreground">2º Lugar</Label><Input id="prize-2nd" type="number" value={prize2nd} onChange={(e) => setPrize2nd(e.target.value)} /></div>
              <div><Label htmlFor="prize-3rd" className="text-xs text-muted-foreground">3º Lugar</Label><Input id="prize-3rd" type="number" value={prize3rd} onChange={(e) => setPrize3rd(e.target.value)} /></div>
              <div><Label htmlFor="admin-fee" className="text-xs text-muted-foreground">Taxa Admin</Label><Input id="admin-fee" type="number" value={adminFee} onChange={(e) => setAdminFee(e.target.value)} /></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">A soma de todos os campos deve ser 100.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="max-participants">Nº Máximo de Participantes</Label>
                <Input id="max-participants" type="number" placeholder="Deixe em branco para ilimitado" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label>Visibilidade do Bolão</Label>
                <div className="flex items-center space-x-2 h-10">
                    <Switch id="is-public" checked={isPublic} onCheckedChange={setIsPublic} />
                    <Label htmlFor="is-public">{isPublic ? "Público (visível na homepage)" : "Privado (somente por convite)"}</Label>
                </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="enable-punishment" checked={enablePunishment} onCheckedChange={(checked) => setEnablePunishment(checked as boolean)} />
              <Label htmlFor="enable-punishment">Habilitar "punição" para o último colocado?</Label>
            </div>
            {enablePunishment && (
              <div className="space-y-2 animate-in fade-in-0">
                <Label htmlFor="punishment-description">Descreva a punição</Label>
                <Input id="punishment-description" value={punishmentDescription} onChange={(e) => setPunishmentDescription(e.target.value)} />
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
                <Checkbox id="payment-required" checked={paymentRequired} onCheckedChange={(checked) => setPaymentRequired(checked as boolean)} />
                <Label htmlFor="payment-required">Exigir confirmação de pagamento para liberar palpites?</Label>
            </div>
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