// src/pages/Noticias.tsx

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Newspaper } from 'lucide-react';

// Define o formato de cada notícia
interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  imageUrl: string | null;
}

// Função que busca os dados da nossa Supabase Function
const fetchNews = async (): Promise<NewsItem[]> => {
  const { data, error } = await supabase.functions.invoke('fetch-rss-news');
  if (error) throw new Error(error.message);
  return data;
}

const NoticiasPage = () => {
  const { data: news, isLoading, error } = useQuery<NewsItem[]>({
    queryKey: ['news'], // Chave para o cache da query
    queryFn: fetchNews,
    staleTime: 1000 * 60 * 15, // Considera os dados "novos" por 15 minutos
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-fifa-blue" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao Carregar</AlertTitle>
          <AlertDescription>
            Não foi possível buscar as notícias no momento. Tente novamente mais tarde.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        {news?.map(item => (
          <a href={item.link} target="_blank" rel="noopener noreferrer" key={item.link} className="block hover:opacity-80 transition-opacity">
            <Card className="flex flex-col md:flex-row overflow-hidden">
              {item.imageUrl && (
                <div className="md:w-1/3">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-48 md:h-full object-cover" />
                </div>
              )}
              <div className="flex flex-col justify-between p-6 md:w-2/3">
                <div>
                  <CardTitle className="mb-2 text-lg">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </div>
                <p className="text-xs text-muted-foreground mt-4">{new Date(item.pubDate).toLocaleString('pt-BR')}</p>
              </div>
            </Card>
          </a>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-fifa-blue flex items-center justify-center gap-3">
          <Newspaper />
          Últimas Notícias
        </h1>
        <p className="text-muted-foreground mt-2">Fique por dentro do mundo do futebol.</p>
      </div>
      {renderContent()}
    </div>
  );
};

export default NoticiasPage;