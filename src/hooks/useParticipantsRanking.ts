// src/hooks/useParticipantsRanking.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// --- (Início) ALTERAÇÕES NOS TIPOS ---
// Tipos foram movidos e ajustados para refletir a nova lógica

// Representa o que vem da tabela 'users_custom'
type UserData = {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    total_points: number | null;
    is_admin: boolean;
    created_at: string; // Adicionado para desempate
};

// Representa o objeto final do participante no ranking
export type Participant = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  points: number;
  exactScores: number; // Renomeado de 'matches' para clareza
  correctWinners: number; // Novo campo para desempate
  accuracy: string;
  createdAt: string; // Novo campo para desempate final
};
// --- (Fim) ALTERAÇÕES NOS TIPOS ---


const useParticipantsRanking = () => {
  const { signOut } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // O useCallback foi usado para memorizar a função e evitar recriações desnecessárias
  const fetchRanking = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Buscar todos os usuários e seus dados principais
      const { data: usersData, error: usersError } = await supabase
        .from('users_custom')
        .select('id, name, username, avatar_url, is_admin, total_points, created_at'); // Adicionado created_at
      if (usersError) throw usersError;

      const nonAdminUsers = (usersData as UserData[]).filter(user => !user.is_admin);
      const userIds = nonAdminUsers.map(u => u.id);

      // --- (Início) ALTERAÇÃO NA BUSCA DE DADOS ---
      // 2. Buscar contagens de pontos por tipo para desempate
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_points')
        .select('user_id, points_type')
        .in('user_id', userIds);
      
      if (pointsError) throw pointsError;
      
      // 3. Processar os dados de pontos para criar um mapa de estatísticas
      const userStats: { [userId: string]: { exactScores: number, correctWinners: number, totalPredictions: number } } = {};

      // Inicializa as estatísticas para todos os usuários
      userIds.forEach(id => {
        userStats[id] = { exactScores: 0, correctWinners: 0, totalPredictions: 0 };
      });

      // Preenche com os dados de pontos
      (pointsData || []).forEach(point => {
        const stats = userStats[point.user_id];
        if (stats) {
          stats.totalPredictions += 1; // Cada registro é um palpite em jogo finalizado
          if (point.points_type === 'EXACT_SCORE') {
            stats.exactScores += 1;
            stats.correctWinners += 1; // Acerto exato também é um acerto de vencedor
          } else if (point.points_type === 'CORRECT_WINNER') {
            stats.correctWinners += 1;
          }
        }
      });
      // --- (Fim) ALTERAÇÃO NA BUSCA DE DADOS ---

      // 4. Constrói a lista de participantes para o ranking
      const finalRanking: Participant[] = nonAdminUsers
        .map((user) => {
          const stats = userStats[user.id] || { exactScores: 0, correctWinners: 0, totalPredictions: 0 };
          const accuracy = stats.totalPredictions > 0 ? ((stats.exactScores / stats.totalPredictions) * 100).toFixed(0) : "0";
          return {
            id: user.id,
            name: user.name,
            username: user.username,
            avatar_url: user.avatar_url,
            points: user.total_points || 0,
            exactScores: stats.exactScores,
            correctWinners: stats.correctWinners,
            accuracy: `${accuracy}%`,
            createdAt: user.created_at,
          };
        });

      // --- (Início) NOVA LÓGICA DE ORDENAÇÃO ---
      // 5. Ordena a classificação com os novos critérios de desempate
      finalRanking.sort((a, b) => {
        // Critério 1: Pontos (descendente)
        if (b.points !== a.points) {
          return b.points - a.points;
        }
        // Critério 2: Placares Exatos (descendente)
        if (b.exactScores !== a.exactScores) {
          return b.exactScores - a.exactScores;
        }
        // Critério 3: Vencedores Corretos (descendente)
        if (b.correctWinners !== a.correctWinners) {
            return b.correctWinners - a.correctWinners;
        }
        // Critério 4: Data de Cadastro (ascendente - mais antigo primeiro)
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
      // --- (Fim) NOVA LÓGICA DE ORDENAÇÃO ---

      setParticipants(finalRanking);
      
    } catch (error: any) {
      console.error("Erro ao carregar o ranking:", error);
      setError(error.message);
      if (error?.message?.includes('JWT') || error?.code === 'PGRST301') {
        await signOut();
      }
    } finally {
      setLoading(false);
    }
  }, [signOut]);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  return { participants, loading, error, refetch: fetchRanking }; // Adicionado refetch para poder atualizar
};

export default useParticipantsRanking;