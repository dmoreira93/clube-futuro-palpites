// src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/layout/Layout";

// Páginas Públicas
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Criterios from "./pages/Criterios";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import CompleteProfile from "./pages/CompleteProfile";

// Páginas Protegidas (Dashboard Geral)
import Dashboard from "./pages/Dashboard";
import JoinPoolPage from "./pages/JoinPool";
import CreatePoolPage from "./pages/CreatePool";
import PoolSettingsPage from "./pages/PoolSettings";
import ProfilePage from "./pages/Profile";
import NoticiasPage from "./pages/Noticias";
import ChangePassword from "./pages/ChangePassword";
import AuditoriaPontos from "./pages/AuditoriaPontos";

// Páginas Específicas do Bolão (Contexto do Bolão)
import PoolDashboard from "./pages/PoolDashboard";
import Palpites from "./pages/Palpites";
import RankingPage from "./pages/Ranking";
import Resultados from "./pages/Resultados";
import Simulador from "./pages/Simulador";
import InfoParticipantes from "./pages/InfoParticipantes";
import PoolCriteriaSetup from "./pages/PoolCriteriaSetup";
import DailyMatchesAndPredictions from "./pages/DailyMatchesAndPredictions"; // Importe este arquivo

// Admin
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";

// Componentes de Proteção
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            {/* --- Rotas Públicas --- */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/cadastro/:inviteCode" element={<Cadastro />} />
            <Route path="/criterios" element={<Criterios />} />
            <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
            <Route path="/TermsOfUse" element={<TermsOfUse />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            
            {/* --- Rotas Protegidas (Gerais) --- */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/noticias" element={<ProtectedRoute><NoticiasPage /></ProtectedRoute>} />
            <Route path="/auditoria" element={<ProtectedRoute><AuditoriaPontos /></ProtectedRoute>} />
            <Route path="/join-pool" element={<ProtectedRoute><JoinPoolPage /></ProtectedRoute>} />
            <Route path="/create-pool" element={<ProtectedRoute><CreatePoolPage /></ProtectedRoute>} />
            <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
            
            {/* --- Rotas de Contexto do Bolão (Aninhadas) --- */}
            {/* A rota base /pool/:poolId leva ao Dashboard do Bolão */}
            <Route path="/pool/:poolId" element={<ProtectedRoute><PoolDashboard /></ProtectedRoute>} />
                        
            {/* As sub-rotas mantêm o ID na URL, permitindo que a Navbar saiba onde estamos */}
            <Route path="/pool/:poolId/palpites" element={<ProtectedRoute><Palpites /></ProtectedRoute>} />
            <Route path="/pool/:poolId/ranking" element={<ProtectedRoute><RankingPage /></ProtectedRoute>} />
            <Route path="/pool/:poolId/resultados" element={<ProtectedRoute><Resultados /></ProtectedRoute>} />
            <Route path="/pool/:poolId/simulador" element={<ProtectedRoute><Simulador /></ProtectedRoute>} />
            <Route path="/pool/:poolId/settings" element={<ProtectedRoute><PoolSettingsPage /></ProtectedRoute>} />
            <Route path="/pool/:poolId/info-participantes" element={<ProtectedRoute><InfoParticipantes /></ProtectedRoute>} />

            {/* Redirecionamentos de compatibilidade (caso alguém tente acessar as rotas antigas) */}
            <Route path="/palpites" element={<Navigate to="/dashboard" replace />} />
            <Route path="/ranking" element={<Navigate to="/dashboard" replace />} />
            <Route path="/resultados" element={<Navigate to="/dashboard" replace />} />
            <Route path="/simulador" element={<Navigate to="/dashboard" replace />} />
            <Route path="/pool/:poolId/criteria-setup" element={<ProtectedRoute><PoolCriteriaSetup /></ProtectedRoute>} />
            <Route path="/pool/:poolId/palpites-galera" element={<ProtectedRoute><DailyMatchesAndPredictions /></ProtectedRoute>}/>            

            {/* --- Rotas de Admin --- */}
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute adminOnly={true}><Admin /></ProtectedRoute>} />

            {/* --- 404 --- */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;