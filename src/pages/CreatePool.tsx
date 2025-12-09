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
import { Loader2, Trophy, DollarSign, Settings2, Lock, Globe, Percent, AlertTriangle } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres").max(50),
  description: z.string().optional(),
  championship_id: z.string().uuid("Selecione um campeonato"),
  
  // Financeiro
  entry_fee: z.string().transform((val) => Number(val) || 0),
  admin_fee_percent: z.string().transform((val) => Number(val) || 0).refine(val => val >= 0 && val <= 100, "A taxa deve ser entre 0 e 100"),
  payment_required: z.boolean().default(false),
  
  // Prêmios
  prize_percent_1st: z.string().transform((val) => Number(val) || 0),
  prize_percent_2nd: z.string().transform((val) => Number(val) || 0),
  prize_percent_3rd: z.string().transform((val) => Number(val) || 0),
  
  // Configurações
  is_public: z.boolean().default(false),
  customize_criteria: z.boolean().default(false),
  
  // Pontuação (Só usadas se customize_criteria = true, mas salvamos sempre)
  points_exact_score: z.string().transform((val) => Number(val) || 10),
  points_winner_diff: z.string().transform((val) => Number(val) || 7),
  points_winner: z.string().transform((val) => Number(val) || 5),

  // Punição
  enable_punishment: z.boolean().default(false),
  punishment_description: z.string().optional(),
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
      is_public: false,
      entry_fee: 0,
      admin_fee_percent: 0,
      payment_required: false,
      prize_percent_1st: 70,
      prize_percent_2nd: 20,
      prize_percent_3rd: 10,
      
      customize_criteria: false,
      points_exact_score: 10,
      points_winner_diff: 7,
      points_winner: 5,

      enable_punishment: false,
      punishment_description: "",
    },
  });

  // Observa mudanças para mostrar/esconder campos condicionalmente
  const watchEntryFee = form.watch("entry_fee");
  const watchCustomize = form.watch("customize_criteria");
  const watchPunishment = form.watch("enable_punishment");

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
      // Validação de Prêmios (se houver taxa de entrada)
      const totalPrize = values.prize_percent_1st + values.prize_percent_2nd + values.prize_percent_3rd;
      if (values.entry_fee > 0 && totalPrize !== 100) {
          throw new Error("A soma das porcentagens dos prêmios deve ser 100%.");
      }

      // Validação Punição
      if (values.enable_punishment && !values.punishment_description) {
          throw new Error("Descreva a prenda para o último colocado.");
      }

      const { data: pool, error } = await supabase
        .from('pools')
        .insert({
          owner_id: user.id,
          name: values.name,
          description: values.description,
          championship_id: values.championship_id,
          is_public: values.is_public,
          
          // Financeiro
          entry_fee: values.entry_fee,
          admin_fee_percent: values.admin_fee_percent,
          payment_required: values.payment_required,
          prize_percent_1st: values.prize_percent_1st,
          prize_percent_2nd: values.prize_percent_2nd,
          prize_percent_3rd: values.prize_percent_3rd,
          
          // Pontuação
          points_exact_score: values.points_exact_score,
          points_winner_diff: values.points_winner_diff,
          points_winner: values.points_winner,

          // Punição
          enable_punishment: values.enable_punishment,
          punishment_description: values.enable_punishment ? values.punishment_description : null,

          invite_code: Math.random().toString(36).substring(2, 8).toUpperCase(), 
        })
        .select()
        .single();

      if (error) throw error;

      // Cria a participação do dono
      await supabase.from('participations').insert({
        user_id: user.id,
        pool_id: pool.id,
        is_admin: true,
        payment_status: 'paid',
      });

      await fetchAndSyncProfile(user);
      toast.success("Bolão criado com sucesso!");
      navigate(`/pool/${pool.id}`);

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="border-t-4 border-t-fifa-blue shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-fifa-blue flex items-center gap-2">
            <Trophy className="h-6 w-6 text-fifa-gold"/> Criar Novo Bolão
          </CardTitle>
          <CardDescription>Configure as regras do seu campeonato.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* --- DADOS BÁSICOS --- */}
              <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="is_public"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-gray-50">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base flex items-center gap-2">
                              {field.value ? <Globe className="w-4 h-4 text-green-600"/> : <Lock className="w-4 h-4 text-red-600"/>} 
                              Visibilidade: {field.value ? "Público" : "Privado"}
                          </FormLabel>
                          <FormDescription className="text-xs">
                            {field.value ? "Qualquer pessoa pode encontrar e entrar." : "Apenas quem tiver o link/código poderá entrar."}
                          </FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="championship_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campeonato Base</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                          <SelectContent>
                            {championships.map(c => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Nome do Bolão</FormLabel><FormControl><Input placeholder="Ex: Bolão da Firma 2026" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />

                  <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem><FormLabel>Descrição (Regras, PIX, etc)</FormLabel><FormControl><Textarea placeholder="Informações importantes para os participantes..." className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
              </div>

              {/* --- FINANCEIRO --- */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-4">
                  <h3 className="font-bold text-blue-900 flex items-center gap-2"><DollarSign className="w-4 h-4"/> Financeiro</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="entry_fee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Taxa de Entrada (R$)</FormLabel>
                            <FormControl><Input type="number" min="0" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="admin_fee_percent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">Taxa Adm <Percent className="w-3 h-3"/></FormLabel>
                            <FormControl><Input type="number" min="0" max="100" placeholder="0" {...field} /></FormControl>
                            <FormDescription className="text-[10px]">Para o dono.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>

                  {watchEntryFee > 0 && (
                      <div className="space-y-3 pt-2 border-t border-blue-200">
                          <FormLabel className="text-xs font-bold uppercase text-blue-700">Divisão do Prêmio (Total 100%)</FormLabel>
                          <div className="grid grid-cols-3 gap-2">
                              <FormField control={form.control} name="prize_percent_1st" render={({ field }) => <FormItem><FormLabel className="text-xs">1º Lugar</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>}/>
                              <FormField control={form.control} name="prize_percent_2nd" render={({ field }) => <FormItem><FormLabel className="text-xs">2º Lugar</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>}/>
                              <FormField control={form.control} name="prize_percent_3rd" render={({ field }) => <FormItem><FormLabel className="text-xs">3º Lugar</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>}/>
                          </div>
                      </div>
                  )}

                  <FormField
                    control={form.control}
                    name="payment_required"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-white p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-bold text-gray-700">Bloquear Palpites?</FormLabel>
                          <FormDescription className="text-xs">Só permite palpitar após pagamento confirmado.</FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )}
                  />
              </div>

              {/* --- PONTUAÇÃO --- */}
              <div className="space-y-4 pt-2">
                  <FormField
                    control={form.control}
                    name="customize_criteria"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-gray-50">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base flex items-center gap-2"><Settings2 className="w-4 h-4"/> Personalizar Pontuação</FormLabel>
                          <FormDescription className="text-xs">Alterar os valores padrão de pontos.</FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )}
                  />

                  {watchCustomize && (
                      <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50 animate-in fade-in slide-in-from-top-2">
                          <FormField control={form.control} name="points_exact_score" render={({ field }) => (
                              <FormItem><FormLabel className="text-xs font-bold text-purple-600">Cravada</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription className="text-[10px]">Placar Exato</FormDescription></FormItem>
                          )} />
                          <FormField control={form.control} name="points_winner_diff" render={({ field }) => (
                              <FormItem><FormLabel className="text-xs font-bold text-blue-600">Saldo</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription className="text-[10px]">Vencedor + Gols</FormDescription></FormItem>
                          )} />
                          <FormField control={form.control} name="points_winner" render={({ field }) => (
                              <FormItem><FormLabel className="text-xs font-bold text-green-600">Vencedor</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription className="text-[10px]">Apenas Vencedor</FormDescription></FormItem>
                          )} />
                      </div>
                  )}
              </div>

              {/* --- PUNIÇÃO --- */}
              <div className="space-y-4 pt-2 border-t">
                  <FormField
                    control={form.control}
                    name="enable_punishment"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-red-50 border-red-100">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base flex items-center gap-2 text-red-700"><AlertTriangle className="w-4 h-4"/> Punição (Lanterna)</FormLabel>
                          <FormDescription className="text-xs text-red-600">Definir uma prenda para o último colocado.</FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )}
                  />

                  {watchPunishment && (
                      <FormField control={form.control} name="punishment_description" render={({ field }) => (
                          <FormItem className="animate-in fade-in slide-in-from-top-2">
                              <FormLabel>Qual será a prenda?</FormLabel>
                              <FormControl><Input placeholder="Ex: Pagar um churrasco, vestir a camisa do rival..." {...field} /></FormControl>
                              <FormMessage />
                          </FormItem>
                      )} />
                  )}
              </div>

              <Button type="submit" className="w-full bg-fifa-blue hover:bg-blue-900 h-12 text-lg" disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2"/> : null} Criar Bolão
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePoolPage;