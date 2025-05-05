
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy as TrophyIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

type Participant = {
  id: string;
  name: string;
  nickname: string;
  points: number;
  matches: number;
  accuracy: string;
};

const RankingTable = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParticipants = async () => {
      setLoading(true);
      try {
        // Buscar usuários com suas estatísticas
        const { data, error } = await supabase
          .from('users')
          .select('id, name');
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Buscar estatísticas para cada usuário
          const usersWithStats = await Promise.all(
            data.map(async (user) => {
              const { data: statsData, error: statsError } = await supabase
                .from('user_stats')
                .select('total_points, matches_played, accuracy_percentage')
                .eq('user_id', user.id)
                .single();
                
              if (statsError && statsError.code !== 'PGRST116') {
                console.error(`Erro ao buscar estatísticas para usuário ${user.id}:`, statsError);
              }

              return {
                id: user.id,
                name: user.name,
                nickname: user.name.split(' ')[0],
                points: statsData?.total_points || 0,
                matches: statsData?.matches_played || 0,
                accuracy: statsData ? `${statsData.accuracy_percentage || 0}%` : "0%"
              };
            })
          );
          
          // Ordenar por pontos (do maior para o menor)
          const sortedData = usersWithStats.sort((a, b) => b.points - a.points);
          setParticipants(sortedData);
        } else {
          // Usar dados de amostra se não houver dados reais
          setParticipants([
            { id: "1", name: "Carlos Silva", nickname: "Carlão", points: 145, matches: 12, accuracy: "80%" },
            { id: "2", name: "Ana Souza", nickname: "Ana Gol", points: 132, matches: 12, accuracy: "75%" },
            { id: "3", name: "Pedro Santos", nickname: "Pedrinho", points: 120, matches: 12, accuracy: "65%" },
            { id: "4", name: "Mariana Lima", nickname: "Mari", points: 118, matches: 12, accuracy: "63%" },
            { id: "5", name: "João Ferreira", nickname: "JF", points: 105, matches: 12, accuracy: "58%" },
          ]);
        }
      } catch (error) {
        console.error('Erro ao carregar ranking:', error);
        // Usar dados de amostra em caso de erro
        setParticipants([
          { id: "1", name: "Carlos Silva", nickname: "Carlão", points: 145, matches: 12, accuracy: "80%" },
          { id: "2", name: "Ana Souza", nickname: "Ana Gol", points: 132, matches: 12, accuracy: "75%" },
          { id: "3", name: "Pedro Santos", nickname: "Pedrinho", points: 120, matches: 12, accuracy: "65%" },
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchParticipants();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-fifa-blue text-white p-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrophyIcon className="h-5 w-5 text-fifa-gold" />
            Carregando Ranking...
          </h2>
        </div>
        <div className="p-4">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-fifa-blue text-white p-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TrophyIcon className="h-5 w-5 text-fifa-gold" />
          Ranking de Participantes
        </h2>
      </div>
      
      <Table>
        <TableCaption>Classificação atualizada dos participantes</TableCaption>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-12 text-center">Pos.</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Apelido</TableHead>
            <TableHead className="text-right">Pontos</TableHead>
            <TableHead className="text-right">Jogos</TableHead>
            <TableHead className="text-right">Aproveitamento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participants.map((participant, index) => (
            <TableRow key={participant.id} className={index < 3 ? "bg-yellow-50" : ""}>
              <TableCell className="font-medium text-center">
                {index === 0 ? (
                  <span className="inline-flex items-center justify-center bg-fifa-gold text-white rounded-full w-6 h-6 text-xs font-bold">1</span>
                ) : index === 1 ? (
                  <span className="inline-flex items-center justify-center bg-gray-300 text-gray-800 rounded-full w-6 h-6 text-xs font-bold">2</span>
                ) : index === 2 ? (
                  <span className="inline-flex items-center justify-center bg-amber-700 text-white rounded-full w-6 h-6 text-xs font-bold">3</span>
                ) : (
                  index + 1
                )}
              </TableCell>
              <TableCell className="font-medium">{participant.name}</TableCell>
              <TableCell>{participant.nickname}</TableCell>
              <TableCell className="text-right font-bold">{participant.points}</TableCell>
              <TableCell className="text-right">{participant.matches}</TableCell>
              <TableCell className="text-right">{participant.accuracy}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RankingTable;
