// Arquivo App.tsx - Teste do Passo 2
import { BrowserRouter, Routes, Route } from "react-router-dom";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <div style={{ padding: '2rem', fontSize: '2rem', color: 'black', backgroundColor: 'white' }}>
            Página com Roteador
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
};

export default App;