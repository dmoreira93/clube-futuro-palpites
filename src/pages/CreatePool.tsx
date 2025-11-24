import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Trophy, DollarSign, Settings2 } from 'lucide-react';

// Schema de validação
const formSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres").max(50),
  description: z.string().optional(),
  championship_id: z.string().uuid("Selecione um campeonato"),
  entry_fee: z.string().transform((val) => Number(val) || 0),
  prize_percent_1st: z.string().transform((val) => Number(val) || 0),
  prize_percent_2nd: z.string().transform((val) => Number(val) || 0),
  prize_percent_3rd: z.string().transform((val) => Number(val) || 0),
  customize_criteria: z.boolean().default(false),
});

const CreatePoolPage = () => {
  const { user, fetchAndSyncProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [championships, setChampionships] = useState<any[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      entry_fee: 0, // "0" para input type number
      prize_percent_1st: 70,
      prize_percent_2nd: 20,
      prize_percent_3rd: 10,
      customize_criteria: false,
    },
  });

  useEffect(() => {
    const loadChampionships = async () => {
        const { data } = await supabase.from('championships').select('id, name').eq('is_finished', false);
        if (data) setChampionships(data);
    };
    loadChampionships();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    setLoading(true);

    try {
      // Validação de Porcentagem
      const totalPrize = values.prize_percent_1st + values.prize_percent_2nd + values.prize_percent_3rd;
      if (values.entry_fee > 0 && totalPrize !== 100) {
          throw new Error("A soma das porcentagens dos prêmios deve ser 100%.");
      }

      // 1. Cria o Bolão (O trigger do banco vai inserir os critérios padrão automaticamente)
      const { data: pool, error } = await supabase
        .from('pools')
        .insert({
          owner_id: user.id,
          name: values.name,
          description: values.description,
          championship_id: values.championship_id,
          entry_fee: values.entry_fee,
          prize_percent_1st: values.prize_percent_1st,
          prize_percent_2nd: values.prize_percent_2nd,
          prize_percent_3rd: values.prize_percent_3rd,
          // Gera código único no front ou deixa o banco gerar (se tiver default)
          invite_code: Math.random().toString(36).substring(2, 8).toUpperCase(), 
        })
        .select()
        .single();

      if (error) throw error;

      // 2. Cria a participação do dono (Admin)
      await supabase.from('participations').insert({
        user_id: user.id,
        pool_id: pool.id,
        is_admin: true,
        payment_status: 'paid', // Dono não paga
      });

      await fetchAndSyncProfile(user); // Atualiza contexto

      toast.success("Bolão criado com sucesso!");

      // 3. Redirecionamento Inteligente
      if (values.customize_criteria) {
          // Vai para a tela de edição de critérios
          navigate(`/pool/${pool.id}/criteria-setup`);
      } else {
          // Vai direto para o dashboard
          navigate(`/pool/${pool.id}`);
      }

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-fifa-blue flex items-center gap-2">
            <Trophy className="h-6 w-6 text-fifa-gold"/> Criar Novo Bolão
          </CardTitle>
          <CardDescription>Configure as regras básicas do seu campeonato.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="championship_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campeonato</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o campeonato real" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {championships.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Bolão</FormLabel>
                    <FormControl><Input placeholder="Ex: Bolão da Firma 2026" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="entry_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taxa de Entrada (R$)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormDescription>0 para gratuito.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

              {/* Configuração de Prêmios (Só mostra se tiver taxa) */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-medium flex items-center gap-2"><DollarSign className="w-4 h-4"/> Distribuição de Prêmios (%)</h4>
                  <div className="grid grid-cols-3 gap-4">
                      <FormField control={form.control} name="prize_percent_1st" render={({ field }) => (
                          <FormItem><FormLabel>1º Lugar</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                      )}/>
                      <FormField control={form.control} name="prize_percent_2nd" render={({ field }) => (
                          <FormItem><FormLabel>2º Lugar</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                      )}/>
                      <FormField control={form.control} name="prize_percent_3rd" render={({ field }) => (
                          <FormItem><FormLabel>3º Lugar</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                      )}/>
                  </div>
              </div>

              {/* Toggle para Customizar Critérios */}
              <FormField
                control={form.control}
                name="customize_criteria"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                          <Settings2 className="w-4 h-4"/> Personalizar Pontuação
                      </FormLabel>
                      <FormDescription>
                        Deseja alterar quantos pontos valem cada acerto? (Padrão: Placar=10, Vencedor=5...)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full bg-fifa-blue hover:bg-blue-900" disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2"/> : null}
                Criar Bolão
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePoolPage;