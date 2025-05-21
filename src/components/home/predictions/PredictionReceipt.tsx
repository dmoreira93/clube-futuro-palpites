// src/components/predictions/PredictionReceipt.tsx
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale'; // Para formatação de data em português

// Certifique-se de que estes tipos estão corretos de acordo com seus arquivos
import { Match } from '@/types/matches';
import { UserType } from '@/contexts/AuthContext';

// --- Tipos de Dados ---
// Assumindo que MatchType tem a estrutura de uma partida, incluindo os times.
// Ajuste se o seu tipo Match for diferente.
// Exemplo de como seu tipo Match pode ser em '@/types/matches.ts':
/*
export type Team = {
  id: string;
  name: string;
  // ... outras propriedades do time
};

export type Match = {
  id: string;
  match_date: string; // ou Date
  stage: string;
  home_team_id: string;
  away_team_id: string;
  home_team?: Team; // Adicione '?' se for opcional, ou garanta que a query Supabase sempre traga
  away_team?: Team; // Adicione '?' se for opcional
  // ... outras propriedades da partida
};
*/

// Tipo para um único palpite dentro da lista de palpites do usuário
type PredictionItem = {
  match: Match; // Detalhes da partida
  home_score_prediction: number;
  away_score_prediction: number;
};

// Propriedades que o componente PredictionReceipt receberá
type PredictionReceiptProps = {
  user: UserType; // Dados do usuário logado
  predictions: PredictionItem[]; // Lista de palpites do usuário com detalhes da partida
  dateGenerated: Date; // Data/hora em que o comprovante foi gerado
};

// --- Componente PredictionReceipt ---
export const PredictionReceipt: React.FC<PredictionReceiptProps> = ({ user, predictions, dateGenerated }) => {
  return (
    // A classe 'receipt-container' e as utilidades 'print:' são para estilos de impressão.
    // 'print:shadow-none print:border-0 print:p-0' são importantes para remover elementos
    // visuais que não são desejados na impressão.
    <div className="receipt-container p-6 bg-white border border-gray-300 rounded-lg shadow-lg max-w-2xl mx-auto print:shadow-none print:border-0 print:p-0">
      <h1 className="text-2xl font-bold text-center mb-4 text-gray-800 print:text-black">Comprovante de Palpites</h1>
      <hr className="mb-4 border-gray-300 print:border-gray-500" />

      <div className="mb-4">
        <p className="text-lg font-semibold text-gray-700 print:text-black">
          Usuário: <span className="font-normal">{user.name || user.nickname || user.email}</span>
        </p>
        <p className="text-lg font-semibold text-gray-700 print:text-black">
          Data de Emissão: <span className="font-normal">{format(dateGenerated, "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
        </p>
      </div>

      <h2 className="text-xl font-bold mb-3 text-gray-800 print:text-black">Seus Palpites:</h2>
      {predictions.length === 0 ? (
        <p className="text-gray-600 italic print:text-gray-700">Nenhum palpite registrado para este comprovante.</p>
      ) : (
        <div className="space-y-3">
          {predictions.map((p, index) => (
            <div key={p.match.id} className="border-b border-gray-200 pb-3 last:border-b-0 print:border-gray-400 print:pb-2">
              <p className="font-semibold text-gray-700 print:text-black">
                {/* Garante que p.match.match_date é uma data válida antes de formatar */}
                {format(new Date(p.match.match_date), "dd/MM/yyyy HH:mm", { locale: ptBR })} - {p.match.stage}
              </p>
              <p className="text-gray-600 print:text-gray-800 ml-2">
                <span className="font-medium">{p.match.home_team?.name || 'Time Casa'}</span> {p.home_score_prediction} x {p.away_score_prediction} <span className="font-medium">{p.match.away_team?.name || 'Time Fora'}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 text-center text-gray-500 text-sm print:text-gray-700">
        <p>Este é um comprovante dos seus palpites registrados na plataforma.</p>
        <p>Guarde-o para sua referência.</p>
      </div>
    </div>
  );
};