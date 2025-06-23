// src/pages/AuditoriaPontos.tsx (NOVA VERSÃO SEM RPC)

import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- NOVAS FUNÇÕES DE BUSCA DE DADOS ---

// Busca todos os dados brutos necessários
const fetchAllAuditData = async (poolId: string | undefined) => {
  if (!poolId) return null;

  const { data: users, error: usersError } = await supabase
    .from('users_custom')
    .select('id, name, avatar_url')
    .eq('pool_id', poolId)
    .eq('is_admin', false);
  if (usersError) throw usersError;

  const userIds = users.map(u => u.id);

  const { data: points, error: pointsError } = await supabase
    .from('user_points')
    .select('*')
    .in('user_id', userIds);
  if (pointsError) throw pointsError;

  // Adicione mais buscas conforme necessário (partidas, grupos, etc.)
  // Por simplicidade inicial, vamos focar nos pontos e usuários.
  // Você pode expandir isso para buscar detalhes de partidas/grupos depois.

  return { users, points };
};


const AuditoriaPontos = () => {
  const { pool } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState('all');

  // useQuery agora busca os dados brutos
  const { data, isLoading, error } = useQuery({
    queryKey: ['rawAuditData', pool?.id],
    queryFn: () => fetchAllAuditData(pool?.id),
    enabled: !!pool?.id,
  });

  // Processa e formata os dados no frontend
  const processedData = useMemo(() => {
    if (!data || !data.points || !data.users) return [];
    
    return data.points.map(point => {
      const user = data.users.find(u => u.id === point.user_id);
      return {
        ...point,
        user_name: user?.name || 'Usuário Desconhecido',
        details: { // Detalhes simplificados por enquanto
          entity: `Pontos de ${point.points_type || 'Origem Desconhecida'}`,
        }
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [data]);

  const users = useMemo(() => {
    return data?.users.sort((a, b) => a.name.localeCompare(b.name)) || [];
  }, [data?.users]);

  const filteredData = useMemo(() => {
    if (selectedUserId === 'all') return processedData;
    return processedData.filter(item => item.user_id === selectedUserId);
  }, [processedData, selectedUserId]);
  
  const totalPoints = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.points, 0);
  }, [filteredData]);

  if (isLoading) {
    return <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-fifa-blue" /></div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro ao Carregar Auditoria</AlertTitle>
        <AlertDescription>{(error as Error).message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <FileText className="text-fifa-blue" />
            Auditoria de Pontos do Bolão
          </CardTitle>
          <CardDescription>
            Visualize o detalhe de cada ponto ganho pelos participantes. Use o filtro para analisar um jogador específico.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-full sm:w-[280px]">
                  <SelectValue placeholder="Filtrar por participante..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Participantes</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total de Pontos (Filtro)</p>
              <p className="text-2xl font-bold text-fifa-blue">{totalPoints}</p>
            </div>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participante</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead className="text-center">Pontos</TableHead>
                  <TableHead className="text-right">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.user_name}</TableCell>
                      <TableCell>{item.details.entity}</TableCell>
                      <TableCell className="text-center font-bold">
                          <Badge variant={item.points > 0 ? 'default' : 'secondary'}>{item.points}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs">
                          {format(new Date(item.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Nenhum registro de ponto encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditoriaPontos;