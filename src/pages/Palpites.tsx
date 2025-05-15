import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { toast } from 'react-toastify';
import { useUser } from '@supabase/auth-helpers-react';

const Palpites = () => {
  const user = useUser(); // Obtem o usuário autenticado
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    if (user) {
      // Buscar palpites existentes do usuário
      const fetchPredictions = async () => {
        const { data, error } = await supabase
          .from('predictions')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Erro ao buscar palpites:', error);
        } else {
          setPredictions(data);
        }
      };

      fetchPredictions();
    }
  }, [user]);

  const handleSavePredictions = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para salvar palpites.');
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
        onConflict: ['user_id', 'match_id'] // Constraint composta
      });

    if (error) {
      console.error('Erro ao salvar palpites:', error);
      toast.error("Erro ao salvar seus palpites!");
    } else {
      toast.success("Palpites salvos com sucesso!");
    }
  };

  const handleChangePrediction = (matchId, newPrediction) => {
    setPredictions(prev =>
      prev.map(p =>
        p.match_id === matchId ? { ...p, prediction: newPrediction } : p
      )
    );
  };

  return (
    <div>
      <h2>Seus Palpites</h2>
      {predictions.map(pred => (
        <div key={pred.match_id}>
          <p>Jogo {pred.match_id}</p>
          <input
            type="text"
            value={pred.prediction || ''}
            onChange={e => handleChangePrediction(pred.match_id, e.target.value)}
          />
        </div>
      ))}
      <button onClick={handleSavePredictions}>Salvar Palpites</button>
    </div>
  );
};

export default Palpites;
