import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO ---
const SUPABASE_URL = 'https://wdbaoomwhuiztjoazagd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkYmFvb213aHVpenRqb2F6YWdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTk1MjczMSwiZXhwIjoyMDYxNTI4NzMxfQ.9NKCZVVHPKP3m41aDNSxZQhhtyjgKGeED_u0pg8H9ic'; // <--- COLE SUA CHAVE AQUI NOVAMENTE

// Lista de Ligas
const LIGAS_PARA_IMPORTAR = [
  // --- NACIONAIS ---
  { nome: 'Brasileirão Série A', api_id: '4351' },
  { nome: 'Brasileirão Série B', api_id: '4404' }, 
  { nome: 'Brasileirão Série C', api_id: '4625' }, 
  { nome: 'Copa do Brasil', api_id: '4725' },

  // --- INTERNACIONAIS (Não filtramos por 'Brazil' nestas) ---
  { nome: 'Copa Libertadores', api_id: '4496', internacional: true },
  { nome: 'Copa Sul-Americana', api_id: '4501', internacional: true },

  // --- ESTADUAIS & REGIONAIS ---
  { nome: 'Campeonato Paulista', api_id: '4764' },
  { nome: 'Campeonato Carioca', api_id: '5688' },
  { nome: 'Campeonato Mineiro', api_id: '4766' },
  { nome: 'Campeonato Gaúcho', api_id: '5691' },
  { nome: 'Campeonato Baiano', api_id: '5684' },
  { nome: 'Campeonato Pernambucano', api_id: '4771' },
  { nome: 'Campeonato Cearense', api_id: '5689' },
  { nome: 'Campeonato Paranaense', api_id: '4768' },
  { nome: 'Campeonato Catarinense', api_id: '5687' },
  { nome: 'Campeonato Goiano', api_id: '4773' },
  { nome: 'Copa do Nordeste', api_id: '5673' },
  { nome: 'Copa Verde', api_id: '5675' }
];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function importarTimes() {
  console.log(`🚀 Iniciando importação SEGURA de times...`);

  for (const liga of LIGAS_PARA_IMPORTAR) {
    console.log(`\n⚽ Buscando times da liga: ${liga.nome} (ID: ${liga.api_id})...`);

    try {
      const url = `https://www.thesportsdb.com/api/v1/json/3/lookup_all_teams.php?id=${liga.api_id}`;
      const resp = await fetch(url);
      const data = await resp.json();

      if (!data.teams) {
        console.warn(`   ⚠️ Nenhum time encontrado.`);
        continue;
      }

      // --- TRAVA DE SEGURANÇA ---
      // Se não for liga internacional e o país não for Brasil, PULA.
      if (!liga.internacional) {
          const paisDaLiga = data.teams[0].strCountry;
          if (paisDaLiga !== 'Brazil') {
              console.error(`   🚨 ERRO CRÍTICO: A API retornou times da '${paisDaLiga}' em vez do Brasil!`);
              console.error(`   🛑 Ignorando ${liga.nome} para não sujar o banco.`);
              continue; 
          }
      }

      console.log(`   - Encontrados ${data.teams.length} times.`);

      for (const t of data.teams) {
        const teamData = {
          name: t.strTeam.trim(),
          flag_url: t.strTeamBadge, 
          code: t.strTeamShort ? t.strTeamShort : t.strTeam.substring(0, 3).toUpperCase(),
        };

        const { error } = await supabase.from('teams').upsert(teamData, { onConflict: 'name' });
        
        if (error) {
            // Ignora erro de duplicidade se não tiver constraint, apenas loga outros erros
            console.error(`     Erro ao salvar ${teamData.name}: ${error.message}`);
        } else {
            // console.log(`     + Time processado: ${teamData.name}`);
        }
      }
      
      console.log(`   ✅ ${liga.nome} finalizada com sucesso.`);

    } catch (err) {
      console.error(`   ❌ Erro de conexão/API na liga ${liga.nome}:`, err);
    }
  }
  
  console.log(`\n🏁 Processo finalizado!`);
}

importarTimes();