import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const TermsOfUse: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Cabeçalho Padrão */}
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
                    <FileText className="h-8 w-8 text-fifa-gold" />
                </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-fifa-gold">Termos de Uso</h1>
            <p className="text-gray-300 mt-2">Regras e diretrizes para utilizar nossa plataforma.</p>
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
                        <h2 className="text-2xl font-bold text-fifa-blue mb-4">1. Aceitação dos Termos</h2>
                        <p>
                        Ao acessar e usar o aplicativo Clube Futuro Palpites ("Serviço"), você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com estes termos, por favor, não utilize o Serviço.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-fifa-blue mb-4">2. Descrição do Serviço</h2>
                        <p>
                        O Clube Futuro Palpites é uma plataforma digital interativa que permite aos usuários criar, gerenciar e participar de bolões de futebol em diversos campeonatos, competindo através de palpites em resultados de jogos.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-fifa-blue mb-4">3. Contas de Usuário</h2>
                        <p>
                        Para acessar certas funcionalidades, você deve criar uma conta. Você é responsável por manter a confidencialidade de sua conta e senha e por todas as atividades que ocorrem sob sua conta. Você concorda em nos notificar imediatamente sobre qualquer uso não autorizado.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-fifa-blue mb-4">4. Conduta do Usuário</h2>
                        <p className="mb-4">Você concorda em utilizar o serviço de forma ética e respeitosa, e em <strong>não</strong> usar o Serviço para:</p>
                        <ul className="list-disc pl-6 space-y-2 marker:text-fifa-gold">
                        <li>Publicar conteúdo ilegal, prejudicial, ameaçador, abusivo, difamatório, vulgar, obsceno ou censurável.</li>
                        <li>Violar quaisquer leis locais, estaduais, nacionais ou internacionais.</li>
                        <li>Personificar qualquer pessoa ou entidade ou fraudar sua afiliação.</li>
                        <li>Manipular resultados ou tentar burlar o sistema de pontuação.</li>
                        <li>Tirar sarro excessivo ou praticar bullying com outros participantes (o "fair play" é essencial!).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-fifa-blue mb-4">5. Propriedade Intelectual</h2>
                        <p>
                        O Serviço e seu conteúdo original, recursos e funcionalidades são e permanecerão propriedade exclusiva do Clube Futuro Palpites e seus licenciadores. O uso não autorizado de marcas ou conteúdo é proibido.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-fifa-blue mb-4">6. Limitação de Responsabilidade</h2>
                        <p>
                        Em nenhuma circunstância o Clube Futuro Palpites será responsável por quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos. O Clube Futuro Palpites não se responsabiliza pelas interações entre usuários, pela gestão financeira de bolões privados ou pela veracidade das informações postadas por terceiros.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-fifa-blue mb-4">7. Lei Aplicável</h2>
                        <p>
                        Estes Termos serão regidos e interpretados de acordo com as leis do Brasil, sem consideração a conflitos de disposições legais.
                        </p>
                    </section>

                    <section className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                        <h2 className="text-xl font-bold text-fifa-blue mb-2">8. Contato</h2>
                        <p>
                        Se você tiver alguma dúvida sobre estes Termos de Uso, entre em contato conosco pelo e-mail: <a href="mailto:contato@clubefuturo.com" className="text-blue-600 hover:underline font-medium">contato@clubefuturo.com</a>.
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

export default TermsOfUse;