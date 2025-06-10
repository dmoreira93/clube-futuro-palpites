// src/App.tsx

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/layout/Layout"; // Importa o Layout

// Importações de todas as suas páginas
import Index from "./pages/Index";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Palpites from "./pages/Palpites";
import RankingPage from "./pages/Ranking";
import Resultados from "./pages/Resultados";
import Criterios from "./pages/Criterios";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";
import ChangePassword from "./pages/ChangePassword";
import UserPredictions from "./pages/UserPredictions";
import DailyMatchesAndPredictions from "./pages/DailyMatchesAndPredictions";
import Simulador from "./pages/Simulador";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* O Layout agora envolve TODAS as rotas, evitando duplicação */}
        <Layout>
          <Routes>
            {/* O conteúdo principal de cada rota é renderizado aqui dentro */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/ranking" element={<RankingPage />} />
            <Route path="/resultados" element={<Resultados />} />
            <Route path="/criterios" element={<Criterios />} />
            <Route path="/palpites-usuarios" element={<UserPredictions />} />
            <Route path="/palpites-do-dia" element={<DailyMatchesAndPredictions />} />
            <Route path="/palpites" element={<Palpites />} />
            <Route path="/simulador" element={<Simulador />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;