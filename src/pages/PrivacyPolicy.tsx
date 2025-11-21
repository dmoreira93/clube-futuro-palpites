import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Cabeçalho Padrão para Páginas Informativas */}
      <div className="bg-fifa-blue text-white py-10 px-4 text-center shadow-md">
        <div className="container mx-auto relative max-w-4xl">
            <Button 
                variant="ghost" 
                className="absolute left-0 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 hidden md:flex"
                onClick={() => navigate(-1)}
            >
                <ArrowLeft className="h-5 w-5 mr-2" /> Voltar
            </Button>
            <div className="flex justify-center mb-4">
                <div className="bg-white/10 p-3 rounded-full">
                    <Shield className="h-8 w-8 text-fifa-gold" />
                </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-fifa-gold">Política de Privacidade</h1>
            <p className="text-gray-300 mt-2">Como tratamos seus dados com transparência e segurança.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl flex-grow">
        <Card className="shadow-lg border-t-4 border-t-fifa-gold">
            <CardContent className="p-8 md:p-12">
                <p className="mb-8 text-sm text-muted-foreground text-right border-b pb-4">
                    Última atualização: 18/11/2025
                </p>

                <div className="space-y-8 text-gray-700 leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-bold text-fifa-blue mb-4">1. Introdução</h2>
                        <p>
                        Bem-vindo ao Clube Futuro Palpites. Levamos a sua privacidade a sério. Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas informações quando você utiliza nosso aplicativo e serviços. Ao usar o Clube Futuro Palpites, você concorda com a coleta e uso de informações de acordo com esta política.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-fifa-blue mb-4">2. Informações que Coletamos</h2>
                        <p className="mb-4">Podemos coletar informações sobre você de diversas formas:</p>
                        <ul className="list-disc pl-6 space-y-2 marker:text-fifa-gold">
                        <li><strong>Informações Pessoais Identificáveis:</strong> Nome, endereço de e-mail, apelido e foto de perfil, que você fornece voluntariamente ao se registrar ou usar certas funcionalidades.</li>
                        <li><strong>Dados de Uso:</strong> Informações sobre como você usa o aplicativo, seus palpites, pontuações e interações nos bolões, coletadas automaticamente.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-fifa-blue mb-4">3. Como Usamos Suas Informações</h2>
                        <p className="mb-4">Usamos as informações coletadas para:</p>
                        <ul className="list-disc pl-6 space-y-2 marker:text-fifa-gold">
                        <li>Fornecer, operar e manter nosso aplicativo de bolões.</li>
                        <li>Melhorar, personalizar e expandir as funcionalidades do jogo.</li>
                        <li>Entender e analisar como você usa nosso aplicativo para criar melhores experiências.</li>
                        <li>Desenvolver novos produtos, serviços e tipos de pontuação.</li>
                        <li>Comunicar com você (suporte, atualizações sobre jogos, marketing relacionado).</li>
                        <li>Processar suas transações e gerenciar a associação aos bolões.</li>
                        <li>Encontrar e prevenir fraudes ou manipulação de resultados.</li>
                        <li>Cumprir obrigações legais.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-fifa-blue mb-4">4. Compartilhamento de Informações</h2>
                        <p>
                        Não compartilhamos suas informações pessoais identificáveis com terceiros para fins de marketing sem seu consentimento. Seus dados de palpites e ranking são públicos dentro do contexto dos bolões que você participa.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-fifa-blue mb-4">5. Seus Direitos (LGPD)</h2>
                        <p>
                        De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem o direito de acessar, corrigir, excluir ou solicitar a portabilidade de seus dados. Para exercer esses direitos, entre em contato conosco através do nosso canal de suporte.
                        </p>
                    </section>

                    <section className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                        <h2 className="text-xl font-bold text-fifa-blue mb-2">6. Contato</h2>
                        <p>
                        Se você tiver alguma dúvida sobre esta Política de Privacidade, entre em contato conosco pelo e-mail: <a href="mailto:contato@clubefuturo.com" className="text-blue-600 hover:underline font-medium">contato@clubefuturo.com</a>.
                        </p>
                    </section>
                </div>
            </CardContent>
        </Card>
        
        <div className="text-center mt-8">
            <Button variant="outline" onClick={() => navigate(-1)} className="md:hidden">
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
            </Button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;