import { useState, useEffect } from "react";
// 🚨 Nota: Importa o "supabase" exatamente da mesma pasta que o teu useParticipantsRanking usa!
import { supabase } from "@/lib/supabaseClient"; 

export const useFinishedGames = (championshipId: string | undefined) => {
  const [finishedGamesCount, setFinishedGamesCount] = useState<number | null>(null);
  const [loadingGames, setLoadingGames] = useState<boolean>(false);

  useEffect(() => {
    const fetchFinishedGames = async () => {
      if (!championshipId) return;

      setLoadingGames(true);
      try {
        const { count, error } = await supabase
          .from("matches")
          .select("*", { count: "exact", head: true }) // Traz apenas o número absoluto, super leve
          .eq("championship_id", championshipId)
          .eq("status", "finished");

        if (error) throw error;
        setFinishedGamesCount(count || 0);
      } catch (err) {
        console.error("Erro ao buscar jogos finalizados:", err);
        setFinishedGamesCount(0); // Fallback de segurança
      } finally {
        setLoadingGames(false);
      }
    };

    fetchFinishedGames();
  }, [championshipId]);

  return { finishedGamesCount, loadingGames };
};