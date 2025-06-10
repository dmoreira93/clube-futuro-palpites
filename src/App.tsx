// src/App.tsx

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

// Importações de Páginas
import Index from "./pages/Index";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Palpites from "./pages/Palpites";
import Ranking from "./pages/Ranking";
import Resultados from "./pages/Resultados";
import Criterios from "./pages/Criterios";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";
import Layout from "./components/layout/Layout";
import ChangePassword from "./pages/ChangePassword";
import UserPredictions from "./pages/UserPredictions";
import Simulador from "./pages/Simulador"; // <-- NOVA IMPORTAÇÃO

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<Layout><Index /></Layout>} />
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route path="/cadastro" element={<Layout><Cadastro /></Layout>} />
          <Route path="/ranking" element={<Layout><Ranking /></Layout>} />
          <Route path="/resultados" element={<Layout><Resultados /></Layout>} />
          <Route path="/criterios" element={<Layout><Criterios /></Layout>} />
          
          {/* Rota de Palpites (requer login) */}
          <Route path="/palpites" element={<Layout><Palpites /></Layout>} />
          <Route path="/palpites/:userId" element={<Layout><UserPredictions /></Layout>} />

          {/* Rota do Simulador (requer login) */}
          <Route path="/simulador" element={<Layout><Simulador /></Layout>} /> {/* <-- NOVA ROTA */}

          {/* Rota de troca de senha (requer login) */}
          <Route path="/change-password" element={<Layout><ChangePassword /></Layout>} />

          {/* Rotas de Admin */}
          <Route path="/admin-login" element={<Layout><AdminLogin /></Layout>} />
          <Route path="/admin" element={<Layout><Admin /></Layout>} />

          {/* Rota Not Found */}
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;