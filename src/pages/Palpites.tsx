import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Prediction {
  match_id: number;
  score_home: number;
  score_away: number;
  user_id?: string;
  updated_at?: string;
}

interface User {
  id: string;
}

const Palpites = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error
      } = await supabase.auth.getUser();

      if (error || !user) {
        toast.error("Erro ao obter usuário");
      } else {
        setUser(user);
      }
    };

    fetchUser();
  }, []);

  const handleInputChange = (index: number, field: 'score_home' | 'score_away', value: number) => {
    const updatedPredictions = [...predictions];
    updatedPredictions[index][field] = value;
    setPredictions(updatedPredictions);
  };

  const handleSavePredictions = async () => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    const predictionsToSave = predictions.map(pred => ({
      ...pred,
      user_id: user.id,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('predictions')
      .upsert(predictionsToSave, {
        onConflict: 'user_id,match_id'
      });

    if (error) {
      console.error('Erro ao salvar palpites:', error);
      toast.error("Erro ao salvar seus palpites!");
    } else {
      toast.error("Nenhum palpite válido foi salvo. Verifique os prazos e preenchimento dos campos.");
    }
  };

  return (
    <div>
      <h1>Seus Palpites</h1>
      {predictions.map((prediction, index) => (
        <div key={prediction.match_id}>
          <span>Jogo {prediction.match_id}</span>
          <input
            type="number"
            value={prediction.score_home}
            onChange={(e) => handleInputChange(index, 'score_home', parseInt(e.target.value))}
          />
          <input
            type="number"
            value={prediction.score_away}
            onChange={(e) => handleInputChange(index, 'score_away', parseInt(e.target.value))}
          />
        </div>
      ))}
      <button onClick={handleSavePredictions}>Salvar Palpites</button>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Palpites;