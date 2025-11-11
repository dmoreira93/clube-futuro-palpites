// src/components/dashboard/PaymentManagement.tsx

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, BadgeDollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

type Participant = {
  id: string;
  name: string;
  avatar_url: string | null;
  payment_status: 'paid' | 'pending';
};

const PaymentManagement = () => {
  const { activePool } = useAuth();
  const queryClient = useQueryClient();

  const { data: participants, isLoading } = useQuery<Participant[]>({
    queryKey: ['poolParticipants', activePool?.id],
    queryFn: async () => {
      if (!activePool?.id) return [];
      
      // Get all participants from the participations table
      const { data: participationsData, error: participationsError } = await supabase
        .from('participations')
        .select('user_id')
        .eq('pool_id', activePool.id);
      
      if (participationsError) throw participationsError;
      if (!participationsData || participationsData.length === 0) return [];
      
      const userIds = participationsData.map(p => p.user_id);
      
      const { data, error } = await supabase
        .from('users_custom')
        .select('id, name, avatar_url, payment_status')
        .in('id', userIds)
        .eq('is_admin', false)
        .order('name');
      if (error) throw error;
      return (data || []).map(p => ({
        ...p,
        payment_status: (p.payment_status as 'paid' | 'pending') || 'pending'
      }));
    },
    enabled: !!activePool,
  });

  const updatePaymentStatus = useMutation({
    mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: 'paid' | 'pending' }) => {
      const { error } = await supabase
        .from('users_custom')
        .update({ payment_status: newStatus })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status de pagamento atualizado.");
      queryClient.invalidateQueries({ queryKey: ['poolParticipants', activePool?.id] });
    },
    onError: (error: any) => {
      toast.error("Falha ao atualizar status.", { description: error.message });
    },
  });

  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BadgeDollarSign className="text-green-600"/> Gestão de Pagamentos</CardTitle>
        <CardDescription>Marque os participantes que já efetuaram o pagamento para liberar seus palpites.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Participante</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants?.map(participant => (
              <TableRow key={participant.id}>
                <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={participant.avatar_url || ''} />
                            <AvatarFallback>{participant.name.substring(0,1)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{participant.name}</span>
                    </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Label htmlFor={`payment-${participant.id}`} className={participant.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}>
                      {participant.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                    </Label>
                    <Switch
                      id={`payment-${participant.id}`}
                      checked={participant.payment_status === 'paid'}
                      onCheckedChange={(checked) => {
                        const newStatus = checked ? 'paid' : 'pending';
                        updatePaymentStatus.mutate({ userId: participant.id, newStatus });
                      }}
                      disabled={updatePaymentStatus.isPending}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PaymentManagement;