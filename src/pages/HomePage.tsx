import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, UserCheck, Users, Trophy, ChevronUp, ChevronDown, MessageSquare, BookOpen } from 'lucide-react';
import { useState } from 'react';

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
            
            {/* --- CABEÇALHO (MANTIDO SIMPLIFICADO) --- */}
            <header className="bg-fifa-blue text-white shadow-lg sticky top-0 z-40">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center py-3 h-16">
                        <Link to="/" className="flex items-center space-x-2">
                            <BarChart3 className="w-8 h-8 text-fifa-gold" />
                            <span className="font-bold text-lg text-fifa-gold">Futuro Palpites</span>
                        </Link>
                        
                        {/* BOTÕES DE AÇÃO */}
                        <div className="flex items-center space-x-3">
                            <Button variant="outline" size="sm" onClick={() => navigate("/cadastro")} className="border-fifa-gold text-fifa-gold bg-transparent hover:bg-fifa-gold hover:text-white">
                                Cadastrar
                            </Button>
                            <Button size="sm" onClick={() => navigate("/login")} className="bg-fifa-gold text-fifa-blue hover:bg-opacity-90">
                                Entrar
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-grow">
                
                {/* --- SEÇÃO 1: HERO / APRESENTAÇÃO --- */}
                <section className="bg-gradient-to-r from-fifa-blue to-blue-900 text-white py-20 md:py-32">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 drop-shadow-lg">
                            Crie seu Bolão de Futebol Personalizado.
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 font-light max-w-3xl mx-auto">
                            Organize campeonatos com seus amigos, defina as regras de pontuação, premiação e punição de forma simples e transparente.
                        </p>
                        <Button size="lg" onClick={() => navigate("/cadastro")} className="bg-fifa-gold text-fifa-blue hover:bg-yellow-400 font-bold shadow-xl animate-pulse-slow">
                            Comece a Criar Seu Bolão!
                        </Button>
                    </div>
                </section>
                
                {/* --- SEÇÃO 2: ESTATÍSTICAS E CONVITE --- */}
                <section className="bg-gray-50 py-16">
                    <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <Card className="p-6 shadow-lg bg-white">
                            <Trophy className="h-10 w-10 text-primary mx-auto mb-3" />
                            <CardTitle className="text-3xl font-bold text-fifa-blue">3+</CardTitle>
                            <CardDescription>Bolões Criados</CardDescription>
                        </Card>
                        <Card className="p-6 shadow-lg bg-white">
                            <Users className="h-10 w-10 text-primary mx-auto mb-3" />
                            <CardTitle className="text-3xl font-bold text-fifa-blue">15+</CardTitle>
                            <CardDescription>Participantes Ativos</CardDescription>
                        </Card>
                        <Card className="p-6 shadow-lg bg-white">
                            <UserCheck className="h-10 w-10 text-primary mx-auto mb-3" />
                            <CardTitle className="text-3xl font-bold text-fifa-blue">500+</CardTitle>
                            <CardDescription>Palpites Registrados</CardDescription>
                        </Card>
                    </div>
                </section>

                {/* --- SEÇÃO 3: É FÁCIL COMEÇAR --- */}
                <section className="py-20 bg-white" id="como-comecar">
                    <div className="container mx-auto px-4">
                        <h2 className="text-3xl font-bold text-center mb-12 text-fifa-blue">É Fácil Começar (3 Passos)</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            <Card className="text-center p-6 shadow-2xl hover:shadow-primary/50 transition-shadow">
                                <div className="text-5xl font-extrabold text-fifa-gold mb-4">1</div>
                                <CardTitle className="mb-2">Crie o Campeonato</CardTitle>
                                <CardDescription>Selecione um campeonato existente ou crie o seu do zero.</CardDescription>
                            </Card>
                            <Card className="text-center p-6 shadow-2xl hover:shadow-primary/50 transition-shadow">
                                <div className="text-5xl font-extrabold text-fifa-gold mb-4">2</div>
                                <CardTitle className="mb-2">Defina as Regras</CardTitle>
                                <CardDescription>Configure prêmios, taxas de administração, punições e o prazo final.</CardDescription>
                            </Card>
                            <Card className="text-center p-6 shadow-2xl hover:shadow-primary/50 transition-shadow">
                                <div className="text-5xl font-extrabold text-fifa-gold mb-4">3</div>
                                <CardTitle className="mb-2">Convide e Palpite!</CardTitle>
                                <CardDescription>Compartilhe o código de convite e comece a pontuar em tempo real.</CardDescription>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* --- SEÇÃO 4: DÚVIDAS FREQUENTES --- */}
                <section className="py-20 bg-gray-50" id="faq">
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
            <footer className="bg-fifa-blue text-white py-10 border-t border-fifa-gold/20">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        
                        {/* Coluna 1: Nome e Copyright */}
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <BarChart3 className="w-6 h-6 text-fifa-gold" />
                                <span className="font-bold text-lg">Futuro Palpites</span>
                            </div>
                            <p className="text-sm text-gray-400">
                                &copy; {new Date().getFullYear()} Todos os direitos reservados.
                            </p>
                        </div>
                        
                        {/* Coluna 2: Navegação */}
                        <div>
                            <h5 className="font-semibold mb-3">Navegação</h5>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a href="#top" onClick={scrollToTop} className="hover:text-fifa-gold transition-colors">Início</a></li>
                                <li><a href="#como-comecar" className="hover:text-fifa-gold transition-colors">Como Começar</a></li>
                                <li><a href="#faq" className="hover:text-fifa-gold transition-colors">FAQ</a></li>
                            </ul>
                        </div>
                        
                        {/* Coluna 3: Legal */}
                        <div>
                            <h5 className="font-semibold mb-3">Legal</h5>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a href="/PrivacyPolicy" className="hover:text-fifa-gold transition-colors">Políticas de Privacidade</a></li>
                                <li><a href="/termos-de-uso" className="hover:text-fifa-gold transition-colors">Termos de Uso</a></li>
                            </ul>
                        </div>
                        
                        {/* Coluna 4: Contato */}
                        <div>
                            <h5 className="font-semibold mb-3">Suporte</h5>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li>
                                    <a href="mailto:contato@futuro-palpites.com" className="hover:text-fifa-gold transition-colors flex items-center">
                                        <MessageSquare className="h-4 w-4 mr-2"/> Fale Conosco
                                    </a>
                                </li>
                                <li>
                                    <a href="/criterios" className="hover:text-fifa-gold transition-colors flex items-center">
                                        <BookOpen className="h-4 w-4 mr-2"/> Ver Critérios
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;