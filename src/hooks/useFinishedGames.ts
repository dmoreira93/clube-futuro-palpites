import { useState, useEffect } from "react";

// 🚀 Blindado: Removida qualquer importação direta para evitar quebras de build na Vercel
export const useFinishedGames = (supabaseClient: any, championshipId: string | undefined) => {
  const [finishedGamesCount, setFinishedGamesCount] = useState<number | null>(null);
  const [loadingGames, setLoadingGames] = useState<boolean>(false);

  useEffect(() => {
    const fetchFinishedGames = async () => {
      // Se não houver o cliente injetado ou o ID do campeonato, cancela a busca
      if (!supabaseClient || !championshipId) return;

      setLoadingGames(true);
      try {
        const { count, error } = await supabaseClient
          .from("matches")
          .select("*", { count: "exact", head: true })
          .eq("championship_id", championshipId)
          .eq("status", "finished");

        if (error) throw error;
        setFinishedGamesCount(count || 0);
      } catch (err) {
        console.error("Erro ao buscar jogos finalizados:", err);
        setFinishedGamesCount(0);
      } finally {
        setLoadingGames(false);
      }
    };

    fetchFinishedGames();
  }, [supabaseClient, championshipId]);

  return { finishedGamesCount, loadingGames };
};