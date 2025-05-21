// src/pages/ChangePassword.tsx

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
  const { user, isAuthenticated, isLoadingAuth, isFirstLogin, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true); // Controla o carregamento inicial da página
  const [submitting, setSubmitting] = useState(false); // Controla o estado de submissão do formulário

  // Redireciona se não for o primeiro login ou não estiver autenticado
  useEffect(() => {
    if (!isLoadingAuth) {
      if (!isAuthenticated) {
        navigate('/login'); // Redireciona para login se não estiver autenticado
      } else if (!isFirstLogin) {
        // Se já foi o primeiro login e a senha já foi alterada, redireciona para a página principal
        toast.info("Sua senha já foi definida. Redirecionando para a página principal.");
        navigate('/');
      } else {
        setLoading(false); // Terminou de carregar e é o primeiro login
      }
    }
  }, [isAuthenticated, isLoadingAuth, isFirstLogin, navigate]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres.');
      setSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      setSubmitting(false);
      return;
    }

    try {
      // 1. Atualiza a senha no Supabase Auth
      const { data, error: updateError } = await supabase.auth.updateUser({ password: password });

      if (updateError) {
        console.error("Erro ao atualizar senha:", updateError);
        // O Supabase pode retornar erros como "Password is too weak" ou "Password has been used recently"
        toast.error(`Falha ao atualizar senha: ${updateError.message}`);
        setSubmitting(false);
        return;
      }

      // 2. Atualiza a flag `first_login` na tabela `users_custom`
      await updateUserProfile({ first_login: true }); // Usando a nova função do AuthContext

      toast.success('Senha alterada com sucesso! Redirecionando...');
      navigate('/'); // Redireciona para a página inicial ou de palpites
    } catch (err: any) {
      console.error("Erro inesperado:", err);
      toast.error(`Ocorreu um erro: ${err.message || 'Tente novamente.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || isLoadingAuth) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-fifa-blue" />
          <p className="ml-2 text-fifa-blue">Carregando...</p>
        </div>
      </Layout>
    );
  }

  // Só renderiza o formulário se for realmente o primeiro login
  if (!isFirstLogin) {
      return null; // O useEffect já vai redirecionar
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
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirme a Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua senha"
                  required
                  disabled={submitting}
                />
              </div>
              <Button type="submit" className="w-full bg-fifa-blue hover:bg-fifa-blue-dark" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Nova Senha'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ChangePassword;