// src/pages/AuditoriaPontos.tsx
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calculator, Search, RefreshCw, AlertTriangle, FileSearch, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  event_name: string;
  prediction_text: string;
  official_result: string;
  user_name?: string; // Adicionado para identificar quando listar "Todos"
}

const AuditoriaPontos = () => {
  const { activePool, isAdmin, user } = useAuth();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("all"); // "all" por padrão para listar todos
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [recalcLoading, setRecalcLoading] = useState(false);

  const fetchAuditLogs = useCallback(async (userId: string) => {
    if (!activePool?.id) return;
    
    setLoading(true);
    try {
      // Monta a query base trazendo também os dados do usuário para auditorias globais
      let query = supabase
        .from("user_points_log")
        .select(`
          id, points_earned, points_type, description, created_at, user_id,
          users_custom (
            name
          ),
          match_prediction:match_predictions (
            home_score, away_score,
            match:matches (
              home_score, away_score,
              home_team:teams!home_team_id(name),
              away_team:teams!away_team_id(name)
            )
          ),
          group_prediction:group_predictions (
            group:groups(name)
          )
        `)
        .or(`pool_id.eq.${activePool.id},pool_id.is.null`);

      // Se não for "all", aplica o filtro para o usuário específico selecionado
      if (userId !== "all" && userId !== "") {
        query = query.eq("user_id", userId);
      } else {
        // Se for "all", traz apenas os usuários vinculados a esse bolão ativo
        // Para isso, faremos uma subquery indireta ou filtramos em memória para blindar o escopo do bolão
        const { data: participationIds } = await supabase
          .from("participations")
          .select("user_id")
          .eq("pool_id", activePool.id);
          
        const allowedUserIds = participationIds?.map(p => p.user_id) || [];
        if (allowedUserIds.length > 0) {
          query = query.in("user_id", allowedUserIds);
        }
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      const formattedLogs: AuditLog[] = (data || []).map((log: any) => {
        let eventName = "Processamento de Sistema";
        let predictionText = "-";
        let officialResult = "-";

        // Se for ponto de Partida (Match)
        if (log.match_prediction?.match) {
          const mp = log.match_prediction;
          const m = mp.match;
          const home = m.home_team?.name || 'Casa';
          const away = m.away_team?.name || 'Fora';

          eventName = `Jogo: ${home} x ${away}`;
          predictionText = `${mp.home_score} x ${mp.away_score}`;
          officialResult = m.home_score !== null ? `${m.home_score} x ${m.away_score}` : 'Aguardando';
        } 
        // Se for ponto de Grupo
        else if (log.group_prediction?.group) {
          eventName = `Fase de Grupos: ${log.group_prediction.group.name}`;
          predictionText = "Palpite em Grupos";
          officialResult = "Classificação Oficial";
        } 
        // Se for Final/Outros
        else if (log.points_type?.includes('final') || log.points_type?.includes('champion')) {
          eventName = "Mata-Mata / Finais";
          predictionText = "Palpite em Simulador";
          officialResult = "Chaveamento Oficial";
        }

        // Resolve o nome do usuário de forma segura
        const uName = log.users_custom?.name || "Participante";

        return {
          id: log.id,
          points_earned: log.points_earned,
          points_type: log.points_type,
          description: log.description || "Pontuação processada",
          created_at: log.created_at,
          event_name: eventName,
          prediction_text: predictionText,
          official_result: officialResult,
          user_name: uName
        };
      });

      setLogs(formattedLogs);
    } catch (error: any) {
      console.error("Erro na auditoria:", error);
      toast.error("Falha ao buscar histórico: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [activePool?.id]);

  useEffect(() => {
    const fetchParticipants = async () => {
      if (!activePool?.id) return;

      try {
        // Traz as participações e os dados do usuário de forma limpa e direta
        const { data, error } = await supabase
          .from("participations")
          .select(`
            user_id,
            users_custom:user_id (
              id,
              name,
              is_ai,
              is_admin
            )
          `)
          .eq("pool_id", activePool.id);

        if (error) throw error;

        const mappedUsers = (data || [])
          .map((p: any) => {
            const userData = p.users_custom;
            return {
              id: userData?.id,
              name: userData?.name || "Participante Sem Nome",
              is_ai: userData?.is_ai || false,
              is_admin: userData?.is_admin || false
            };
          })
          // Filtra para remover robôs e administradores puristas da listagem geral de palpites reais
          .filter(u => u.id && !u.is_ai)
          .sort((a, b) => a.name.localeCompare(b.name));

        setUsers(mappedUsers);

        // Define "Todos" por padrão ao carregar a página
        setSelectedUser("all");
        fetchAuditLogs("all");

      } catch (error: any) {
        console.error("Erro ao buscar participantes:", error);
        toast.error("Erro ao carregar lista de participantes.");
      }
    };

    fetchParticipants();
  }, [activePool?.id, fetchAuditLogs]);

  const handleUserChange = (value: string) => {
    setSelectedUser(value);
    fetchAuditLogs(value);
  };

  const handleRecalculate = async () => {
    if (!selectedUser || !activePool?.id) return;
    
    setRecalcLoading(true);
    try {
        // Se estiver em "Todos", não permitimos o RPC genérico sem id (ou enviamos o do usuário atual logado como segurança)
        const targetUserId = selectedUser === "all" ? user?.id : selectedUser;
        
        if (!targetUserId) return;

        const { error } = await supabase.rpc('recalculate_user_points', { 
            p_pool_id: activePool.id,
            p_user_id: targetUserId 
        });

        if (error) throw error;

        toast.success("Pontuação recalculada com sucesso!");
        fetchAuditLogs(selectedUser);
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
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
            <FileSearch className="h-8 w-8 text-amber-500" /> Auditoria de Pontos (VAR)
          </h1>
          <p className="text-gray-500 mt-1">
            Extrato detalhado e transparente das pontuações do bolão <strong className="text-blue-900">{activePool.name}</strong>.
          </p>
        </div>
      </div>

      <Card className="mb-8 border-t-4 border-t-blue-900 shadow-sm">
        <CardHeader className="pb-4 bg-gray-50/50">
          <CardTitle className="text-lg flex items-center gap-2 font-medium text-gray-700">
            <Search className="h-5 w-5 text-gray-500" /> Filtrar Registros do Extrato
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-end pt-4">
          <div className="flex-1 w-full">
            <label className="text-sm font-medium mb-1 block text-gray-700">Visualizando extrato de:</label>
            <Select value={selectedUser} onValueChange={handleUserChange}>
              <SelectTrigger className="w-full h-12 text-base">
                <SelectValue placeholder="Selecione um usuário..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="cursor-pointer font-semibold text-blue-950">
                  🌍 TODOS OS PARTICIPANTES
                </SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id} className="cursor-pointer">
                    {u.name} {u.id === user?.id ? " (Você)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {isAdmin && selectedUser !== "all" && (
            <Button 
              variant="outline" 
              onClick={handleRecalculate} 
              disabled={recalcLoading}
              className="w-full sm:w-auto h-12 border-amber-500 text-amber-700 hover:bg-amber-50"
            >
              {recalcLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin"/> : <ShieldCheck className="mr-2 h-5 w-5"/>}
              Forçar Recálculo
            </Button>
          )}
        </CardContent>
      </Card>

      {selectedUser && (
        <Card className="shadow-md overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center text-gray-500">
                <RefreshCw className="h-8 w-8 animate-spin mb-4 text-blue-900" />
                <p className="font-medium">Consultando os dados no VAR...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center text-gray-400 bg-gray-50/30">
                <AlertTriangle className="h-12 w-12 mb-3 text-amber-500/70" />
                <p className="text-lg font-medium text-gray-500">Nenhum ponto computado encontrado.</p>
                <p className="text-sm mt-1">Os logs aparecem aqui à medida que os resultados oficiais entram no sistema.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100 hover:bg-gray-100">
                      <TableHead className="w-[140px] font-bold text-gray-700">Data/Hora</TableHead>
                      {selectedUser === "all" && (
                        <TableHead className="font-bold text-gray-700">Participante</TableHead>
                      )}
                      <TableHead className="font-bold text-gray-700">Evento / Partida</TableHead>
                      <TableHead className="text-center font-bold text-gray-700">Palpite</TableHead>
                      <TableHead className="text-center font-bold text-gray-700">Placar Oficial</TableHead>
                      <TableHead className="text-right font-bold text-gray-700">Pontos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-blue-50/40 transition-colors">
                        <TableCell className="text-xs text-gray-500 font-mono whitespace-nowrap">
                          {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        
                        {selectedUser === "all" && (
                          <TableCell className="font-medium text-blue-950">
                            {log.user_name}
                          </TableCell>
                        )}
                        
                        <TableCell>
                          <div className="font-semibold text-gray-800">{log.event_name}</div>
                          <div className="text-[10px] text-gray-400 uppercase mt-0.5 font-bold tracking-wider">
                            Motivo: {log.description}
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-white text-gray-700 border-gray-300 font-mono text-sm px-2.5 py-0.5">
                            {log.prediction_text}
                          </Badge>
                        </TableCell>
                        
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600 font-mono text-sm px-2.5 py-0.5">
                            {log.official_result}
                          </Badge>
                        </TableCell>
                        
                        <TableCell className="text-right">
                          <Badge 
                            variant="default" 
                            className={`font-bold px-2.5 py-0.5 text-sm ${log.points_earned > 0 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}
                          >
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