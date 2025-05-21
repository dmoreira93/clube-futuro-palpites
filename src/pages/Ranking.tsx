// src/pages/Ranking.tsx

import React from "react";
import Layout from "@/components/layout/Layout";
import RankingTable from "@/components/ranking/RankingTable"; // Seu componente RankingTable

const RankingPage = () => {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-fifa-blue">Ranking Geral</h1>
          <p className="text-gray-600 mt-2">
            Confira a pontuação dos participantes do bolão da Copa Mundial de Clubes FIFA 2025.
          </p>
        </div>
        <RankingTable /> {/* Apenas renderiza o componente da tabela */}
      </div>
    </Layout>
  );
};

export default RankingPage;