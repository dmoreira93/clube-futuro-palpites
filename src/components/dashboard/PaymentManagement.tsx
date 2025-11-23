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
            // CORREÇÃO: Removemos o pedido do campo 'email', que não existe em users_custom
            // e simplificamos a query para evitar erros de join
            const { data, error } = await supabase
                .from('participations')
                .select(`
                    user_id,
                    payment_status,
                    users_custom ( name )
                `)
                .eq('pool_id', pool.id);

            if (error) throw error;

            const formattedData = (data || []).map((item: any) => ({
                user_id: item.user_id,
                name: item.users_custom?.name || 'Participante',
                payment_status: item.payment_status || 'pending',
            }));

            setParticipants(formattedData);
        } catch (err: any) {
            console.error("Erro ao buscar pagamentos:", err);
            setError("Não foi possível carregar a lista.");
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

            toast.success(`Pagamento ${newStatus === 'paid' ? 'confirmado' : 'revogado'}!`);
            // Atualização otimista da UI
            setParticipants(prev => prev.map(p => 
                p.user_id === userId ? { ...p, payment_status: newStatus } : p
            ));
        } catch (err: any) {
            toast.error("Erro ao atualizar.", { description: err.message });
        }
    };

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin text-fifa-blue" /></div>;

    if (error) return null; // Se der erro, apenas não mostra o componente para não sujar a tela

    return (
        <Card className="shadow-md">
            <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/50">
                <CardTitle className="text-lg flex items-center gap-2 text-fifa-blue">
                    <DollarSign className="h-5 w-5 text-green-600" /> Gestão Financeira
                </CardTitle>
                <CardDescription>Controle quem já pagou a inscrição.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {participants.length === 0 ? (
                        <p className="text-center text-gray-500 py-4 text-sm">Nenhum participante encontrado.</p>
                    ) : (
                        participants.map(p => (
                            <div key={p.user_id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                <span className="font-medium text-sm text-gray-700 truncate max-w-[150px]">{p.name}</span>
                                <div className="flex items-center gap-2">
                                    <Badge variant={p.payment_status === 'paid' ? 'default' : 'outline'} className={p.payment_status === 'paid' ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' : 'text-yellow-700 border-yellow-300 bg-yellow-50'}>
                                        {p.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                                    </Badge>
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 rounded-full hover:bg-gray-100"
                                        onClick={() => handleConfirmPayment(p.user_id, p.payment_status)}
                                        title={p.payment_status === 'paid' ? "Revogar" : "Confirmar"}
                                    >
                                        {p.payment_status === 'paid' ? <XCircle className="h-4 w-4 text-red-400" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
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