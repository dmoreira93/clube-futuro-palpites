import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, XCircle, DollarSign, Loader2, AlertCircle } from 'lucide-react';

interface PaymentParticipant {
    user_id: string;
    name: string;
    email: string;
    payment_status: 'paid' | 'pending';
}

const PaymentManagement = () => {
    const { pool } = useAuth();
    const [participants, setParticipants] = useState<PaymentParticipant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (pool?.id) {
            fetchParticipants();
        }
    }, [pool?.id]);

    const fetchParticipants = async () => {
        if (!pool?.id) return;
        setLoading(true);
        setError(null);
        try {
            // 1. Busca as participações
            const { data: participations, error: partError } = await supabase
                .from('participations')
                .select('user_id, payment_status')
                .eq('pool_id', pool.id);

            if (partError) throw partError;

            if (!participations || participations.length === 0) {
                setParticipants([]);
                return;
            }

            // 2. Busca os detalhes dos usuários (nomes)
            const userIds = participations.map(p => p.user_id);
            const { data: users, error: usersError } = await supabase
                .from('users_custom')
                .select('id, name, email') // Certifique-se que 'email' existe em users_custom, senão remova
                .in('id', userIds);

            if (usersError) throw usersError;

            // 3. Combina os dados
            const combinedData: PaymentParticipant[] = participations.map(p => {
                const user = users?.find(u => u.id === p.user_id);
                return {
                    user_id: p.user_id,
                    name: user?.name || 'Usuário Desconhecido',
                    email: (user as any)?.email || '', // Cast para any se email não estiver no tipo
                    payment_status: p.payment_status || 'pending'
                };
            });

            setParticipants(combinedData);

        } catch (err: any) {
            console.error("Erro ao buscar pagamentos:", err);
            // Não define erro global para não quebrar a UI inteira, apenas loga
            // setError("Não foi possível carregar a lista de pagamentos."); 
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmPayment = async (userId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
        try {
            const { error } = await supabase
                .from('participations')
                .update({ payment_status: newStatus })
                .eq('pool_id', pool?.id)
                .eq('user_id', userId);

            if (error) throw error;

            toast.success(`Pagamento ${newStatus === 'paid' ? 'confirmado' : 'revogado'} com sucesso!`);
            // Atualiza localmente para ser mais rápido
            setParticipants(prev => prev.map(p => 
                p.user_id === userId ? { ...p, payment_status: newStatus } : p
            ));
        } catch (err: any) {
            toast.error("Erro ao atualizar pagamento.", { description: err.message });
        }
    };

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin text-fifa-blue" /></div>;

    // Se houve erro, mostra um card de aviso mas não quebra
    if (error) return (
        <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
            </CardContent>
        </Card>
    );

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-fifa-blue">
                    <DollarSign className="h-5 w-5 text-green-600" /> Gestão Financeira
                </CardTitle>
                <CardDescription>Confirme o pagamento da taxa de inscrição.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {participants.length === 0 ? (
                        <p className="text-center text-gray-500 py-4 text-sm">Nenhum participante encontrado.</p>
                    ) : (
                        participants.map(p => (
                            <div key={p.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="overflow-hidden">
                                    <p className="font-medium text-sm text-gray-800 truncate">{p.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{p.email}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant={p.payment_status === 'paid' ? 'default' : 'outline'} className={p.payment_status === 'paid' ? 'bg-green-600 hover:bg-green-700' : 'text-yellow-600 border-yellow-300 bg-yellow-50'}>
                                        {p.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                                    </Badge>
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8"
                                        onClick={() => handleConfirmPayment(p.user_id, p.payment_status)}
                                        title={p.payment_status === 'paid' ? "Revogar Pagamento" : "Confirmar Pagamento"}
                                    >
                                        {p.payment_status === 'paid' ? <XCircle className="h-4 w-4 text-red-400 hover:text-red-600" /> : <CheckCircle className="h-4 w-4 text-green-400 hover:text-green-600" />}
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default PaymentManagement;