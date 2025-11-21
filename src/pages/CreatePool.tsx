import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, PlusCircle, Trophy, Settings, DollarSign } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';

interface Championship {
  id: string;
  name: string;
}

// URL da imagem de fundo
const HERO_BG_IMAGE = "/hero-bg.png";

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
        p_prediction_deadline: formattedDeadline,
        p_max_participants: maxParticipants ? parseInt(maxParticipants) : null,
        p_is_public: isPublic,
        p_enable_punishment: enablePunishment,
        p_punishment_desc: enablePunishment ? punishmentDescription.trim() : null,
        p_payment_required: paymentRequired
      });

      if (error) throw error;
      
      await fetchAndSyncProfile(user);
      toast.success('Bolão criado com sucesso! Você será redirecionado.');
      navigate('/dashboard');

    } catch (error: any) {
      console.error("Detalhe do Erro (JSON):", JSON.stringify(error, null, 2));
      toast.error('Erro ao criar o bolão', { description: error.message || error.details || "Verifique o console" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Cabeçalho Padrão */}
      <div className="bg-fifa-blue text-white py-10 px-4 text-center shadow-md relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-cover bg-center" style={{ backgroundImage: `url('${HERO_BG_IMAGE}')` }}></div>
        <div className="container mx-auto relative max-w-4xl z-10">
            <div className="flex justify-center mb-4">
                <div className="bg-white/10 p-3 rounded-full backdrop-blur-sm">
                    <PlusCircle className="h-8 w-8 text-fifa-gold" />
                </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-fifa-gold drop-shadow-sm">Criar Novo Bolão</h1>
            <p className="text-gray-200 mt-2 text-lg">Personalize as regras e convide seus amigos.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-3xl flex-grow">
        <Card className="shadow-xl border-t-4 border-t-fifa-gold bg-white">
          <CardHeader className="border-b border-gray-100 pb-6 mb-6">
            <div className="flex items-center gap-2 text-fifa-blue mb-2">
                <Settings className="h-5 w-5" />
                <h3 className="font-bold text-lg uppercase tracking-wide">Configurações Iniciais</h3>
            </div>
            <CardTitle className="text-2xl text-gray-800">Informações Básicas</CardTitle>
            <CardDescription>
              Comece definindo o nome e o campeonato base.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            
            {/* BLOCO 1: INFORMAÇÕES BÁSICAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="pool-name" className="text-gray-700 font-medium">Nome do Bolão</Label>
                <Input 
                    id="pool-name" 
                    placeholder="Ex: Bolão da Galera" 
                    value={poolName} 
                    onChange={(e) => setPoolName(e.target.value)} 
                    className="border-gray-300 focus:border-fifa-blue h-11" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="championship" className="text-gray-700 font-medium">Campeonato</Label>
                <Select value={selectedChampionship} onValueChange={setSelectedChampionship}>
                  <SelectTrigger id="championship" className="border-gray-300 focus:border-fifa-blue h-11">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {championships.map(champ => (
                      <SelectItem key={champ.id} value={champ.id}>{champ.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* BLOCO 2: FINANCEIRO E PRAZOS */}
            <div className="bg-gray-50 p-6 rounded-xl space-y-6 border border-gray-100 shadow-inner">
                <h3 className="font-bold text-fifa-blue flex items-center text-lg"><DollarSign className="w-5 h-5 mr-2 text-fifa-gold"/> Regras & Finanças</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="entry-fee" className="text-gray-700 font-medium">Valor da Inscrição (R$)</Label>
                        <Input id="entry-fee" type="number" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} className="bg-white border-gray-300 focus:border-fifa-blue h-11" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="prediction-deadline" className="text-gray-700 font-medium">Prazo Final (Palpites)</Label>
                        <Input id="prediction-deadline" type="datetime-local" value={predictionDeadline} onChange={(e) => setPredictionDeadline(e.target.value)} className="bg-white border-gray-300 focus:border-fifa-blue h-11" />
                    </div>
                </div>

                <div>
                    <Label className="mb-3 block text-sm font-medium text-gray-700">Distribuição dos Prêmios (%)</Label>
                    <div className="grid grid-cols-4 gap-4">
                        <div><Label htmlFor="prize-1st" className="text-xs text-gray-500 mb-1 block">1º Lugar</Label><Input id="prize-1st" type="number" value={prize1st} onChange={(e) => setPrize1st(e.target.value)} className="bg-white border-gray-300 text-center h-10" /></div>
                        <div><Label htmlFor="prize-2nd" className="text-xs text-gray-500 mb-1 block">2º Lugar</Label><Input id="prize-2nd" type="number" value={prize2nd} onChange={(e) => setPrize2nd(e.target.value)} className="bg-white border-gray-300 text-center h-10" /></div>
                        <div><Label htmlFor="prize-3rd" className="text-xs text-gray-500 mb-1 block">3º Lugar</Label><Input id="prize-3rd" type="number" value={prize3rd} onChange={(e) => setPrize3rd(e.target.value)} className="bg-white border-gray-300 text-center h-10" /></div>
                        <div><Label htmlFor="admin-fee" className="text-xs text-gray-500 mb-1 block">Taxa Admin</Label><Input id="admin-fee" type="number" value={adminFee} onChange={(e) => setAdminFee(e.target.value)} className="bg-white border-gray-300 text-center h-10" /></div>
                    </div>
                    <div className="flex justify-end mt-2">
                        <span className={`text-xs font-bold ${parseFloat(prize1st||'0') + parseFloat(prize2nd||'0') + parseFloat(prize3rd||'0') + parseFloat(adminFee||'0') === 100 ? 'text-green-600' : 'text-red-500'}`}>
                            Total: {parseFloat(prize1st||'0') + parseFloat(prize2nd||'0') + parseFloat(prize3rd||'0') + parseFloat(adminFee||'0')}% (Deve ser 100%)
                        </span>
                    </div>
                </div>
            </div>

            {/* BLOCO 3: CONFIGURAÇÕES EXTRAS */}
            <div className="space-y-5 pt-2 border-t border-gray-100">
                <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-4 mt-4">Configurações Avançadas</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="max-participants" className="text-gray-700 font-medium">Máx. Participantes</Label>
                        <Input id="max-participants" type="number" placeholder="Ilimitado" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} className="h-11 border-gray-300" />
                    </div>
                    <div className="flex flex-col justify-center space-y-2 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="is-public" className="cursor-pointer font-medium text-fifa-blue">Bolão Público</Label>
                            <Switch id="is-public" checked={isPublic} onCheckedChange={setIsPublic} />
                        </div>
                        <p className="text-xs text-gray-500">Se ativado, qualquer pessoa poderá ver e entrar no bolão pela lista pública.</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <Checkbox id="payment-required" checked={paymentRequired} onCheckedChange={(checked) => setPaymentRequired(checked as boolean)} />
                    <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="payment-required" className="cursor-pointer font-medium text-gray-700">
                            Exigir confirmação de pagamento
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            Os participantes só poderão palpitar após sua confirmação manual.
                        </p>
                    </div>
                </div>

                <div className="space-y-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                        <Checkbox id="enable-punishment" checked={enablePunishment} onCheckedChange={(checked) => setEnablePunishment(checked as boolean)} />
                        <Label htmlFor="enable-punishment" className="cursor-pointer font-medium text-gray-700">Habilitar "punição" para o último colocado?</Label>
                    </div>
                    {enablePunishment && (
                        <div className="animate-in fade-in-50 slide-in-from-top-2 pl-7">
                            <Input 
                                id="punishment-description" 
                                placeholder="Ex: Paga a rodada de cerveja!" 
                                value={punishmentDescription} 
                                onChange={(e) => setPunishmentDescription(e.target.value)} 
                                className="bg-red-50 border-red-200 text-red-900 placeholder:text-red-300 h-10" 
                            />
                        </div>
                    )}
                </div>
            </div>

            <Button 
                onClick={handleCreatePool} 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-yellow-500 via-fifa-gold to-yellow-500 text-fifa-blue hover:from-yellow-400 hover:to-yellow-400 font-bold py-6 text-lg shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all mt-6"
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : 'Criar Bolão Agora'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatePoolPage;