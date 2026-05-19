<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Comprovante de Palpites</title>
    <style>
        @page {
            size: A4;
            margin: 12mm 10mm 15mm 10mm;
            @bottom-right {
                content: "Página " counter(page) " de " counter(pages);
                font-family: Arial, sans-serif; font-size: 7.5pt; color: #718096;
            }
            @bottom-left {
                content: "Emitido em: " attr(data-emission); /* Preenchido via JS */
                font-family: Arial, sans-serif; font-size: 7.5pt; color: #718096;
            }
        }
        
        *, *::before, *::after { box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif; margin: 0; padding: 0;
            color: #2d3748; font-size: 8pt; line-height: 1.15;
        }

        /* Top Header */
        .header {
            padding: 12px; background-color: #1a202c; color: #ffffff;
            margin-bottom: 10px; border-radius: 4px;
        }
        .header-table { width: 100%; border-collapse: collapse; }
        .header h1 { font-size: 12pt; margin: 0 0 2px 0; color: #f7fafc; letter-spacing: 0.5px; }
        .header p { font-size: 7.5pt; margin: 0; color: #a0aec0; }
        .user-box { text-align: right; font-size: 9pt; font-weight: bold; color: #38a169; }

        h2 {
            font-size: 9.5pt; color: #1a202c; margin: 10px 0 5px 0;
            padding-bottom: 2px; border-bottom: 1.5px solid #e2e8f0;
            text-transform: uppercase; page-break-after: avoid;
        }

        /* Layout Dinâmico de Grupos (A até L) */
        .groups-grid {
            display: flex; flex-wrap: wrap; justify-content: space-between;
        }
        .group-card {
            width: 49%; margin-bottom: 6px; page-break-inside: avoid;
        }
        .group-title {
            font-size: 7.5pt; font-weight: bold; background-color: #edf2f7;
            padding: 2px 5px; border-radius: 2px; border-left: 2px solid #4a5568;
        }

        /* Tabela de Jogos Enxuta */
        .match-table { width: 100%; border-collapse: collapse; }
        .match-table td {
            padding: 3px 2px; border-bottom: 1px dashed #e2e8f0; font-size: 7.5pt; vertical-align: middle;
        }
        .team-left { text-align: right; width: 37%; font-weight: 500; }
        .team-right { text-align: left; width: 37%; font-weight: 500; }
        .score {
            text-align: center; width: 12%; font-weight: bold;
            background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 2px;
        }
        .timestamp { width: 14%; text-align: right; color: #a0aec0; font-size: 6.5pt; font-family: monospace; }

        /* Página 2: Finais */
        .finals-layout { width: 100%; border-collapse: collapse; margin-top: 5px; }
        .finals-layout td { width: 50%; vertical-align: top; padding: 0 5px; }
        .podium-list { margin: 0; padding: 0; list-style: none; }
        .podium-item { padding: 4px 0; border-bottom: 1px solid #edf2f7; font-size: 8pt; }
        .pos { font-weight: bold; color: #4a5568; margin-right: 5px; }
        
        .page-break { page-break-before: always; }
    </style>
</head>
<body data-emission="19/05/2026 10:54"> <div class="header">
        <table class="header-table">
            <tr>
                <td>
                    <h1>COMPROVANTE OFICIAL DE PALPITES</h1>
                    <p>Bolão Expandido Copa do Mundo 2026</p>
                </td>
                <td class="user-box">
                    <span>Diego Moreira</span>
                </td>
            </tr>
        </table>
    </div>

    <h2>1. Fase de Grupos (72 Partidas)</h2>
    <div class="groups-grid">
        <div class="group-card">
            <div class="group-title">GRUPO A</div>
            <table class="match-table">
                <tr>
                    <td class="team-left">México</td>
                    <td class="score">2 x 1</td>
                    <td class="team-right">Angola</td>
                    <td class="timestamp">18/05 21:04</td>
                </tr>
            </table>
        </div>
        </div>

    <div class="page-break"></div>

    <h2>2. Previsão do Pódio & Placar da Final</h2>
    <table class="finals-layout">
        <tr>
            <td>
                <div class="group-title">Posicionamento Final Escolhido</div>
                <ul class="podium-list">
                    <li class="podium-item"><span class="pos">1º</span> Brasil 🏆</li>
                    <li class="podium-item"><span class="pos">2º</span> Países Baixos</li>
                    <li class="podium-item"><span class="pos">3º</span> Alemanha</li>
                    <li class="podium-item"><span class="pos">4º</span> Argentina</li>
                </ul>
            </td>
            <td>
                <div class="group-title">Resultado da Grande Final</div>
                <table class="match-table" style="margin-top: 8px;">
                    <tr>
                        <td class="team-left" style="font-size: 9pt; font-weight: bold;">Brasil</td>
                        <td class="score" style="background-color: #f0fff4; border-color: #9ae6b4; font-size: 10pt; padding: 4px 0;">2 x 1</td>
                        <td class="team-right" style="font-size: 9pt; font-weight: bold;">Países Baixos</td>
                    </tr>
                </table>
                <p style="font-size: 6.5pt; color: #a0aec0; margin-top: 10px;">
                    Salvo em: <span style="font-family: monospace;">18/05 21:22:14</span>
                </p>
            </td>
        </tr>
    </table>

    <div style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center;">
        <p style="font-size: 7pt; color: #a0aec0; font-family: monospace; margin: 0;">
            Chave ID: SHA256:{GERAR_HASH_UNICO_DO_USER}
        </p>
    </div>

    <script>
        // Dispara o diálogo de impressão/salvamento em PDF automaticamente ao carregar a página
        window.onload = function() {
            window.print();
        }
    </script>
</body>
</html>