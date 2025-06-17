// src/components/home/PublicPoolCard.tsx

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tag, Users, Calendar, Trophy, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

// Adicionamos os novos campos que virão do banco
export interface PublicPool {
  id: string;
  name: string;
  entry_fee: number;
  prediction_deadline: string | null;
  championship: { name: string } | null; // Assumindo que o campeonato virá aninhado
  participant_count: number;
  max_participants: number | null;
}

interface PublicPoolCardProps {
  pool: PublicPool;
}

export const PublicPoolCard = ({ pool }: PublicPoolCardProps) => {
  const deadline = pool.prediction_deadline
    ? new Date(pool.prediction_deadline).toLocaleDateString('pt-BR')
    : 'Não definida';

  const vagas = pool.max_participants ? `<span class="math-inline">\{pool\.participant\_count\}/</span>{pool.max_participants}` : `${pool.participant_count}`;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{pool.name}</CardTitle>
        <CardDescription className="flex items-center gap-2 pt-1">
          <Trophy className="h-4 w-4 text-yellow-500" /> {pool.championship?.name || 'Campeonato não definido'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <div className="flex items-center text-sm">
          <Tag className="h-4 w-4 mr-2" />
          <span className="font-semibold">Inscrição:</span>
          <span className="ml-auto">{pool.entry_fee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </div>
        <div className="flex items-center text-sm">
          <Users className="h-4 w-4 mr-2" />
          <span className="font-semibold">Participantes:</span>
          <span className="ml-auto">{vagas}</span>
        </div>
        <div className="flex items-center text-sm">
          <Calendar className="h-4 w-4 mr-2" />
          <span className="font-semibold">Prazo Palpites:</span>
          <span className="ml-auto">{deadline}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Link to={`/cadastro/${pool.id}`} className="w-full">
          <Button className="w-full">
            Participar
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};