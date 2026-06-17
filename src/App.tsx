// src/App.tsx

import { useEffect } from "react"; 
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/layout/Layout";
import { supabase } from "./integrations/supabase/client"; // 🛡️ IMPORTANTE: Importe o seu cliente Supabase

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
  // 🌟 TRAVA DE SEGURANÇA CONTRA TELA INIFINITA E LOOPS (VITE/PWA/SUPABASE)
  useEffect(() => {
    // 1. OUVINTE DE ESTADO DO SUPABASE (Expulsar "zumbis" se a chave mudar ou token der erro 400/402 seguido)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        // Se a sessão for invalidada remotamente (ex: vc gerou chave nova), limpe os dados locais agressivamente.
        localStorage.clear();
        sessionStorage.clear();
      }
    });

    // 2. CAPTURA GLOBAL DE ERROS DE RENDERIZAÇÃO E CACHE
    const handleGlobalError = (e: ErrorEvent) => {
      // IGNORAR ERROS DE EXTENSÕES
      if (e.filename && (e.filename.includes('chrome-extension://') || e.filename.includes('pinComponent'))) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // CORREÇÃO DE CACHE (Failed to fetch dynamic module)
      if (
        e.message?.includes('Failed to fetch dynamically imported module') || 
        e.message?.includes('error loading dynamically imported module')
      ) {
        console.warn('⚠️ Detectada quebra de cache do Vite! Limpando Service Worker e atualizando...');
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (const registration of registrations) {
              registration.unregister();
            }
          });
        }
        window.location.reload();
      }

      // 🛡️ ANTI-LOOP SUPABASE (Erro de Quota Excedida / Blocked)
      // Se um componente no React entrar em loop e bater na parede do 402 ou Too Many Requests, o navegador desliga o app e limpa o cache.
      if (e.message?.includes('402') || e.message?.includes('Payment Required') || e.message?.includes('Too Many Requests')) {
          console.error("🚨 SOBRECARGA DE REQUISIÇÕES DETECTADA! Destruindo cache para quebrar loop.");
          localStorage.clear();
          window.location.replace('/'); // Joga o usuário zumbi de volta para a Home limpa.
      }
    };

    window.addEventListener('error', handleGlobalError, true); 
    
    // Limpeza ao desmontar
    return () => {
      window.removeEventListener('error', handleGlobalError, true);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 1. ROTAS DE IMPRESSÃO */}
          <Route 
            path="/comprovante/imprimir/:poolId" 
            element={<ProtectedRoute><ImprimirComprovante /></ProtectedRoute>} 
          />
          <Route 
            path="/comprovante/imprimir" 
            element={<ProtectedRoute><ImprimirComprovante /></ProtectedRoute>} 
          />

          {/* 2. DEMAIS ROTAS DA APLICAÇÃO */}
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