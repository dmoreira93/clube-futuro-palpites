// src/components/home/predictions/PredictionReceipt.tsx
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Certifique-se de que estes tipos estão corretos de acordo com seus arquivos
import { Match } from '@/types/matches'; // Assumindo que MatchType tem a estrutura de uma partida
import { UserType } from '@/contexts/AuthContext';

// --- Tipos de Dados ---
type Team = {
  id: string;
  name: string;
  flag_url?: string;
};

// Tipo para um único palpite de partida dentro da lista de palpites do usuário
type PredictionItem = {
  match: Match & { home_team: Team; away_team: Team; }; // Match com times carregados
  home_score_prediction: number;
  away_score_prediction: number;
};

// Tipo para um palpite de grupo para o comprovante
interface ReceiptGroupPredictionItem {
  id: string;
  group: { name: string };
  predicted_first_team: { name: string };
  predicted_second_team: { name: string };
}

// Tipo para um palpite final para o comprovante
interface ReceiptFinalPredictionItem {
  id: string;
  champion: { name: string };
  runner_up: { name: string };
  third_place: { name: string };
  fourth_place: { name: string };
  // Adicione final_home_score, final_away_score se precisar exibir o placar final real aqui
}


// Propriedades que o componente PredictionReceipt receberá
type PredictionReceiptProps = {
  user: UserType; // Dados do usuário logado
  predictions: PredictionItem[]; // Para palpites de partida
  groupPredictions?: ReceiptGroupPredictionItem[]; // Opcional, para palpites de grupo
  finalPrediction?: ReceiptFinalPredictionItem; // Opcional, para palpite final
  dateGenerated: Date;
};

const PredictionReceipt = ({ user, predictions, groupPredictions, finalPrediction, dateGenerated }: PredictionReceiptProps) => {
  return (
    <div className="receipt-container p-6 bg-white border border-gray-300 rounded-lg shadow-lg print:shadow-none print:border-0 print:p-0">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 print:text-black">Comprovante de Palpites</h1>
        <p className="text-gray-700 print:text-gray-800">Copa da Futuro</p>
        <p className="text-sm text-gray-500 print:text-gray-600 mt-2">
          Gerado em: <span className="font-normal">{format(dateGenerated, "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
        </p>
      </div>

      <div className="mb-6 border-b pb-4 border-gray-200 print:border-gray-400">
        <h2 className="text-xl font-bold mb-2 text-gray-800 print:text-black">Dados do Apostador:</h2>
        <p className="text-gray-700 print:text-gray-800"><span className="font-medium">Nome:</span> {user.name}</p>
        <p className="text-gray-700 print:text-gray-800"><span className="font-medium">Email:</span> {user.email}</p>
      </div>

      {/* --- Seus Palpites de Partida --- */}
      <h2 className="text-xl font-bold mb-3 text-gray-800 print:text-black">Seus Palpites de Partida:</h2>
      {predictions.length === 0 ? (
        <p className="text-gray-600 italic print:text-gray-700 mb-4">Nenhum palpite de partida registrado para este comprovante.</p>
      ) : (
        <div className="space-y-3 mb-6">
          {predictions.map((p, index) => (
            <div key={p.match.id} className="border-b border-gray-200 pb-3 last:border-b-0 print:border-gray-400 print:pb-2">
              <p className="font-semibold text-gray-700 print:text-black">
                {format(new Date(p.match.match_date), "dd/MM/yyyy HH:mm", { locale: ptBR })} - {p.match.stage}
              </p>
              <p className="text-gray-600 print:text-gray-800 ml-2">
                <span className="font-medium">{p.match.home_team?.name || 'Time Casa'}</span> {p.home_score_prediction} x {p.away_score_prediction} <span className="font-medium">{p.match.away_team?.name || 'Time Fora'}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* --- Seus Palpites de Grupo --- */}
      <h2 className="text-xl font-bold mb-3 text-gray-800 print:text-black">Seus Palpites de Grupo:</h2>
      {groupPredictions && groupPredictions.length > 0 ? (
        <div className="space-y-3 mb-6">
          {groupPredictions.map((gp, index) => (
            <div key={gp.id || index} className="border-b border-gray-200 pb-3 last:border-b-0 print:border-gray-400 print:pb-2">
              <p className="font-semibold text-gray-700 print:text-black">
                Grupo: {gp.group.name}
              </p>
              <p className="text-gray-600 print:text-gray-800 ml-2">
                <span className="font-medium">1º Lugar:</span> {gp.predicted_first_team.name}
              </p>
              <p className="text-gray-600 print:text-gray-800 ml-2">
                <span className="font-medium">2º Lugar:</span> {gp.predicted_second_team.name}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 italic print:text-gray-700 mb-4">Nenhum palpite de grupo registrado para este comprovante.</p>
      )}

      {/* --- Seus Palpites da Final --- */}
      <h2 className="text-xl font-bold mb-3 text-gray-800 print:text-black">Seus Palpites da Final:</h2>
      {finalPrediction ? (
        <div className="space-y-3 mb-6">
          <p className="text-gray-600 print:text-gray-800 ml-2"><span className="font-medium">Campeão:</span> {finalPrediction.champion.name}</p>
          <p className="text-gray-600 print:text-gray-800 ml-2"><span className="font-medium">Vice-Campeão:</span> {finalPrediction.runner_up.name}</p>
          <p className="text-gray-600 print:text-gray-800 ml-2"><span className="font-medium">3º Lugar:</span> {finalPrediction.third_place.name}</p>
          <p className="text-gray-600 print:text-gray-800 ml-2"><span className="font-medium">4º Lugar:</span> {finalPrediction.fourth_place.name}</p>
        </div>
      ) : (
        <p className="text-gray-600 italic print:text-gray-700 mb-4">Nenhum palpite da fase final registrado para este comprovante.</p>
      )}

      <p className="text-sm text-gray-500 text-center mt-6 print:text-gray-600">
        Este é um comprovante dos seus palpites registrados na plataforma Copa da Futuro. Guarde-o para sua referência.
      </p>
    </div>
  );
};

export default PredictionReceipt;