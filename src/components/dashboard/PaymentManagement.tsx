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
    email: string; // Adicionado para facilitar identificação
    payment_status: 'paid' | 'pending';
    payment_confirmed_at?: string;
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
            // Busca participantes e seus status de pagamento
            // Nota: Ajuste a query conforme a estrutura real da sua tabela. 
            // Estou assumindo que 'payment_status' está em 'participations' ou 'users_custom'
            // Se não estiver, você precisará criar essa coluna ou tabela.
            
            // Exemplo assumindo que está na tabela de relação participations (RECOMENDADO)
            const { data, error } = await supabase
                .from('participations')
                .select(`
                    user_id,
                    payment_status,
                    users_custom ( name, email )
                `)
                .eq('pool_id', pool.id);

            if (error) throw error;

            // Mapeia os dados para o formato da interface, tratando possíveis nulos
            const formattedData = data.map((item: any) => ({
                user_id: item.user_id,
                name: item.users_custom?.name || 'Usuário Desconhecido',
                email: item.users_custom?.email || '',
                payment_status: item.payment_status || 'pending',
            }));

            setParticipants(formattedData);
        } catch (err: any) {
            console.error("Erro ao buscar pagamentos:", err);
            setError("Não foi possível carregar a lista de pagamentos.");
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
            fetchParticipants(); // Recarrega a lista
        } catch (err: any) {
            toast.error("Erro ao atualizar pagamento.", { description: err.message });
        }
    };

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin text-fifa-blue" /></div>;

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
                <CardDescription>Confirme o pagamento da taxa de inscrição dos participantes.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
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