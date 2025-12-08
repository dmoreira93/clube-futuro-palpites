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
import { Calculator, CheckCircle, AlertTriangle, Search, RefreshCw, Trophy, Medal } from "lucide-react";
import { toast } from "sonner";

interface UserOption {
  id: string;
  name: string;
}

interface AuditLog {
  id: string;
  points_earned: number;
  points_type: string;
  description: string;
  created_at: string;
  details: string; // Campo unificado para info do jogo, grupo ou final
}

const AuditoriaPontos = () => {
  const { activePool, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [recalcLoading, setRecalcLoading] = useState(false);

  // 1. Busca participantes do bolão ativo (Query Simplificada)
  useEffect(() => {
    const fetchParticipants = async () => {
      if (!activePool?.id) return;

      try {
        // Correção: Join direto sem alias para evitar erros de tipagem
        const { data, error } = await supabase
          .from("participations")
          .select(`
            user_id,
            users_custom (
              id,
              name
            )
          `)
          .eq("pool_id", activePool.id);

        if (error) throw error;

        // Mapeamento seguro
        const mappedUsers = (data || [])
          .map((p: any) => {
             // O Supabase pode retornar array ou objeto dependendo da relação
             const userData = Array.isArray(p.users_custom) ? p.users_custom[0] : p.users_custom;
             return {
                id: userData?.id,
                name: userData?.name || "Participante Sem Nome"
             };
          })
          .filter(u => u.id)
          .sort((a, b) => a.name.localeCompare(b.name));

        setUsers(mappedUsers);
      } catch (error: any) {
        console.error("Erro ao buscar participantes:", error);
        toast.error("Erro ao carregar lista de participantes.");
      }
    };

    fetchParticipants();
  }, [activePool?.id]);

  // 2. Busca logs (Query Profunda Corrigida)
  const fetchAuditLogs = async (userId: string) => {
    if (!userId || !activePool?.id) return;
    
    setLoading(true);
    try {
      // Correção: Navegação correta entre tabelas:
      // log -> match_prediction -> match -> teams
      const { data, error } = await supabase
        .from("user_points_log")
        .select(`
          *,
          match_prediction:match_predictions (
            match:matches (
                home_team:home_team_id(name),
                away_team:away_team_id(name),
                home_score,
                away_score
            )
          ),
          group_prediction:group_predictions (
             group:groups (name)
          ),
          final_prediction:final_predictions (
             id
          )
        `)
        .eq("pool_id", activePool.id)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedLogs: AuditLog[] = data.map((log: any) => {
        let details = "-";

        // Lógica para extrair detalhes legíveis baseado no tipo
        if (log.match_prediction?.match) {
            const m = log.match_prediction.match;
            details = `Jogo: ${m.home_team?.name} ${m.home_score} x ${m.away_score} ${m.away_team?.name}`;
        } else if (log.group_prediction?.group) {
            details = `Grupo: ${log.group_prediction.group.name}`;
        } else if (log.final_prediction) {
            details = "Palpite Final (Campeão/Pódio)";
        } else if (log.description) {
            // Fallback para usar a descrição se não tiver relação
            details = log.description; 
        }

        return {
            id: log.id,
            points_earned: log.points_earned,
            points_type: log.points_type,
            description: log.description || "Pontuação processada",
            created_at: log.created_at,
            details: details
        };
      });

      setLogs(formattedLogs);
    } catch (error: any) {
      console.error("Erro na auditoria:", error);
      toast.error("Falha ao buscar histórico: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (value: string) => {
    setSelectedUser(value);
    fetchAuditLogs(value);
  };

  const handleRecalculate = async () => {
    if (!selectedUser || !activePool?.id) return;
    
    setRecalcLoading(true);
    try {
        const { error } = await supabase.rpc('recalculate_user_points', { 
            p_pool_id: activePool.id,
            p_user_id: selectedUser 
        });

        if (error) throw error;

        toast.success("Pontuação recalculada com sucesso!");
        fetchAuditLogs(selectedUser); // Refresh
    } catch (error: any) {
        console.error("Erro ao recalcular:", error);
        toast.error("Erro no recálculo: " + error.message);
    } finally {
        setRecalcLoading(false);
    }
  };

  if (!activePool) {
      return (
        <div className="flex justify-center items-center h-[50vh]">
            <Card className="w-full max-w-md text-center p-6 border-dashed">
                <div className="mx-auto bg-gray-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                    <Calculator className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700">Nenhum Bolão Ativo</h3>
                <p className="text-gray-500 mt-2">Selecione um bolão no menu para acessar a auditoria.</p>
            </Card>
        </div>
      );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-bold text-fifa-blue flex items-center gap-2">
                <Calculator className="h-8 w-8 text-fifa-gold" /> Auditoria de Pontos
            </h1>
            <p className="text-gray-500">Extrato detalhado de pontuação por participante.</p>
        </div>
      </div>

      <Card className="mb-8 border-t-4 border-t-fifa-blue shadow-sm">
        <CardHeader className="pb-4">
            <CardTitle className="text-lg">Selecionar Participante</CardTitle>
            <CardDescription>
                Bolão Ativo: <span className="font-bold text-fifa-blue">{activePool.name}</span>
            </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
                <label className="text-sm font-medium mb-1 block text-gray-700">Participante</label>
                <Select value={selectedUser} onValueChange={handleUserChange}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um usuário..." />
                </SelectTrigger>
                <SelectContent>
                    {users.length > 0 ? users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                        {user.name}
                    </SelectItem>
                    )) : <div className="p-2 text-sm text-gray-500 text-center">Nenhum participante encontrado.</div>}
                </SelectContent>
                </Select>
            </div>
            
            {isAdmin && selectedUser && (
                <Button 
                    variant="outline" 
                    onClick={handleRecalculate} 
                    disabled={recalcLoading}
                    className="w-full sm:w-auto border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                >
                    {recalcLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin"/> : <AlertTriangle className="mr-2 h-4 w-4"/>}
                    Recalcular Pontos
                </Button>
            )}
        </CardContent>
      </Card>

      {selectedUser && (
          <Card>
            <CardContent className="p-0">
                {loading ? (
                    <div className="p-12 text-center text-gray-500 animate-pulse">Carregando histórico...</div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center text-gray-400">
                        <Search className="h-12 w-12 mb-2 opacity-20" />
                        <p>Nenhum registro de pontos encontrado para este usuário neste bolão.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50">
                                    <TableHead className="w-[180px]">Data</TableHead>
                                    <TableHead>Evento / Motivo</TableHead>
                                    <TableHead>Detalhes</TableHead>
                                    <TableHead className="text-right">Pontos</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.id} className="hover:bg-gray-50 transition-colors">
                                        <TableCell className="text-xs text-gray-500 font-mono">
                                            {new Date(log.created_at).toLocaleString('pt-BR', { 
                                                day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' 
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-700 capitalize">
                                                    {log.points_type.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {log.details}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-bold px-3">
                                                +{log.points_earned}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
          </Card>
      )}
    </div>
  );
};

export default AuditoriaPontos;