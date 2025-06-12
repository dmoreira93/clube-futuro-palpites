// src/components/home/predictions/PredictionReceipt.tsx - VERSÃO CORRIGIDA
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Match, Team } from '@/types/matches';
import { User } from '@supabase/supabase-js';

// Tipos de dados para o Comprovante
type PredictionItem = {
  match: Match & { home_team?: Team; away_team?: Team; };
  home_score_prediction: number | null;
  away_score_prediction: number | null;
};

interface ReceiptGroupPredictionItem {
  group_name: string;
  predicted_first_team: Team;
  predicted_second_team: Team;
}

interface ReceiptFinalPredictionItem {
  champion: Team;
  runner_up: Team; // Corrigido para corresponder à sua interface
  third_place: Team;
  fourth_place: Team;
  final_home_score: number | null;
  final_away_score: number | null;
}

type PredictionReceiptProps = {
  user: User | null;
  predictions: PredictionItem[];
  groupPredictions?: ReceiptGroupPredictionItem[];
  finalPrediction?: ReceiptFinalPredictionItem;
  dateGenerated: Date;
};

const PredictionReceipt = ({ user, predictions, groupPredictions, finalPrediction, dateGenerated }: PredictionReceiptProps) => {
  const userName = user?.user_metadata?.name || user?.email || 'Usuário Anônimo';
  const userEmail = user?.email || 'Email não disponível';

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '800px', margin: 'auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '25px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>Comprovante de Palpites</h1>
        <p style={{ color: '#555' }}>Bolão Copa do Mundo de Clubes 2025</p>
        <p style={{ fontSize: '12px', color: '#777', marginTop: '5px' }}>
          Gerado em: {format(dateGenerated, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
        </p>
      </div>

      <div style={{ marginBottom: '25px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#444' }}>Dados do Participante</h2>
        <p><strong style={{ color: '#333' }}>Nome:</strong> {userName}</p>
        <p><strong style={{ color: '#333' }}>Email:</strong> {userEmail}</p>
      </div>

      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#444' }}>Resumo dos Palpites</h2>
        
        <section>
          <h3 style={{ fontSize: '16px', fontWeight: '600', borderBottom: '1px dashed #ddd', paddingBottom: '5px', marginBottom: '10px' }}>Partidas</h3>
          {(!predictions || predictions.length === 0) ? (
            <p>Nenhum palpite de partida completo.</p>
          ) : (
            predictions.map((p) => (
              <div key={p.match.id} style={{ marginBottom: '8px', paddingLeft: '10px' }}>
                <p style={{ fontSize: '12px', color: '#666' }}>{format(new Date(p.match.match_date), "dd/MM/yyyy HH:mm", { locale: ptBR })} - {p.match.stage}</p>
                {/* LINHA CORRIGIDA ABAIXO */}
                <p>{p.match.home_team?.name || 'Time da Casa'} <strong>{p.home_score_prediction}</strong> x <strong>{p.away_score_prediction}</strong> {p.match.away_team?.name || 'Time Visitante'}</p>
              </div>
            ))
          )}
        </section>

        <section style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', borderBottom: '1px dashed #ddd', paddingBottom: '5px', marginBottom: '10px' }}>Grupos</h3>
          {(!groupPredictions || groupPredictions.length === 0) ? (
            <p>Nenhum palpite de grupo completo.</p>
          ) : (
            groupPredictions.map((gp, index) => (
              <div key={index} style={{ marginBottom: '8px', paddingLeft: '10px' }}>
                <p><strong>{gp.group_name}:</strong> 1º: {gp.predicted_first_team.name}, 2º: {gp.predicted_second_team.name}</p>
              </div>
            ))
          )}
        </section>

        <section style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', borderBottom: '1px dashed #ddd', paddingBottom: '5px', marginBottom: '10px' }}>Fase Final</h3>
          {finalPrediction && finalPrediction.champion ? (
            <div style={{ paddingLeft: '10px' }}>
              <p><strong>Campeão:</strong> {finalPrediction.champion.name}</p>
              {/* CORRIGIDO AQUI: de vice_champion para runner_up */}
              <p><strong>Vice-Campeão:</strong> {finalPrediction.runner_up.name}</p>
              <p><strong>3º Lugar:</strong> {finalPrediction.third_place.name}</p>
              <p><strong>4º Lugar:</strong> {finalPrediction.fourth_place.name}</p>
              {finalPrediction.final_home_score !== null && <p><strong>Placar da Final:</strong> {finalPrediction.final_home_score} x {finalPrediction.final_away_score}</p>}
            </div>
          ) : (
            <p>Nenhum palpite da fase final completo.</p>
          )}
        </section>
      </div>

      <p style={{ fontSize: '10px', color: '#888', textAlign: 'center', marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
        Guarde este comprovante para sua referência. Boa sorte!
      </p>
    </div>
  );
};

export default PredictionReceipt;