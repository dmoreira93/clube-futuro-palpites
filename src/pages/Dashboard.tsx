// src/pages/Dashboard.tsx (VERSÃO CORRIGIDA E SIMPLIFICADA)

import { MyPoolsList } from '../components/dashboard/MyPoolsList';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';

const Dashboard = () => {
  return (
    <div className="container mx-auto p-4 space-y-8">
      
      {/* Seção "Meus Bolões" agora é a principal e única fonte de listagem */}
      <MyPoolsList />

      {/* Você pode adicionar outras seções ao seu Dashboard aqui */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas notícias e atualizações dos seus bolões.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Em breve...</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas Gerais</CardTitle>
            <CardDescription>Seu desempenho geral na plataforma.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Em breve...</p>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default Dashboard;