// src/components/home/PublicPoolCard.tsx

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tag, Users, Calendar, Trophy, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

// A interface define a "forma" dos dados que o nosso card espera receber.
// Ela corresponde exatamente ao que a função get_public_pools() do Supabase retorna.
export interface PublicPool {
  id: string;
  name: string;
  entry_fee: number;
  prediction_deadline: string | null;
  invite_code: string; // Usado para o link de convite
  championship: { name: string } | null;
  participant_count: number;
  max_participants: number | null;
}

interface PublicPoolCardProps {
  pool: PublicPool;
}

export const PublicPoolCard = ({ pool }: PublicPoolCardProps) => {
  // Formata a data para um formato amigável (dd/mm/aaaa) ou exibe um texto padrão.
  const deadline = pool.prediction_deadline
    ? new Date(pool.prediction_deadline).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    : 'Não definida';

  // Cria a string de participantes, por ex: "15/100" ou apenas "15" se não houver limite.
  const vagas = pool.max_participants 
    ? `${pool.participant_count}/${pool.max_participants}` 
    : `${pool.participant_count}`;

  // Formata o valor da inscrição para o formato de moeda Real (R$).
  const entryFeeFormatted = (pool.entry_fee || 0).toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  });

  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl">{pool.name}</CardTitle>
        <CardDescription className="flex items-center gap-2 pt-1 text-base">
          <Trophy className="h-4 w-4 text-yellow-500" /> 
          {pool.championship?.name || 'Campeonato Geral'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <div className="flex items-center text-sm">
          <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="font-semibold">Inscrição:</span>
          <span className="ml-auto font-mono">{entryFeeFormatted}</span>
        </div>
        <div className="flex items-center text-sm">
          <Users className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="font-semibold">Participantes:</span>
          <span className="ml-auto font-mono">{vagas}</span>
        </div>
        <div className="flex items-center text-sm">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="font-semibold">Prazo Palpites:</span>
          <span className="ml-auto font-mono">{deadline}</span>
        </div>
      </CardContent>
      <CardFooter>
        {/* O link de cadastro usa o 'invite_code' para direcionar o novo usuário ao bolão correto. */}
        <Link to={`/cadastro/${pool.invite_code}`} className="w-full">
          <Button className="w-full bg-fifa-green hover:bg-green-700">
            Participar deste Bolão
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};