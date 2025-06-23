// src/pages/AuditoriaPontos.tsx

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

// Interfaces para os dados
interface AuditDetail {
  entity: string;
  match_name?: string;
  match_result?: string;
  prediction?: string;
  result?: string;
  prediction_champion?: string;
  result_champion?: string;
}

interface AuditData {
  user_id: string;
  user_name: string;
  points: number;
  points_type: string;
  created_at: string;
  details: AuditDetail;
}

// Função para buscar os dados via RPC
const fetchAuditData = async (poolId: string | undefined) => {
  if (!poolId) return [];
  const { data, error } = await supabase.rpc('get_pool_audit_data', { p_pool_id: poolId });
  if (error) throw new Error(error.message);
  return data as AuditData[];
};

const AuditoriaPontos = () => {
  const { pool } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState('all');

  // Busca os dados usando React Query
  const { data: auditData = [], isLoading, error } = useQuery<AuditData[]>({
    queryKey: ['auditData', pool?.id],
    queryFn: () => fetchAuditData(pool?.id),
    enabled: !!pool?.id, // A query só roda se o usuário tiver um pool_id
  });

  // Extrai a lista de usuários únicos para o filtro
  const users = useMemo(() => {
    if (!auditData) return [];
    const uniqueUsers = Array.from(new Map(auditData.map(item => [item.user_id, { id: item.user_id, name: item.user_name }])).values());
    return uniqueUsers.sort((a, b) => a.name.localeCompare(b.name));
  }, [auditData]);

  // Filtra os dados com base no usuário selecionado
  const filteredData = useMemo(() => {
    if (selectedUserId === 'all') return auditData;
    return auditData.filter(item => item.user_id === selectedUserId);
  }, [auditData, selectedUserId]);

  // Calcula o total de pontos do filtro
  const totalPoints = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.points, 0);
  }, [filteredData]);

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

          {isLoading ? (
            <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-fifa-blue" /></div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro ao Carregar Auditoria</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participante</TableHead>
                    <TableHead>Detalhes</TableHead>
                    <TableHead className="text-center">Pontos</TableHead>
                    <TableHead className="text-right">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length > 0 ? (
                    filteredData.map((item, index) => (
                      <TableRow key={`${item.user_id}-${item.created_at}-${index}`}>
                        <TableCell className="font-medium">{item.user_name}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold">{item.details.entity}</span>
                            <span className="text-xs text-muted-foreground">
                                {item.details.match_name && `Partida: ${item.details.match_name}`}
                                {item.details.prediction && ` | Palpite: ${item.details.prediction}`}
                                {item.details.result && ` | Resultado: ${item.details.result}`}
                                {item.details.match_result && ` | Resultado: ${item.details.match_result}`}
                                {item.details.prediction_champion && ` | Palpite Campeão: ${item.details.prediction_champion}`}
                            </span>
                          </div>
                        </TableCell>
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
                        Nenhum registro de ponto encontrado para a seleção atual.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditoriaPontos;