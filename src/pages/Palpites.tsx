// src/pages/Palpites.tsx
import { useState, useEffect, useCallback, useRef } from "react"; // Adicionado useRef
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Volleyball as SoccerBallIcon, Trophy as TrophyIcon, Users as UsersIcon, Loader2, Printer } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Match } from "@/types/matches";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactDOMServer from 'react-dom/server';

// Importações para o comprovante
import PredictionReceipt from "@/components/predictions/PredictionReceipt";

// Importa DailyPredictions e a interface LocalPrediction
import DailyPredictions, { LocalPrediction } from "@/components/home/DailyPredictions"; // Importa o componente e a interface

// ... (seus tipos existentes MatchPrediction, GroupPrediction, FinalPrediction)

// Variáveis para datas de corte (ajuste conforme necessário)
const globalPredictionCutoffDate = new Date("2025-06-14T12:00:00Z"); // Exemplo: data limite global para o bolão
const finalPredictionCutoffDate = new Date("2025-06-20T12:00:00Z"); // Exemplo: data limite para palpites de final

// ... (resto dos tipos, como o seu FinalPrediction, GroupPrediction, etc.)

// Certifique-se que o tipo Match está completo com home_team e away_team
interface Team {
  id: string;
  name: string;
}

export interface MatchWithTeams extends Match {
  home_team?: Team;
  away_team?: Team;
}


const Palpites = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("matches"); // Estado para controlar a aba ativa

  // --- NOVO ESTADO para os palpites das partidas gerenciados por DailyPredictions ---
  const [matchPredictionsFromDaily, setMatchPredictionsFromDaily] = useState<LocalPrediction[]>([]);

  // Referência para a função handleSavePrediction de DailyPredictions
  // Vamos definir essa função aqui, pois ela fará as chamadas ao Supabase
  // e precisa de acesso a 'user' e 'toast' deste escopo.
  const getCanPredict = useCallback((matchDate: string, isFinished: boolean) => {
    const matchTime = parseISO(matchDate).getTime();
    const now = new Date().getTime();
    const cutoffTime = matchTime - (1 * 60 * 60 * 1000); // 1 hora antes do jogo

    if (isFinished) return false;
    if (now > cutoffTime) return false;
    return true;
  }, []); // Sem dependências, pois só usa `Date` e `parseISO`


  const handleSaveSinglePrediction = useCallback(async (
    predictionToSave: LocalPrediction,
    currentUserId: string,
    showToast: boolean = false // Adiciona um flag para controlar o toast
  ) => {
    const homeScore = Number(predictionToSave.home_score);
    const awayScore = Number(predictionToSave.away_score);

    // Validação de placares (já que Inputs não tinham disabled por !areScoresFilledAndValid)
    if (predictionToSave.home_score === '' || predictionToSave.away_score === '' || isNaN(homeScore) || isNaN(awayScore)) {
        if (showToast) {
            toast.error("Por favor, preencha todos os placares das partidas válidas antes de confirmar.");
        }
        return { success: false, message: "Placares inválidos ou incompletos." };
    }

    const canPredictNow = getCanPredict(predictionToSave.match_date, predictionToSave.is_finished);
    if (!canPredictNow) {
        if (showToast) {
            toast.warning(`Palpite para partida ${predictionToSave.match_id} não salvo. Prazo encerrado.`);
        }
        return { success: false, message: "Prazo para palpite encerrado." };
    }

    try {
      if (predictionToSave.prediction_id) {
        const { error: updateError } = await supabase
          .from('match_predictions')
          .update({ home_score: homeScore, away_score: awayScore })
          .eq('id', predictionToSave.prediction_id);
        if (updateError) throw updateError;
        return { success: true, message: "Atualizado." };
      } else {
        const { data, error: insertError } = await supabase
          .from('match_predictions')
          .insert({
            user_id: currentUserId,
            match_id: predictionToSave.match_id,
            home_score: homeScore,
            away_score: awayScore,
          })
          .select();
        if (insertError) throw insertError;
        // Se um novo palpite foi inserido, atualize o prediction_id no estado local
        // Isso será mais complexo aqui pois o estado está em DailyPredictions.
        // O ideal é que handleSaveSinglePrediction retorne o novo ID e o Palpites.tsx
        // atualize o estado de matchPredictionsFromDaily (ou solicite um re-fetch do DailyPredictions)
        return { success: true, message: "Inserido.", newPredictionId: data?.[0]?.id };
      }
    } catch (err: any) {
      console.error("Erro ao salvar palpite:", err);
      if (showToast) {
        toast.error(`Erro ao salvar palpite para partida ${predictionToSave.match_id}.`);
      }
      return { success: false, message: err.message || "Erro desconhecido." };
    }
  }, [getCanPredict, toast]); // Depende de getCanPredict e toast

  // --- Função para o botão "Confirmar Palpites" ---
  const handleSubmitBets = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para confirmar palpites.");
      return;
    }
    setSubmitting(true);

    let allSuccess = true;
    let successfulCount = 0;
    let skippedCount = 0; // Para palpites com prazo encerrado ou inválidos

    // --- SALVAR PALPITES DE PARTIDAS ---
    for (const prediction of matchPredictionsFromDaily) {
        const homeScore = Number(prediction.home_score);
        const awayScore = Number(prediction.away_score);

        // Validação adicional: não tenta salvar se os campos estão vazios ou inválidos
        if (prediction.home_score === '' || prediction.away_score === '' || isNaN(homeScore) || isNaN(awayScore)) {
            skippedCount++;
            continue; // Pula para a próxima partida
        }

        const result = await handleSaveSinglePrediction(prediction, user.id);
        if (result.success) {
            successfulCount++;
            // Se foi uma inserção, precisamos atualizar o prediction_id no estado
            if (result.newPredictionId) {
                setMatchPredictionsFromDaily(prev =>
                    prev.map(p => p.match_id === prediction.match_id ? { ...p, prediction_id: result.newPredictionId } : p)
                );
            }
        } else {
            allSuccess = false;
            skippedCount++;
            console.warn(`Palpite para partida ${prediction.match_id} não salvo: ${result.message}`);
        }
    }

    // --- TODO: Lógica para salvar palpites de GRUPO e FINAL aqui ---
    // Você precisará ter estados para esses palpites também e iterar sobre eles de forma similar.
    // Exemplo:
    // for (const groupPrediction of groupPredictions) { ... salvar ... }
    // for (const finalPrediction of finalPredictions) { ... salvar ... }

    setSubmitting(false);

    if (allSuccess && successfulCount > 0) {
      toast.success("Todos os palpites válidos foram confirmados com sucesso!");
    } else if (successfulCount > 0) {
        toast.warning(`Alguns palpites foram confirmados (${successfulCount}). ${skippedCount > 0 ? `No entanto, ${skippedCount} foram ignorados (prazo encerrado ou incompletos).` : ''}`);
    } else {
        toast.error("Nenhum palpite válido foi salvo. Verifique os prazos e preenchimento.");
    }
  };


  // ... (handlePrintReceipt e outras lógicas existentes) ...

  // Ref para o container de impressão
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrintReceipt = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para imprimir o comprovante.");
      return;
    }

    // Você precisará buscar os dados necessários para o comprovante aqui,
    // já que DailyPredictions só gerencia os inputs.
    // Ou passar os dados já existentes em 'matchPredictionsFromDaily'
    // e buscar os dados das partidas que correspondem a eles.
    try {
        const { data: userMatches, error: userMatchesError } = await supabase
            .from('matches')
            .select('*, home_team(*), away_team(*)')
            .in('id', matchPredictionsFromDaily.map(p => p.match_id));

        if (userMatchesError) throw userMatchesError;

        const predictionsForReceipt = matchPredictionsFromDaily.map(p => {
            const matchDetail = userMatches.find(m => m.id === p.match_id);
            if (!matchDetail) return null; // Ou trate o erro

            return {
                match: matchDetail,
                home_score_prediction: Number(p.home_score),
                away_score_prediction: Number(p.away_score),
            };
        }).filter(Boolean); // Remove nulos

        if (predictionsForReceipt.length === 0) {
            toast.warning("Nenhum palpite para gerar comprovante.");
            return;
        }

        const receiptComponent = (
            <PredictionReceipt
                user={{ id: user.id, name: user.user_metadata?.full_name || user.email || 'Usuário', avatar_url: user.user_metadata?.avatar_url || '' }}
                predictions={predictionsForReceipt as any} // Cast provisório, ajuste os tipos
            />
        );

        const printContent = ReactDOMServer.renderToString(receiptComponent);
        const printWindow = window.open('', '', 'height=600,width=800');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Comprovante de Palpites</title>');
            // Inclua estilos se necessário, por exemplo, carregando um CSS específico para impressão
            // printWindow.document.write('<link rel="stylesheet" href="/path/to/print.css">');
            printWindow.document.write('</head><body>');
            printWindow.document.write(printContent);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        } else {
            toast.error("Erro ao abrir janela de impressão. Verifique se pop-ups estão bloqueados.");
        }
    } catch (error: any) {
        console.error("Erro ao gerar comprovante:", error);
        toast.error("Erro ao gerar comprovante: " + error.message);
    }
};


  useEffect(() => {
    // Redireciona se o usuário não estiver logado
    if (!user) {
      navigate("/login");
      toast.warning("Você precisa estar logado para acessar os palpites.");
    }
  }, [user, navigate, toast]);


  return (
    <Layout>
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-center text-fifa-blue mb-6">
          Seus Palpites
        </h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-3 mb-6">
            <TabsTrigger value="matches">
              <SoccerBallIcon className="mr-2 h-4 w-4" /> Partidas
            </TabsTrigger>
            <TabsTrigger value="groups">
              <UsersIcon className="mr-2 h-4 w-4" /> Grupos
            </TabsTrigger>
            <TabsTrigger value="final">
              <TrophyIcon className="mr-2 h-4 w-4" /> Final
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matches">
            {/* O DailyPredictions agora é renderizado aqui e gerencia seus próprios estados */}
            <DailyPredictions onPredictionsChange={setMatchPredictionsFromDaily} />
          </TabsContent>

          <TabsContent value="groups">
            <Card>
              <CardHeader>
                <CardTitle className="text-fifa-blue">Palpites de Grupos</CardTitle>
                <CardDescription>
                  Selecione os dois times que você acha que se classificarão de cada grupo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="default">
                  <AlertTitle>Prazo para Palpites de Grupo</AlertTitle>
                  <AlertDescription>
                    Os palpites de grupo devem ser enviados até{" "}
                    <span className="font-semibold">
                      {format(globalPredictionCutoffDate, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                    .
                  </AlertDescription>
                </Alert>
                {/* Lógica para palpites de grupo aqui */}
                <p className="text-gray-600">Conteúdo para palpites de grupos.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="final">
            <Card>
              <CardHeader>
                <CardTitle className="text-fifa-blue">Palpites da Final</CardTitle>
                <CardDescription>
                  Palpite quem será o campeão, vice, terceiro e quarto lugar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
              <Alert variant="default">
                  <AlertTitle>Prazo para Palpites da Final</AlertTitle>
                  <AlertDescription>
                    Os palpites da fase final devem ser enviados até{" "}
                    <span className="font-semibold">
                      {format(finalPredictionCutoffDate, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                    .
                  </AlertDescription>
                </Alert>
                {/* Lógica para palpites de final aqui */}
                <p className="text-gray-600">Conteúdo para palpites da final.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-6">
          <CardContent className="p-6 space-y-4">

            <Button
              className="w-full bg-fifa-blue hover:bg-opacity-90 mb-4"
              onClick={handleSubmitBets}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar Palpites'
              )}
            </Button>

            {/* Botão para Imprimir Comprovante */}
            <Button
              className="w-full bg-gray-600 hover:bg-gray-700 text-white"
              onClick={handlePrintReceipt}
              disabled={submitting || !user}
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir Comprovante
            </Button>

            <p className="text-sm text-gray-500 text-center">
              Atenção: Ao confirmar, os palpites de partidas com prazo encerrado e palpites de grupo/final após o dia {format(globalPredictionCutoffDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })} não serão salvos.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Palpites;