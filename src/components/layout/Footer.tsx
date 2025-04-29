
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-fifa-blue text-white mt-auto py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-fifa-gold font-bold text-lg">Copa Mundial de Clubes FIFA 2025</h3>
            <p className="text-sm mt-1">O seu bolão oficial da competição</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <Link to="/" className="text-sm hover:text-fifa-gold transition-colors">
              Início
            </Link>
            <Link to="/criterios" className="text-sm hover:text-fifa-gold transition-colors">
              Critérios
            </Link>
            <Link to="/resultados" className="text-sm hover:text-fifa-gold transition-colors">
              Resultados
            </Link>
            <Link to="/palpites" className="text-sm hover:text-fifa-gold transition-colors">
              Palpites
            </Link>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-6 pt-6 text-center text-sm text-gray-400">
          <p>&copy; {currentYear} Clube do Futuro Palpites. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
