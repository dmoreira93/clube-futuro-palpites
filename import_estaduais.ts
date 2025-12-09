import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO ---
// 1. Substitua com suas chaves (use a SERVICE_ROLE para poder inserir sem travas de RLS)
const SUPABASE_URL = 'https://wdbaoomwhuiztjoazagd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkYmFvb213aHVpenRqb2F6YWdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTk1MjczMSwiZXhwIjoyMDYxNTI4NzMxfQ.9NKCZVVHPKP3m41aDNSxZQhhtyjgKGeED_u0pg8H9ic'; // <--- COLE SUA CHAVE AQUI

// 2. Configuração completa dos campeonatos
const CONFIG_CAMPEONATOS = [
  // --- ESTADUAIS SUDESTE (Mistos: Grupos + Mata-mata) ---
  {
    nome: 'Campeonato Paulista 2026',
    supabase_id: '2a0b8c07-ad41-462e-9a4f-f52ae3ba6ced', 
    api_league_id: '4764',
    season: '2026',
    has_group_stage: true,
    has_final_match: true
  },
  {
    nome: 'Campeonato Carioca 2026',
    supabase_id: '559b1c6c-eacf-46ae-8434-8f68ec581fb1',
    api_league_id: '5688',
    season: '2026',
    has_group_stage: true, // Taça Guanabara conta como fase de classificação
    has_final_match: true
  },
  {
    nome: 'Campeonato Mineiro 2026',
    supabase_id: '818a318d-10e3-46b1-812e-d1e4fc3906c0',
    api_league_id: '4766',
    season: '2026',
    has_group_stage: true,
    has_final_match: true
  },

  // --- ESTADUAIS SUL (Mistos) ---
  {
    nome: 'Campeonato Gaúcho 2026',
    supabase_id: '419943ae-94d1-4eb1-87e4-0f1413e6bec7',
    api_league_id: '5691',
    season: '2026',
    has_group_stage: true,
    has_final_match: true
  },
  {
    nome: 'Campeonato Paranaense 2026',
    supabase_id: 'e72ccc5d-920a-47fd-b161-d3b2074c93a3',
    api_league_id: '4768', 
    season: '2026',
    has_group_stage: true,
    has_final_match: true
  },
  {
    nome: 'Campeonato Catarinense 2026',
    supabase_id: 'e79728ff-b00d-4820-a787-2fb463055fba',
    api_league_id: '5687',
    season: '2026',
    has_group_stage: true,
    has_final_match: true
  },

  // --- REGIONAIS E ESTADUAIS NORDESTE (Mistos) ---
  {
    nome: 'Copa do Nordeste 2026',
    supabase_id: 'ecca8da0-e781-4f12-b65e-6fa393b685fc',
    api_league_id: '5673',
    season: '2026',
    has_group_stage: true,
    has_final_match: true
  },
  {
    nome: 'Campeonato Baiano 2026',
    supabase_id: '991ca919-0dbd-40bf-90c8-a5ac6f4494bf',
    api_league_id: '5684',
    season: '2026',
    has_group_stage: true,
    has_final_match: true
  },
  {
    nome: 'Campeonato Pernambucano 2026',
    supabase_id: '6dc778de-3954-44b0-b99f-99f53fda5297',
    api_league_id: '4771',
    season: '2026',
    has_group_stage: true,
    has_final_match: true
  },
  {
    nome: 'Campeonato Cearense 2026',
    supabase_id: 'e1305fb9-1483-403e-853c-b65c491cb9e5',
    api_league_id: '5689',
    season: '2026',
    has_group_stage: true,
    has_final_match: true
  },

  // --- CENTRO-OESTE E NORTE ---
  {
    nome: 'Campeonato Goiano 2026',
    supabase_id: 'c02fb2da-7736-411b-8187-1998e6aa137f',
    api_league_id: '4773',
    season: '2026',
    has_group_stage: true,
    has_final_match: true
  },
  {
    nome: 'Copa Verde 2026',
    supabase_id: '30b84b4b-a9b1-4e7f-acff-f1e146f7ca2b',
    api_league_id: '5675',
    season: '2026',
    has_group_stage: false, // Copa Verde é geralmente Mata-mata puro desde o início
    has_final_match: true
  },

  // --- NACIONAIS ---
  {
    nome: 'Brasileirão Série A 2026',
    supabase_id: 'de09f904-99f7-468c-9a79-dcd3cf632a3d',
    api_league_id: '4351',
    season: '2026',
    has_group_stage: false, // Pontos corridos
    has_final_match: false  // Sem final
  },
  {
    nome: 'Copa do Brasil 2026',
    supabase_id: '3c0de691-894d-4e4e-86ac-10d7c03c1469',
    api_league_id: '4725',
    season: '2026',
    has_group_stage: false, // Mata-mata puro
    has_final_match: true
  },

  // --- INTERNACIONAIS ---
  {
    nome: 'Copa Libertadores 2026',
    supabase_id: '5b4df528-d0bb-4179-ad5f-9cad75bb13a9',
    api_league_id: '4496',
    season: '2026',
    has_group_stage: true,
    has_final_match: true
  },
  {
    nome: 'Copa Sul-Americana 2026',
    supabase_id: '2282cf5d-c316-4590-8edc-c2822a0f80bc',
    api_league_id: '4501',
    season: '2026',
    has_group_stage: true,
    has_final_match: true
  }
];
// --- FIM DA CONFIGURAÇÃO ---

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function importarEstaduais() {
  console.log(`🚀 Iniciando importação de ${CONFIG_CAMPEONATOS.length} campeonatos...`);

  // 1. Carregar todos os times existentes no banco para evitar duplicatas (Cache em memória)
  const { data: existingTeams } = await supabase.from('teams').select('id, name'); 
  
  // Mapa para buscar UUID do time pelo Nome (normalizado em minúsculas)
  const teamsMap = new Map();
  existingTeams?.forEach(t => teamsMap.set(t.name.toLowerCase().trim(), t.id));

  for (const camp of CONFIG_CAMPEONATOS) {
    console.log(`\n🏆 Processando: ${camp.nome} (Temporada ${camp.season})...`);

    try {
      // A. Buscar Jogos na API
      const url = `https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=${camp.api_league_id}&s=${camp.season}`;
      console.log(`   - Buscando dados em: ${url}`);
      
      const resp = await fetch(url);
      const data = await resp.json();

      if (!data.events) {
        console.warn(`   ⚠️ Nenhum jogo encontrado para ${camp.nome}. Verifique se a temporada ${camp.season} já está disponível na API.`);
        continue;
      }

      console.log(`   - Encontrados ${data.events.length} jogos.`);

      // B. Processar Times e Jogos
      const matchesToInsert = [];

      for (const event of data.events) {
        // Normaliza nomes da API
        const homeName = event.strHomeTeam.trim();
        const awayName = event.strAwayTeam.trim();

        // Garante que os times existem (Função auxiliar)
        const homeId = await getOrCreateTeam(homeName, event.strHomeTeamBadge, teamsMap);
        const awayId = await getOrCreateTeam(awayName, event.strAwayTeamBadge, teamsMap);

        if (homeId && awayId) {
          matchesToInsert.push({
            championship_id: camp.supabase_id,
            home_team_id: homeId,
            away_team_id: awayId,
            match_date: `${event.dateEvent}T${event.strTime || '00:00:00'}`, // Combina Data + Hora
            round: `Rodada ${event.intRound}`,
            stage: 'Fase de Grupos', // Padrão, pode tentar inferir se a API der info
            is_finished: false
          });
        }
      }

      // C. Salvar Jogos no Banco
      if (matchesToInsert.length > 0) {
        const { error } = await supabase.from('matches').insert(matchesToInsert);
        
        if (error) console.error(`   ❌ Erro ao salvar jogos de ${camp.nome}:`, error.message);
        else console.log(`   ✅ Sucesso! ${matchesToInsert.length} jogos importados para ${camp.nome}.`);
      }

    } catch (err) {
      console.error(`   ❌ Erro crítico em ${camp.nome}:`, err);
    }
  }
}

// Função auxiliar para garantir que o time existe
// Adicione isso no final do seu arquivo e rode 'npx tsx nome_do_arquivo.ts'
async function atualizarConfiguracoes() {
  console.log("🔄 Atualizando configurações de Grupos/Finais...");
  
  for (const camp of CONFIG_CAMPEONATOS) {
    const { error } = await supabase
      .from('championships')
      .update({
        has_group_stage: camp.has_group_stage,
        has_final_match: camp.has_final_match
      })
      .eq('id', camp.supabase_id);

    if (error) console.error(`❌ Erro em ${camp.nome}:`, error.message);
    else console.log(`✅ ${camp.nome} atualizado.`);
  }
}

atualizarConfiguracoes();