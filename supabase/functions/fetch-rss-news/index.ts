// supabase/functions/fetch-rss-news/index.ts (CORRIGIDO)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { XMLParser } from "fast-xml-parser";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const rssUrl = 'https://ge.globo.com/rss/ge/futebol/futebol-internacional/';
    
    const response = await fetch(rssUrl);
    if (!response.ok) {
      throw new Error(`Erro ao buscar o feed RSS: ${response.statusText}`);
    }

    const xmlText = await response.text();
    
    // Configura o novo parser
    const parser = new XMLParser({
      // Preserva o conteúdo dentro de tags CDATA, onde geralmente fica a descrição com HTML
      cdataPropName: "__cdata", 
    });
    
    const jsonObj = parser.parse(xmlText);

    // O restante da lógica para limpar e formatar os dados continua similar
    const items = jsonObj.rss.channel.item.map((item: any) => {
      // A descrição completa, com HTML, geralmente está dentro do __cdata
      const descriptionHtml = item.description?.__cdata || item.description || '';

      return {
        title: item.title,
        link: item.link,
        // Limpa as tags HTML para ter um texto puro
        description: String(descriptionHtml).replace(/<[^>]*>?/gm, '').trim(), 
        pubDate: item.pubDate,
        // Extrai a URL da imagem de dentro do HTML
        imageUrl: String(descriptionHtml).match(/<img src="([^"]+)"/)?.[1] || null,
      };
    }).slice(0, 20); // Pega apenas os 20 artigos mais recentes

    return new Response(JSON.stringify(items), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});