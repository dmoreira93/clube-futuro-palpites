// src/App.tsx

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/layout/Layout"; 

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
// --- NOVAS IMPORTAÇÕES ---
import JoinPoolPage from "./pages/JoinPool"; 
import CreatePoolPage from "./pages/CreatePool";
import ProtectedRoute from "./components/auth/ProtectedRoute"; // Criaremos este a seguir

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/cadastro/:inviteCode" element={<Cadastro />} /> {/* Rota com código */}
            <Route path="*" element={<NotFound />} />
            
            {/* Rotas Protegidas */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/ranking" element={<ProtectedRoute><RankingPage /></ProtectedRoute>} />
            <Route path="/resultados" element={<ProtectedRoute><Resultados /></ProtectedRoute>} />
            <Route path="/criterios" element={<ProtectedRoute><Criterios /></ProtectedRoute>} />
            <Route path="/palpites-usuarios" element={<ProtectedRoute><UserPredictions /></ProtectedRoute>} />
            <Route path="/palpites-do-dia" element={<ProtectedRoute><DailyMatchesAndPredictions /></ProtectedRoute>} />
            <Route path="/palpites" element={<ProtectedRoute><Palpites /></ProtectedRoute>} />
            <Route path="/simulador" element={<ProtectedRoute><Simulador /></ProtectedRoute>} />
            <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
            <Route path="/join-pool" element={<ProtectedRoute><JoinPoolPage /></ProtectedRoute>} />
            <Route path="/create-pool" element={<ProtectedRoute><CreatePoolPage /></ProtectedRoute>} />

            {/* Rotas de Admin */}
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute adminOnly={true}><Admin /></ProtectedRoute>} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;