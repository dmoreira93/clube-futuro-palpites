import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, UserCheck, Users, Trophy, ChevronUp, ChevronDown, MessageSquare, BookOpen, Ticket } from 'lucide-react';
import { useState } from 'react';

// --- URL do seu Formulário de Contato / Tickets ---
const SUPPORT_TICKET_URL = "https://docs.google.com/forms/d/e/1FAIpQLSes1345R-Ld4eWwwBD5HuqqMMCs6j3KiexlidDu09rbnApM0w/viewform?usp=dialog";

// --- URL da Imagem de Fundo ---
// Certifique-se de que a imagem hero-bg.png (sem texto) está na pasta public.
const HERO_BG_IMAGE = "/hero-bg.png"; 

// --- Componente para Dúvidas Frequentes (FAQ) ---
const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <Card className="shadow-md">
            <CardHeader 
                className="flex flex-row items-center justify-between cursor-pointer py-3 px-4" 
                onClick={() => setIsOpen(!isOpen)}
            >
                <CardTitle className="text-sm font-semibold">{question}</CardTitle>
                {isOpen ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4" />}
            </CardHeader>
            {isOpen && (
                <CardContent className="pt-2 pb-4 px-4 text-sm text-muted-foreground transition-all duration-300">
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
        <div className="flex flex-col min-h-screen bg-background" id="top">
            
            {/* --- CABEÇALHO --- */}
            <header className="bg-fifa-blue text-white shadow-lg sticky top-0 z-40 border-b border-white/10">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center py-3 h-16">
                        <Link to="/" className="flex items-center space-x-2 group">
                            <BarChart3 className="w-8 h-8 text-fifa-gold group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-lg text-fifa-gold">Futuro Palpites</span>
                        </Link>
                        
                        {/* BOTÕES DE AÇÃO NO CABEÇALHO */}
                        <div className="flex items-center space-x-3">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => navigate("/cadastro")} 
                                // Estilo: Borda Dourada, Fundo Transparente (Hover Dourado)
                                className="border-fifa-gold text-fifa-gold bg-transparent hover:bg-fifa-gold hover:text-fifa-blue font-semibold transition-all duration-300 hover:shadow-[0_0_10px_rgba(255,215,0,0.5)]"
                            >
                                Cadastrar
                            </Button>
                            <Button 
                                size="sm" 
                                onClick={() => navigate("/login")} 
                                // Estilo: Fundo Dourado (Hover mais brilhante)
                                className="bg-gradient-to-b from-yellow-400 to-fifa-gold text-fifa-blue font-bold shadow-md hover:shadow-[0_0_15px_rgba(255,215,0,0.6)] hover:scale-105 transition-all duration-300 border border-yellow-300"
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
                    className="relative bg-cover bg-center text-white py-24 md:py-40 flex items-center justify-center"
                    style={{ 
                        backgroundImage: `url('${HERO_BG_IMAGE}')`,
                    }}
                >
                    {/* Overlay com gradiente para dar profundidade e destacar o centro */}
                    <div className="absolute inset-0 bg-gradient-to-b from-fifa-blue/80 via-fifa-blue/60 to-fifa-blue/90"></div>

                    <div className="container mx-auto px-4 text-center relative z-10 max-w-4xl">
                        <h1 className="text-4xl md:text-7xl font-extrabold mb-6 drop-shadow-2xl tracking-tight leading-tight">
                            <span className="text-fifa-gold block mb-2">Crie seu Bolão</span> 
                            de Futebol Personalizado.
                        </h1>
                        <p className="text-lg md:text-2xl mb-10 font-light text-gray-200 drop-shadow-md max-w-2xl mx-auto leading-relaxed">
                            Organize campeonatos com seus amigos, defina as regras de pontuação, premiação e punição de forma simples e transparente.
                        </p>
                        
                        {/* BOTÃO HERO ESTILIZADO */}
                        <Button 
                            size="lg" 
                            onClick={() => navigate("/cadastro")} 
                            // Estilo Premium: Gradiente Dourado, Sombra e Efeito de Pulso
                            className="bg-gradient-to-r from-yellow-500 via-fifa-gold to-yellow-500 text-fifa-blue text-lg md:text-xl font-bold py-6 px-8 rounded-full shadow-[0_0_20px_rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.6)] hover:scale-105 transition-all duration-300 border-2 border-yellow-300 animate-pulse-slow"
                        >
                            Comece a Criar Seu Bolão!
                        </Button>
                    </div>
                </section>
                
                {/* --- SEÇÃO 2: ESTATÍSTICAS --- */}
                <section className="bg-white py-16 relative z-20 -mt-8 rounded-t-[3rem] shadow-2xl border-t border-gray-100">
                    <div className="container mx-auto px-4">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                            <div className="p-6 rounded-xl hover:bg-gray-50 transition-colors duration-300">
                                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trophy className="h-8 w-8 text-fifa-blue" />
                                </div>
                                <h3 className="text-4xl font-bold text-fifa-blue mb-1">2+</h3>
                                <p className="text-muted-foreground font-medium">Bolões Criados</p>
                            </div>
                            <div className="p-6 rounded-xl hover:bg-gray-50 transition-colors duration-300">
                                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="h-8 w-8 text-fifa-blue" />
                                </div>
                                <h3 className="text-4xl font-bold text-fifa-blue mb-1">15+</h3>
                                <p className="text-muted-foreground font-medium">Participantes Ativos</p>
                            </div>
                            <div className="p-6 rounded-xl hover:bg-gray-50 transition-colors duration-300">
                                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <UserCheck className="h-8 w-8 text-fifa-blue" />
                                </div>
                                <h3 className="text-4xl font-bold text-fifa-blue mb-1">500+</h3>
                                <p className="text-muted-foreground font-medium">Palpites Registrados</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- SEÇÃO 3: COMO FUNCIONA --- */}
                <section className="py-20 bg-gray-50" id="como-comecar">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-fifa-blue mb-4">É Fácil Começar</h2>
                            <p className="text-muted-foreground text-lg">Em apenas 3 passos você cria seu bolão e convida a galera.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                            {/* Linha conectora (visível apenas em desktop) */}
                            <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 transform -translate-y-1/2"></div>

                            <Card className="text-center p-8 shadow-lg hover:shadow-xl transition-all duration-300 bg-white border-none relative transform hover:-translate-y-2">
                                <div className="w-16 h-16 bg-fifa-blue text-fifa-gold rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 border-4 border-white shadow-lg relative z-10">1</div>
                                <CardTitle className="mb-3 text-xl text-gray-800">Crie o Campeonato</CardTitle>
                                <CardDescription className="text-base">Selecione um campeonato existente ou crie o seu do zero.</CardDescription>
                            </Card>
                            <Card className="text-center p-8 shadow-lg hover:shadow-xl transition-all duration-300 bg-white border-none relative transform hover:-translate-y-2">
                                <div className="w-16 h-16 bg-fifa-blue text-fifa-gold rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 border-4 border-white shadow-lg relative z-10">2</div>
                                <CardTitle className="mb-3 text-xl text-gray-800">Defina as Regras</CardTitle>
                                <CardDescription className="text-base">Configure prêmios, taxas, punições e o prazo final.</CardDescription>
                            </Card>
                            <Card className="text-center p-8 shadow-lg hover:shadow-xl transition-all duration-300 bg-white border-none relative transform hover:-translate-y-2">
                                <div className="w-16 h-16 bg-fifa-blue text-fifa-gold rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 border-4 border-white shadow-lg relative z-10">3</div>
                                <CardTitle className="mb-3 text-xl text-gray-800">Convide e Palpite!</CardTitle>
                                <CardDescription className="text-base">Compartilhe o código e comece a pontuar em tempo real.</CardDescription>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* --- SEÇÃO 4: FAQ --- */}
                <section className="py-20 bg-white" id="faq">
                    <div className="container mx-auto px-4">
                        <h2 className="text-3xl font-bold text-center mb-12 text-fifa-blue">Dúvidas Frequentes</h2>
                        <div className="max-w-3xl mx-auto space-y-4">
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
            <footer className="bg-fifa-blue text-white py-12 border-t border-white/10">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
                        
                        <div className="col-span-1 md:col-span-1">
                            <div className="flex items-center space-x-2 mb-4">
                                <BarChart3 className="w-6 h-6 text-fifa-gold" />
                                <span className="font-bold text-xl text-white">Futuro Palpites</span>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                A plataforma definitiva para organizar seus bolões de futebol com amigos e colegas. Simples, rápido e divertido.
                            </p>
                        </div>
                        
                        <div>
                            <h5 className="font-bold text-fifa-gold mb-4 uppercase text-sm tracking-wider">Navegação</h5>
                            <ul className="space-y-2 text-sm text-gray-300">
                                <li><a href="#top" onClick={scrollToTop} className="hover:text-white transition-colors cursor-pointer">Início</a></li>
                                <li><a href="#como-comecar" className="hover:text-white transition-colors">Como Começar</a></li>
                                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h5 className="font-bold text-fifa-gold mb-4 uppercase text-sm tracking-wider">Legal</h5>
                            <ul className="space-y-2 text-sm text-gray-300">
                                <li><a href="/PrivacyPolicy" className="hover:text-white transition-colors">Políticas de Privacidade</a></li>
                                <li><a href="/TermsOfUse" className="hover:text-white transition-colors">Termos de Uso</a></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h5 className="font-bold text-fifa-gold mb-4 uppercase text-sm tracking-wider">Suporte</h5>
                            <ul className="space-y-3 text-sm text-gray-300">
                                <li>
                                    <a 
                                        href={SUPPORT_TICKET_URL} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="hover:text-white transition-colors flex items-center group"
                                    >
                                        <span className="bg-white/10 p-1.5 rounded-md mr-2 group-hover:bg-fifa-gold group-hover:text-fifa-blue transition-all">
                                            <Ticket className="h-4 w-4"/>
                                        </span>
                                        Abrir Chamado
                                    </a>
                                </li>
                                <li>
                                    <a href="/criterios" className="hover:text-white transition-colors flex items-center group">
                                        <span className="bg-white/10 p-1.5 rounded-md mr-2 group-hover:bg-fifa-gold group-hover:text-fifa-blue transition-all">
                                            <BookOpen className="h-4 w-4"/>
                                        </span>
                                        Ver Critérios
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="border-t border-white/10 mt-12 pt-8 text-center text-sm text-gray-500">
                        &copy; {new Date().getFullYear()} Futuro Palpites. Todos os direitos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;