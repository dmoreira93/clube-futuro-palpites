// src/components/pwa/PwaHomePage.tsx

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle, LogIn, Award } from 'lucide-react';
import { StatBanner } from './StatBanner';
import PublicPoolsList from '@/components/home/PublicPoolsList'; // Vamos reutilizar a lista de bolões

const ActionButton = ({ icon: Icon, label, onClick }: { icon: React.ElementType, label: string, onClick: () => void }) => (
    <Button
      variant="outline"
      className="flex flex-col items-center justify-center h-28 w-full gap-2 border-2 border-fifa-blue/20 bg-white/80 shadow-md hover:bg-fifa-blue/5"
      onClick={onClick}
    >
      <Icon className="h-8 w-8 text-fifa-blue" />
      <span className="text-sm font-semibold text-fifa-blue">{label}</span>
    </Button>
);

export const PwaHomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 text-fifa-blue">
            {/* Cabeçalho Simples */}
            <header className="bg-fifa-blue p-4 shadow-md sticky top-0 z-10">
                <h1 className="text-xl font-bold text-center text-fifa-gold">Futuro Palpites</h1>
            </header>

            {/* Conteúdo Principal */}
            <main className="flex flex-col gap-8 p-4">
                <StatBanner />

                <div className="grid grid-cols-3 gap-4">
                    <ActionButton icon={PlusCircle} label="Criar Bolão" onClick={() => navigate('/login')} />
                    <ActionButton icon={LogIn} label="Acessar Bolão" onClick={() => navigate('/login')} />
                    <ActionButton icon={Award} label="Critérios" onClick={() => navigate('/criterios')} />
                </div>
                
                <div className='w-full'>
                    <h2 className="text-lg font-bold mb-4 text-center">Bolões Públicos</h2>
                    <PublicPoolsList />
                </div>
            </main>
        </div>
    );
};