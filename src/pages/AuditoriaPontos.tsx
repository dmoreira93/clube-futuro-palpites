import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calculator, CheckCircle, AlertTriangle, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface UserOption {
  id: string;
  name: string;
}

interface AuditLog {
  id: string;
  match_id: string | null;
  points_earned: number;
  points_type: string;
  description: string;
  created_at: string;
  match_info?: string;
}

const AuditoriaPontos = () => {
  const { activePool, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [recalcLoading, setRecalcLoading] = useState(false);

  // 1. Busca participantes do bolão ativo
  useEffect(() => {
    const fetchParticipants = async () => {
      if (!activePool?.id) return;

      try {
        const { data, error } = await supabase
          .from("participations")
          .select(`
            user:users_custom (
              id,
              name
            )
          `)
          .eq("pool_id", activePool.id)
          .order("joined_at", { ascending: true }); // Ou order por nome se preferir

        if (error) throw error;

        // Mapeia e remove possíveis nulos
        const mappedUsers = (data || [])
          .map((p: any) => ({
            id: p.user?.id,
            name: p.user?.name || "Sem Nome"
          }))
          .filter(u => u.id); // Garante que tem ID

        setUsers(mappedUsers);
      } catch (error) {
        console.error("Erro ao buscar participantes:", error);
        toast.error("Erro ao carregar lista de participantes.");
      }
    };

    fetchParticipants();
  }, [activePool?.id]);

  // 2. Busca logs quando um usuário é selecionado
  const fetchAuditLogs = async (userId: string) => {
    if (!userId || !activePool?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_points_log")
        .select(`
          *,
          match:matches(
            home_team:home_team_id(name),
            away_team:away_team_id(name)
          )
        `)
        .eq("pool_id", activePool.id)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedLogs = data.map((log: any) => ({
        ...log,
        match_info: log.match 
          ? `${log.match.home_team?.name} x ${log.match.away_team?.name}`
          : "N/A"
      }));

      setLogs(formattedLogs);
    } catch (error) {
      console.error("Erro na auditoria:", error);
      toast.error("Falha ao buscar histórico de pontos.");
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (value: string) => {
    setSelectedUser(value);
    fetchAuditLogs(value);
  };

  // Função administrativa para forçar recálculo (útil para correção)
  const handleRecalculate = async () => {
    if (!selectedUser || !activePool?.id) return;
    
    setRecalcLoading(true);
    try {
        // Chama a RPC que você criou anteriormente
        const { error } = await supabase.rpc('recalculate_user_points', { 
            p_pool_id: activePool.id,
            p_user_id: selectedUser 
        });

        if (error) throw error;

        toast.success("Pontuação recalculada com sucesso!");
        fetchAuditLogs(selectedUser); // Atualiza a lista
    } catch (error: any) {
        console.error("Erro ao recalcular:", error);
        toast.error("Erro no recálculo: " + error.message);
    } finally {
        setRecalcLoading(false);
    }
  };

  if (!activePool) {
      return (
        <div className="p-8 text-center text-gray-500">
            Selecione um bolão para auditar.
        </div>
      );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-fifa-blue flex items-center gap-2">
                <Calculator className="h-8 w-8 text-fifa-gold" /> Auditoria de Pontos
            </h1>
            <p className="text-gray-500">Verifique o histórico detalhado de pontuação por participante.</p>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
            <CardTitle>Selecione o Participante</CardTitle>
            <CardDescription>Escolha um usuário do bolão <strong>{activePool.name}</strong> para ver o extrato.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
                <Select value={selectedUser} onValueChange={handleUserChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Buscar participante..." />
                </SelectTrigger>
                <SelectContent>
                    {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                        {user.name}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
            {isAdmin && selectedUser && (
                <Button 
                    variant="outline" 
                    onClick={handleRecalculate} 
                    disabled={recalcLoading}
                    className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                >
                    {recalcLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin"/> : <AlertTriangle className="mr-2 h-4 w-4"/>}
                    Forçar Recálculo
                </Button>
            )}
        </CardContent>
      </Card>

      {selectedUser && (
          <Card>
            <CardContent className="p-0">
                {loading ? (
                    <div className="p-8 text-center">Carregando dados...</div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center text-gray-400">
                        <Search className="h-12 w-12 mb-2 opacity-20" />
                        <p>Nenhum registro de pontos encontrado para este usuário.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                                <TableHead>Data</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Detalhe (Jogo)</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead className="text-right">Pontos</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="text-xs text-gray-500">
                                        {new Date(log.created_at).toLocaleString('pt-BR')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {log.points_type.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {log.match_info !== "N/A" ? log.match_info : "-"}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600 max-w-md truncate" title={log.description}>
                                        {log.description}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-green-600">
                                        +{log.points_earned}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
          </Card>
      )}
    </div>
  );
};

export default AuditoriaPontos;