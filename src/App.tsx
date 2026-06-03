// src/App.tsx

import { useEffect } from "react"; // 🌟 Importado para gerenciar o listener global
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

// Páginas Híbridas (Entrada no Bolão - Tratam Auth internamente)
import JoinPoolPage from "./pages/JoinPool";

// Páginas Protegidas (Dashboard Geral)
import Dashboard from "./pages/Dashboard";
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
import DailyMatchesAndPredictions from "./pages/DailyMatchesAndPredictions";
import ImprimirComprovante from './pages/imprimir';

// Admin
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";

// Componentes de Proteção
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

function App() {
  // 🌟 TRAVA DE SEGURANÇA CONTRA TELA INIFINITA DE CACHE (VITE/PWA)
  useEffect(() => {
    const handleGlobalError = (e: ErrorEvent) => {
      // Captura o erro clássico do Vite quando um arquivo JS antigo some do servidor pós-deploy
      if (
        e.message?.includes('Failed to fetch dynamically imported module') || 
        e.message?.includes('error loading dynamically imported module')
      ) {
        console.warn('⚠️ Detectada quebra de cache do Vite! Limpando Service Worker e atualizando...');
        
        // 1. Localiza e desinstala ativamente os service workers antigos para limpar as rotas presas
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (const registration of registrations) {
              registration.unregister();
            }
          });
        }
        
        // 2. Força um reload completo limpando o cache HTTP local para trazer a versão nova da Vercel
        window.location.reload();
      }
    };

    window.addEventListener('error', handleGlobalError);
    return () => window.removeEventListener('error', handleGlobalError);
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 1. ROTAS DE IMPRESSÃO (Nível Raiz e Blindadas contra Cache)
             Mapeamos os dois formatos de URL possíveis para garantir que, independente 
             de o componente ler por useParams ou useSearchParams, a página carregue 
             sem dar 404 Not Found.
          */}
          <Route 
            path="/comprovante/imprimir/:poolId" 
            element={<ProtectedRoute><ImprimirComprovante /></ProtectedRoute>} 
          />
          <Route 
            path="/comprovante/imprimir" 
            element={<ProtectedRoute><ImprimirComprovante /></ProtectedRoute>} 
          />

          {/* 2. DEMAIS ROTAS DA APLICAÇÃO (Layout Visual do Sistema) */}
          <Route
            path="/*"
            element={
              <Layout>
                <Routes>
                  {/* --- Rotas Públicas --- */}
                  <Route path="" element={<HomePage />} />
                  <Route path="login" element={<Login />} />
                  <Route path="cadastro" element={<Cadastro />} />
                  <Route path="cadastro/:inviteCode" element={<Cadastro />} />
                  <Route path="criterios" element={<Criterios />} />
                  <Route path="PrivacyPolicy" element={<PrivacyPolicy />} />
                  <Route path="TermsOfUse" element={<TermsOfUse />} />
                  
                  {/* ROTAS DE ENTRADA (JOIN) */}
                  <Route path="join" element={<JoinPoolPage />} />
                  <Route path="join/:code" element={<JoinPoolPage />} />

                  {/* --- Rotas Semi-Protegidas --- */}
                  <Route path="complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />
                  
                  {/* --- Rotas Protegidas (Gerais) --- */}
                  <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="noticias" element={<ProtectedRoute><NoticiasPage /></ProtectedRoute>} />
                  <Route path="pool/:poolId/auditoria" element={<ProtectedRoute><AuditoriaPontos /></ProtectedRoute>} />
                  <Route path="create-pool" element={<ProtectedRoute><CreatePoolPage /></ProtectedRoute>} />
                  <Route path="change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
                  
                  {/* --- Rotas de Contexto do Bolão (Aninhadas) --- */}
                  <Route path="pool/:poolId" element={<ProtectedRoute><PoolDashboard /></ProtectedRoute>} />
                  <Route path="pool/:poolId/palpites" element={<ProtectedRoute><Palpites /></ProtectedRoute>} />
                  <Route path="pool/:poolId/ranking" element={<ProtectedRoute><RankingPage /></ProtectedRoute>} />
                  <Route path="pool/:poolId/resultados" element={<ProtectedRoute><Resultados /></ProtectedRoute>} />
                  <Route path="pool/:poolId/simulador" element={<ProtectedRoute><Simulador /></ProtectedRoute>} />
                  <Route path="pool/:poolId/settings" element={<ProtectedRoute><PoolSettingsPage /></ProtectedRoute>} />
                  <Route path="pool/:poolId/info-participantes" element={<ProtectedRoute><InfoParticipantes /></ProtectedRoute>} />

                  {/* Redirecionamentos de compatibilidade */}
                  <Route path="palpites" element={<Navigate to="/dashboard" replace />} />
                  <Route path="ranking" element={<Navigate to="/dashboard" replace />} />
                  <Route path="resultados" element={<Navigate to="/dashboard" replace />} />
                  <Route path="simulador" element={<Navigate to="/dashboard" replace />} />
                  <Route path="pool/:poolId/criteria-setup" element={<ProtectedRoute><PoolCriteriaSetup /></ProtectedRoute>} />
                  <Route path="pool/:poolId/palpites-galera" element={<ProtectedRoute><DailyMatchesAndPredictions /></ProtectedRoute>}/>            

                  {/* --- Rotas de Admin --- */}
                  <Route path="admin-login" element={<AdminLogin />} />
                  <Route path="admin" element={<ProtectedRoute adminOnly={true}><Admin /></ProtectedRoute>} />

                  {/* --- 404 --- */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;