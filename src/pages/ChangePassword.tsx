import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const ChangePassword = () => {
  const { user, isFirstLogin, loading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Redireciona se o usuário não precisar mais estar nesta página
    if (!loading && !isFirstLogin) {
      navigate('/');
    }
  }, [loading, isFirstLogin, navigate]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }
    if (!user) {
      toast.error('Sessão não encontrada. Por favor, faça login novamente.');
      return;
    }

    setSubmitting(true);

    try {
      // ETAPA 1: Atualiza a senha no sistema de autenticação do Supabase
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;

      // ETAPA 2: Atualiza a flag 'first_login' diretamente no banco de dados
      const { error: profileError } = await supabase
        .from('users_custom')
        .update({ first_login: false })
        .eq('id', user.id);
      if (profileError) throw profileError;

      toast.success('Senha alterada com sucesso! Redirecionando...');
      
      // Força a atualização da sessão para que o app reconheça o novo estado
      await supabase.auth.refreshSession();
      
      // Redireciona para a página principal
      navigate('/');

    } catch (err: any) {
      console.error("Erro no processo de troca de senha:", err);
      toast.error(`Falha ao atualizar: ${err.message}`);
    } finally {
      // Este bloco agora será alcançado, mesmo em caso de erro
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-fifa-blue" /></div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-md p-6 shadow-lg rounded-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-fifa-blue">Defina Sua Nova Senha</CardTitle>
            <CardDescription className="text-gray-600">
              Esta é sua primeira vez acessando. Por favor, defina uma nova senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <Label htmlFor="password">Nova Senha</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required disabled={submitting} />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirme a Nova Senha</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirme sua senha" required disabled={submitting}/>
              </div>
              <Button type="submit" className="w-full bg-fifa-blue hover:bg-fifa-blue-dark" disabled={submitting}>
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar Nova Senha'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ChangePassword;