// src/App.tsx

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/layout/Layout";

// Páginas
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/Dashboard";
import PoolDashboard from "./pages/PoolDashboard";
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
import JoinPoolPage from "./pages/JoinPool";
import CreatePoolPage from "./pages/CreatePool";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import PoolSettingsPage from "./pages/PoolSettings";
import ProfilePage from "./pages/Profile";
import NoticiasPage from "./pages/Noticias";
import AuditoriaPontos from "./pages/AuditoriaPontos";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";

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
            <Route path="*" element={<NotFound />} />
            
            {/* --- Rotas Protegidas --- */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/pool/:poolId" element={<ProtectedRoute><PoolDashboard /></ProtectedRoute>} />
            <Route path="/palpites" element={<ProtectedRoute><Palpites /></ProtectedRoute>} />
            <Route path="/ranking" element={<ProtectedRoute><RankingPage /></ProtectedRoute>} />
            <Route path="/resultados" element={<ProtectedRoute><Resultados /></ProtectedRoute>} />
            <Route path="/simulador" element={<ProtectedRoute><Simulador /></ProtectedRoute>} />
            <Route path="/noticias" element={<ProtectedRoute><NoticiasPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/join-pool" element={<ProtectedRoute><JoinPoolPage /></ProtectedRoute>} />
            <Route path="/create-pool" element={<ProtectedRoute><CreatePoolPage /></ProtectedRoute>} />
            <Route path="/pool-settings" element={<ProtectedRoute><PoolSettingsPage /></ProtectedRoute>} />
            <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
            <Route path="/palpites-usuarios" element={<ProtectedRoute><UserPredictions /></ProtectedRoute>} />
            <Route path="/palpites-do-dia" element={<ProtectedRoute><DailyMatchesAndPredictions /></ProtectedRoute>} />
            <Route path="/auditoria" element={<ProtectedRoute><AuditoriaPontos /></ProtectedRoute>} />
            <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
            <Route path="/TermsOfUse" element={<TermsOfUse />} />


            {/* --- Rotas de Admin --- */}
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute adminOnly={true}><Admin /></ProtectedRoute>} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;