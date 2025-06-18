// src/components/home/PublicPoolCard.tsx

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Adicionado o ícone de cadeado para o botão desabilitado
import { Tag, Users, Calendar, Trophy, ArrowRight, Lock } from "lucide-react";
import { Link } from "react-router-dom";

// Interface (sem alterações)
export interface PublicPool {
  id: string;
  name: string;
  entry_fee: number;
  prediction_deadline: string | null;
  invite_code: string;
  championship: { name: string } | null;
  participant_count: number;
  max_participants: number | null;
}

interface PublicPoolCardProps {
  pool: PublicPool;
}

export const PublicPoolCard = ({ pool }: PublicPoolCardProps) => {
  // Formatações (sem alterações)
  const deadline = pool.prediction_deadline
    ? new Date(pool.prediction_deadline).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    : 'Não definida';

  const vagas = pool.max_participants 
    ? `${pool.participant_count}/${pool.max_participants}` 
    : `${pool.participant_count}`;

  const entryFeeFormatted = (pool.entry_fee || 0).toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  });

  // *** LÓGICA DE VERIFICAÇÃO ADICIONADA AQUI ***
  // Verifica se o bolão está cheio.
  // A condição é: o bolão tem um limite máximo E o número de participantes é maior ou igual a esse limite.
  const isFull = pool.max_participants !== null && pool.participant_count >= pool.max_participants;

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
        {/* *** BOTÃO COM LÓGICA CONDICIONAL *** */}
        {isFull ? (
          // Se o bolão estiver cheio, renderiza um botão desabilitado
          <Button className="w-full" disabled>
            <Lock className="h-4 w-4 mr-2" />
            Sem vagas disponíveis
          </Button>
        ) : (
          // Caso contrário, renderiza o link com o botão de participar
          <Link to={`/cadastro/${pool.invite_code}`} className="w-full">
            <Button className="w-full bg-fifa-green hover:bg-green-700">
              Participar deste Bolão
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
};