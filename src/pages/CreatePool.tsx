// src/pages/CreatePool.tsx (VERSÃO CORRIGIDA)

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Championship } from '@/integrations/supabase/types';

const formSchema = z.object({
  name: z.string().min(3, { message: 'O nome do bolão deve ter pelo menos 3 caracteres.' }),
  description: z.string().optional(),
  championshipId: z.string({ required_error: "Selecione um campeonato." }),
});

type FormData = z.infer<typeof formSchema>;

const CreatePool = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const { data: championships, isLoading: isLoadingChampionships } = useQuery<Championship[]>({
    queryKey: ['championships'],
    queryFn: async () => {
      const { data, error } = await supabase.from('championships').select('*');
      if (error) throw new Error('Não foi possível carregar os campeonatos.');
      return data;
    },
  });

  const onSubmit = async (values: FormData) => {
    if (!user) {
      toast({
        title: 'Erro de autenticação',
        description: 'Você precisa estar logado para criar um bolão.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // --- CORREÇÃO APLICADA AQUI ---
      // Mapeando os dados do formulário para os parâmetros da função RPC
      const { data, error } = await supabase.rpc('create_pool', {
        pool_name: values.name,
        pool_description: values.description,
        championship_id: values.championshipId,
        creator_id: user.id,
      });
      // --- FIM DA CORREÇÃO ---

      if (error) {
        throw error;
      }
      
      toast({
        title: 'Sucesso!',
        description: `O bolão "${values.name}" foi criado.`,
      });

      // O retorno da RPC deve ser o ID do novo bolão, para podermos redirecionar
      const newPoolId = data; 
      if (newPoolId) {
        navigate(`/pools/${newPoolId}`);
      } else {
        navigate('/dashboard'); // Fallback para o dashboard
      }

    } catch (error: any) {
      console.error('Erro ao criar o bolão:', error);
      toast({
        title: 'Erro ao criar o bolão',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Bolão</CardTitle>
          <CardDescription>Preencha as informações abaixo para começar um novo bolão com seus amigos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Bolão</FormLabel>
                    <FormControl>
                      <Input placeholder="Bolão da Turma" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descreva brevemente as regras ou o objetivo do bolão." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="championshipId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campeonato</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger disabled={isLoadingChampionships}>
                          <SelectValue placeholder="Selecione o campeonato base para o bolão..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {championships?.map((champ) => (
                          <SelectItem key={champ.id} value={champ.id}>
                            {champ.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Bolão
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePool;