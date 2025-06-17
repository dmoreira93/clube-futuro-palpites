// src/hooks/useParticipantsRanking.ts

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface Participant {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  points: number;
  matchesplayed: number;
  accuracy: string;
  exactscores: number;
  correctwinners: number;
  createdat: string;
  prize: string | null;
}

const useParticipantsRanking = () => {
  const { pool } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRanking = async () => {
      if (!pool?.id) return;
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/pools/${pool.id}/ranking`);
        if (!response.ok) {
          throw new Error("Falha ao buscar o ranking.");
        }
        const data: Participant[] = await response.json();
        setParticipants(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [pool?.id]);

  return { participants, loading, error };
};

export default useParticipantsRanking;