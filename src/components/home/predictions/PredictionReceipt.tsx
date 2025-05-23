// src/components/home/predictions/PredictionReceipt.tsx
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Match, Team as OriginalTeamType } from '@/types/matches'; // Usando Team de matches
import { User } from '@supabase/supabase-js'; // Tipo User do Supabase

// Tipos de Dados para o Comprovante
type TeamForReceipt = { // Tipo Team usado internamente no comprovante
  id: string;
  name: string;
  flag_url?: string;
};

type PredictionItem = {
  match: Match & { home_team: TeamForReceipt; away_team: TeamForReceipt; };
  home_score_prediction: number | null; // Permitir null se não preenchido
  away_score_prediction: number | null; // Permitir null se não preenchido
};

interface ReceiptGroupPredictionItem {
  group_name: string; // Alterado de group: {name: string} para simplificar
  predicted_first_team: TeamForReceipt;
  predicted_second_team: TeamForReceipt;
}

interface ReceiptFinalPredictionItem {
  champion: TeamForReceipt;
  runner_up: TeamForReceipt;
  third_place: TeamForReceipt;
  fourth_place: TeamForReceipt;
  final_home_score: number | null;
  final_away_score: number | null;
}

type PredictionReceiptProps = {
  user: User | null; // Recebe o objeto User completo do Supabase, ou null
  predictions: PredictionItem[];
  groupPredictions?: ReceiptGroupPredictionItem[];
  finalPrediction?: ReceiptFinalPredictionItem;
  dateGenerated: Date;
};

const PredictionReceipt = ({ user, predictions, groupPredictions, finalPrediction, dateGenerated }: PredictionReceiptProps) => {
  // CORREÇÃO: Acessar nome e email do usuário de forma segura
  const userName = user?.user_metadata?.full_name || user?.email || 'Usuário Anônimo';
  const userEmail = user?.email || 'Email não disponível';

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
        {/* CORREÇÃO: Usar as variáveis userName e userEmail */}
        <p className="text-gray-700 print:text-gray-800"><span className="font-medium">Nome:</span> {userName}</p>
        <p className="text-gray-700 print:text-gray-800"><span className="font-medium">Email:</span> {userEmail}</p>
      </div>

      {/* --- Seus Palpites de Partida --- */}
      <h2 className="text-xl font-bold mb-3 text-gray-800 print:text-black">Seus Palpites de Partida:</h2>
      {(!predictions || predictions.length === 0) ? (
        <p className="text-gray-600 italic print:text-gray-700 mb-4">Nenhum palpite de partida registrado para este comprovante.</p>
      ) : (
        <div className="space-y-3 mb-6">
          {predictions.map((p) => (
            <div key={p.match.id} className="border-b border-gray-200 pb-3 last:border-b-0 print:border-gray-400 print:pb-2">
              <p className="font-semibold text-gray-700 print:text-black">
                {format(new Date(p.match.match_date), "dd/MM/yyyy HH:mm", { locale: ptBR })} - {p.match.stage}
              </p>
              <p className="text-gray-600 print:text-gray-800 ml-2">
                <span className="font-medium">{p.match.home_team?.name || 'Time Casa'}</span> {p.home_score_prediction !== null ? p.home_score_prediction : '-'} x {p.away_score_prediction !== null ? p.away_score_prediction : '-'} <span className="font-medium">{p.match.away_team?.name || 'Time Fora'}</span>
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
            <div key={gp.group_name + index} className="border-b border-gray-200 pb-3 last:border-b-0 print:border-gray-400 print:pb-2">
              <p className="font-semibold text-gray-700 print:text-black">
                Grupo: {gp.group_name}
              </p>
              <p className="text-gray-600 print:text-gray-800 ml-2">
                <span className="font-medium">1º Lugar:</span> {gp.predicted_first_team?.name || 'Não definido'}
              </p>
              <p className="text-gray-600 print:text-gray-800 ml-2">
                <span className="font-medium">2º Lugar:</span> {gp.predicted_second_team?.name || 'Não definido'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 italic print:text-gray-700 mb-4">Nenhum palpite de grupo registrado para este comprovante.</p>
      )}

      {/* --- Seus Palpites da Final --- */}
      <h2 className="text-xl font-bold mb-3 text-gray-800 print:text-black">Seus Palpites da Final:</h2>
      {finalPrediction && finalPrediction.champion?.name !== 'Não Definido' ? ( // Verifica se há um campeão definido
        <div className="space-y-3 mb-6">
          <p className="text-gray-600 print:text-gray-800 ml-2"><span className="font-medium">Campeão:</span> {finalPrediction.champion?.name || 'Não definido'}</p>
          <p className="text-gray-600 print:text-gray-800 ml-2"><span className="font-medium">Vice-Campeão:</span> {finalPrediction.runner_up?.name || 'Não definido'}</p>
          <p className="text-gray-600 print:text-gray-800 ml-2"><span className="font-medium">3º Lugar:</span> {finalPrediction.third_place?.name || 'Não definido'}</p>
          <p className="text-gray-600 print:text-gray-800 ml-2"><span className="font-medium">4º Lugar:</span> {finalPrediction.fourth_place?.name || 'Não definido'}</p>
           {finalPrediction.final_home_score !== null && finalPrediction.final_away_score !== null && (
            <p className="text-gray-600 print:text-gray-800 ml-2">
              <span className="font-medium">Placar da Final (Campeão x Vice):</span> {finalPrediction.final_home_score} x {finalPrediction.final_away_score}
            </p>
          )}
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