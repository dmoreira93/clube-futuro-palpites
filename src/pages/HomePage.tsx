import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, UserCheck, Users, Trophy, ChevronUp, ChevronDown, MessageSquare, BookOpen, Ticket, Goal } from 'lucide-react'; // Adicionei Goal
import { useState } from 'react';

// --- URL do seu Formulário de Contato / Tickets ---
const SUPPORT_TICKET_URL = "https://docs.google.com/forms/d/e/1FAIpQLSes1345R-Ld4eWwwBD5HuqqMMCs6j3KiexlidDu09rbnApM0w/viewform?usp=dialog";

// --- URL da Imagem de Fundo ---
const HERO_BG_IMAGE = "/hero-bg.png"; 

// --- Componente para Dúvidas Frequentes (FAQ) ---
const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader 
                className="flex flex-row items-center justify-between cursor-pointer py-4 px-6" 
                onClick={() => setIsOpen(!isOpen)}
            >
                <CardTitle className="text-base font-semibold text-gray-800">{question}</CardTitle>
                {isOpen ? <ChevronUp className="h-5 w-5 text-fifa-gold" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
            </CardHeader>
            {isOpen && (
                <CardContent className="pt-0 pb-4 px-6 text-sm text-gray-600 leading-relaxed animate-in slide-in-from-top-2">
                    {answer}
                </CardContent>
            )}
        </Card>
    );
};

// --- Componente principal da Nova Landing Page ---
const HomePage = () => {
    const navigate = useNavigate();

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="flex flex-col min-h-screen bg-background font-sans" id="top">
            
            {/* --- CABEÇALHO --- */}
            <header className="bg-fifa-blue text-white shadow-lg sticky top-0 z-50 border-b border-white/10 backdrop-blur-md bg-opacity-95">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center py-3 h-16">
                        <Link to="/" className="flex items-center space-x-2 group transition-opacity hover:opacity-90">
                            <BarChart3 className="w-8 h-8 text-fifa-gold group-hover:scale-110 transition-transform duration-300" />
                            <span className="font-bold text-xl text-fifa-gold tracking-tight">Futuro Palpites</span>
                        </Link>
                        
                        {/* BOTÕES DE AÇÃO NO CABEÇALHO */}
                        <div className="flex items-center space-x-3">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => navigate("/cadastro")} 
                                className="hidden sm:flex border-fifa-gold text-fifa-gold bg-transparent hover:bg-fifa-gold hover:text-fifa-blue font-semibold transition-all duration-300"
                            >
                                Cadastrar
                            </Button>
                            <Button 
                                size="sm" 
                                onClick={() => navigate("/login")} 
                                className="bg-gradient-to-b from-yellow-400 to-fifa-gold text-fifa-blue font-bold shadow-md hover:shadow-[0_0_15px_rgba(255,215,0,0.5)] hover:scale-105 transition-all duration-300 border border-yellow-300"
                            >
                                Entrar
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-grow">
                
                {/* --- SEÇÃO 1: HERO / APRESENTAÇÃO --- */}
                <section 
                    className="relative bg-cover text-white py-32 md:py-48 flex items-center justify-center overflow-hidden"
                    style={{ 
                        backgroundImage: `url('${HERO_BG_IMAGE}')`,
                        backgroundPosition: 'center 30%', // Ajuste fino para mostrar mais a bola/estádio
                        backgroundSize: 'cover'
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-fifa-blue/80 via-fifa-blue/50 to-fifa-blue/90"></div>

                    <div className="container mx-auto px-4 text-center relative z-10 max-w-4xl">
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 drop-shadow-2xl tracking-tight leading-tight animate-in fade-in zoom-in duration-700">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-fifa-gold to-yellow-300 block mb-2">Crie seu Bolão</span> 
                            de Futebol Personalizado.
                        </h1>
                        <p className="text-lg md:text-2xl mb-10 font-light text-gray-100 drop-shadow-md max-w-2xl mx-auto leading-relaxed bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                            Organize campeonatos com seus amigos, defina as regras de pontuação, premiação e punição de forma simples e transparente.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in slide-in-from-bottom-4 duration-700 delay-200">
                            <Button 
                                size="lg" 
                                onClick={() => navigate("/cadastro")} 
                                className="w-full sm:w-auto bg-gradient-to-r from-yellow-500 via-fifa-gold to-yellow-500 text-fifa-blue text-lg font-bold py-6 px-8 rounded-full shadow-[0_0_20px_rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.6)] hover:scale-105 transition-all duration-300 border-2 border-yellow-300"
                            >
                                Comece a Criar Seu Bolão!
                            </Button>
                            
                            {/* LINK SECUNDÁRIO PARA CRITÉRIOS (NOVO) */}
                            <Button
                                variant="link"
                                onClick={() => navigate("/criterios")}
                                className="text-gray-200 hover:text-fifa-gold underline-offset-4 hover:underline transition-colors flex items-center gap-2 text-base"
                            >
                                <BookOpen className="h-4 w-4" />
                                Ver critérios de pontuação
                            </Button>
                        </div>
                    </div>
                </section>
                
                {/* --- SEÇÃO 2: ESTATÍSTICAS --- */}
                <section className="bg-gray-50 py-16 relative z-20 -mt-12 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                    <div className="container mx-auto px-4">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-5xl mx-auto">
                            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trophy className="h-8 w-8 text-fifa-blue" />
                                </div>
                                <h3 className="text-4xl font-black text-fifa-blue mb-1">2+</h3>
                                <p className="text-gray-600 font-medium">Bolões Criados</p>
                            </div>
                            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="h-8 w-8 text-fifa-blue" />
                                </div>
                                <h3 className="text-4xl font-black text-fifa-blue mb-1">15+</h3>
                                <p className="text-gray-600 font-medium">Participantes Ativos</p>
                            </div>
                            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <UserCheck className="h-8 w-8 text-fifa-blue" />
                                </div>
                                <h3 className="text-4xl font-black text-fifa-blue mb-1">500+</h3>
                                <p className="text-gray-600 font-medium">Palpites Registrados</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- SEÇÃO 3: É FÁCIL COMEÇAR --- */}
                <section className="py-20 bg-white" id="como-comecar">
                    <div className="container mx-auto px-4 max-w-6xl">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-fifa-blue mb-4">É Fácil Começar</h2>
                            <p className="text-gray-500 text-lg max-w-2xl mx-auto">Em apenas 3 passos você cria seu bolão, convida a galera e começa a diversão.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                            {/* Linha conectora (desktop) */}
                            <div className="hidden md:block absolute top-12 left-[16%] w-[68%] h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent -z-10"></div>

                            <Card className="text-center p-8 pt-12 shadow-lg hover:shadow-xl transition-all duration-300 bg-white border border-gray-100 relative group">
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-fifa-blue text-fifa-gold rounded-full flex items-center justify-center text-2xl font-bold border-4 border-white shadow-md group-hover:scale-110 transition-transform duration-300">1</div>
                                <CardTitle className="mb-3 text-xl text-gray-900">Crie o Campeonato</CardTitle>
                                <CardDescription className="text-base text-gray-600">Selecione um campeonato existente ou crie o seu do zero.</CardDescription>
                            </Card>
                            
                            <Card className="text-center p-8 pt-12 shadow-lg hover:shadow-xl transition-all duration-300 bg-white border border-gray-100 relative group">
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-fifa-blue text-fifa-gold rounded-full flex items-center justify-center text-2xl font-bold border-4 border-white shadow-md group-hover:scale-110 transition-transform duration-300">2</div>
                                <CardTitle className="mb-3 text-xl text-gray-900">Defina as Regras</CardTitle>
                                <CardDescription className="text-base text-gray-600">Configure prêmios, taxas, punições e o prazo final.</CardDescription>
                            </Card>
                            
                            <Card className="text-center p-8 pt-12 shadow-lg hover:shadow-xl transition-all duration-300 bg-white border border-gray-100 relative group">
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-fifa-blue text-fifa-gold rounded-full flex items-center justify-center text-2xl font-bold border-4 border-white shadow-md group-hover:scale-110 transition-transform duration-300">3</div>
                                <CardTitle className="mb-3 text-xl text-gray-900">Convide e Palpite!</CardTitle>
                                <CardDescription className="text-base text-gray-600">Compartilhe o código e comece a pontuar em tempo real.</CardDescription>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* --- NOVA SEÇÃO: CONHEÇA NOSSOS CRITÉRIOS (DESTACADA) --- */}
                <section className="py-20 bg-fifa-blue text-white relative overflow-hidden">
                    {/* Elementos decorativos de fundo */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="absolute -top-24 -left-24 w-96 h-96 bg-fifa-gold rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-400 rounded-full blur-3xl"></div>
                    </div>

                    <div className="container mx-auto px-4 relative z-10 text-center">
                        <Goal className="w-12 h-12 text-fifa-gold mx-auto mb-6 animate-bounce" />
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Sistema de Pontuação Justo e Emocionante</h2>
                        <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
                            Do "Placar Exato" ao "Bônus de Campeão", nosso sistema recompensa quem realmente entende de futebol. Entenda cada detalhe antes de começar.
                        </p>
                        <Button 
                            size="lg"
                            variant="outline"
                            onClick={() => navigate("/criterios")}
                            className="border-fifa-gold text-fifa-gold hover:bg-fifa-gold hover:text-fifa-blue font-bold px-8 py-6 rounded-full text-lg transition-all duration-300"
                        >
                            Ver Tabela de Pontos Completa
                        </Button>
                    </div>
                </section>

                {/* --- SEÇÃO 4: FAQ --- */}
                <section className="py-20 bg-gray-50" id="faq">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <h2 className="text-3xl font-bold text-center mb-12 text-fifa-blue">Dúvidas Frequentes</h2>
                        <div className="space-y-4">
                            <FAQItem 
                                question="O que acontece se eu esquecer de palpitar?"
                                answer="Se o prazo de um jogo específico ou o prazo final do bolão for atingido, você não poderá mais enviar ou alterar seus palpites para aquela etapa."
                            />
                            <FAQItem 
                                question="Como o sistema calcula a pontuação?"
                                answer="A pontuação é baseada nos critérios definidos pelo criador do bolão (ex: placar exato, resultado correto, acerto de campeão). Consulte a página 'Critérios' dentro do seu bolão ativo."
                            />
                            <FAQItem 
                                question="Como eu recebo o código de convite?"
                                answer="Após criar seu bolão, um código único será gerado e exibido no painel do seu bolão. Basta copiar e compartilhar com seus amigos!"
                            />
                            <FAQItem 
                                question="Posso participar de mais de um bolão?"
                                answer="Sim! Você pode criar ou entrar em quantos bolões quiser, desde que tenha o código de convite e cumpra as regras de cada bolão."
                            />
                        </div>
                    </div>
                </section>
            </main>

            {/* --- RODAPÉ --- */}
            <footer className="bg-[#0f1420] text-white py-12 border-t border-white/5">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-16">
                        
                        <div className="col-span-1 md:col-span-1">
                            <div className="flex items-center space-x-2 mb-6">
                                <BarChart3 className="w-6 h-6 text-fifa-gold" />
                                <span className="font-bold text-xl text-white">Futuro Palpites</span>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed mb-6">
                                A plataforma definitiva para organizar seus bolões de futebol com amigos e colegas. Simples, rápido e divertido.
                            </p>
                        </div>
                        
                        <div>
                            <h5 className="font-bold text-fifa-gold mb-6 uppercase text-xs tracking-widest">Navegação</h5>
                            <ul className="space-y-3 text-sm text-gray-400">
                                <li><a href="#top" onClick={scrollToTop} className="hover:text-white transition-colors cursor-pointer block py-1">Início</a></li>
                                <li><a href="#como-comecar" className="hover:text-white transition-colors block py-1">Como Começar</a></li>
                                <li><a href="#faq" className="hover:text-white transition-colors block py-1">FAQ</a></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h5 className="font-bold text-fifa-gold mb-6 uppercase text-xs tracking-widest">Legal</h5>
                            <ul className="space-y-3 text-sm text-gray-400">
                                <li><a href="/PrivacyPolicy" className="hover:text-white transition-colors block py-1">Políticas de Privacidade</a></li>
                                <li><a href="/TermsOfUse" className="hover:text-white transition-colors block py-1">Termos de Uso</a></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h5 className="font-bold text-fifa-gold mb-6 uppercase text-xs tracking-widest">Suporte</h5>
                            <ul className="space-y-4 text-sm text-gray-400">
                                <li>
                                    <a 
                                        href={SUPPORT_TICKET_URL} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="hover:text-white transition-colors flex items-center group"
                                    >
                                        <span className="bg-white/5 p-2 rounded-lg mr-3 group-hover:bg-fifa-gold group-hover:text-fifa-blue transition-all duration-300">
                                            <Ticket className="h-4 w-4"/>
                                        </span>
                                        Abrir Chamado
                                    </a>
                                </li>
                                <li>
                                    <a href="/criterios" className="hover:text-white transition-colors flex items-center group">
                                        <span className="bg-white/5 p-2 rounded-lg mr-3 group-hover:bg-fifa-gold group-hover:text-fifa-blue transition-all duration-300">
                                            <BookOpen className="h-4 w-4"/>
                                        </span>
                                        Ver Critérios
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="border-t border-white/5 mt-16 pt-8 text-center text-sm text-gray-600 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p>&copy; {new Date().getFullYear()} Futuro Palpites. Todos os direitos reservados.</p>
                        <p className="text-xs">Feito com ⚽ e código.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;