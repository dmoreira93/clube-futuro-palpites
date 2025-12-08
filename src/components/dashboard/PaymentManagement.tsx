import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext'; // Importar useAuth
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, XCircle, DollarSign, Loader2, Search, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface PaymentParticipant {
    user_id: string;
    name: string;
    payment_status: 'paid' | 'pending';
    username?: string;
}

interface PaymentManagementProps {
    poolId: string;
}

const PaymentManagement = ({ poolId }: PaymentManagementProps) => {
    const { user } = useAuth(); // Pegar o usuário logado para comparar
    const [participants, setParticipants] = useState<PaymentParticipant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (poolId) {
            fetchParticipants();
        }
    }, [poolId]);

    const fetchParticipants = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('participations')
                .select(`
                    user_id,
                    payment_status,
                    users_custom ( name, username )
                `)
                .eq('pool_id', poolId);

            if (error) throw error;

            const formattedData = (data || []).map((item: any) => ({
                user_id: item.user_id,
                name: item.users_custom?.name || 'Participante',
                username: item.users_custom?.username || '',
                payment_status: item.payment_status || 'pending',
            }));

            // Ordena: Pendentes primeiro
            formattedData.sort((a, b) => {
                if (a.payment_status === b.payment_status) return a.name.localeCompare(b.name);
                return a.payment_status === 'pending' ? -1 : 1;
            });

            setParticipants(formattedData);
        } catch (err: any) {
            console.error("Erro ao buscar pagamentos:", err);
            toast.error("Erro ao carregar lista financeira.");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmPayment = async (userId: string, currentStatus: string) => {
        // Bloqueio de segurança: Não permitir alterar o próprio status se for o dono
        if (userId === user?.id) {
            toast.info("Você é o dono do bolão. Seu pagamento é automático.");
            return;
        }

        const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
        try {
            const { error } = await supabase
                .from('participations')
                .update({ payment_status: newStatus })
                .eq('pool_id', poolId)
                .eq('user_id', userId);

            if (error) throw error;

            toast.success(newStatus === 'paid' ? "Pagamento confirmado!" : "Pagamento marcado como pendente.");
            
            setParticipants(prev => prev.map(p => 
                p.user_id === userId ? { ...p, payment_status: newStatus } : p
            ));
        } catch (err: any) {
            toast.error("Erro ao atualizar status.", { description: err.message });
        }
    };

    const filteredParticipants = participants.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.username && p.username.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return (
        <Card className="shadow-md mb-6 border-blue-100">
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-fifa-blue h-8 w-8" /></div>
        </Card>
    );

    return (
        <Card className="shadow-md mb-6 border-l-4 border-l-green-500">
            <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/50">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2 text-fifa-blue">
                            <DollarSign className="h-5 w-5 text-green-600" /> Gestão Financeira
                        </CardTitle>
                        <CardDescription>Controle quem já pagou para liberar os palpites.</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-white">
                        {participants.filter(p => p.payment_status === 'paid').length}/{participants.length} Pagos
                    </Badge>
                </div>
                <div className="mt-2 relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input 
                        placeholder="Buscar participante..." 
                        className="pl-8 h-9 text-sm" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent className="pt-0 max-h-[350px] overflow-y-auto scrollbar-thin">
                <div className="divide-y divide-gray-100">
                    {filteredParticipants.length === 0 ? (
                        <p className="text-center text-gray-500 py-6 text-sm">Nenhum participante encontrado.</p>
                    ) : (
                        filteredParticipants.map(p => {
                            const isMe = p.user_id === user?.id;
                            return (
                                <div key={p.user_id} className={`flex items-center justify-between py-3 hover:bg-gray-50 px-2 transition-colors -mx-2 rounded-md ${isMe ? 'bg-blue-50/50' : ''}`}>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm text-gray-800">{p.name}</span>
                                            {isMe && <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-blue-100 text-blue-700">Você</Badge>}
                                        </div>
                                        {p.username && <span className="text-xs text-gray-400">@{p.username}</span>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant={p.payment_status === 'paid' ? 'default' : 'outline'} className={p.payment_status === 'paid' ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200 shadow-none' : 'text-yellow-700 border-yellow-300 bg-yellow-50'}>
                                            {p.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                                        </Badge>
                                        
                                        {/* Botão desabilitado se for o próprio dono */}
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            disabled={isMe}
                                            className={`h-8 w-8 rounded-full ${isMe ? 'opacity-30' : p.payment_status === 'paid' ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-green-50 hover:text-green-600'}`}
                                            onClick={() => handleConfirmPayment(p.user_id, p.payment_status)}
                                            title={isMe ? "Dono é isento" : (p.payment_status === 'paid' ? "Revogar Pagamento" : "Confirmar Pagamento")}
                                        >
                                            {isMe ? <ShieldCheck className="h-5 w-5 text-blue-500"/> : (p.payment_status === 'paid' ? <XCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />)}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default PaymentManagement;