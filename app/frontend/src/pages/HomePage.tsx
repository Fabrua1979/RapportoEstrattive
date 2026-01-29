import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(https://mgx-backend-cdn.metadl.com/generate/images/835894/2026-01-22/da14ed52-a674-44dc-a241-a23936e1286d.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.4)'
          }}
        />
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="mb-8 flex justify-center">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-full">
              <BarChart3 className="w-16 h-16 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Rapporto Attività Estrattive
          </h1>
          <h2 className="text-3xl md:text-4xl font-semibold text-blue-200 mb-8">
            Regione Puglia
          </h2>
          
          <p className="text-xl text-gray-200 mb-12 max-w-2xl mx-auto">
            Sistema di monitoraggio e analisi dinamica delle attività estrattive regionali. 
            Visualizza dati aggiornati, statistiche e trend delle cave autorizzate in Puglia.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate('/menu')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
            >
              Accedi alla Dashboard
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate('/login')}
              className="bg-white/10 backdrop-blur-sm border-white text-white hover:bg-white/20 px-8 py-6 text-lg"
            >
              Area Amministrativa
            </Button>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-gray-800 text-center mb-12">
            Funzionalità Principali
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold mb-3">Visualizzazioni Dinamiche</h4>
              <p className="text-gray-600">
                Grafici interattivi e infografiche aggiornate in tempo reale per analisi immediate
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <img 
                  src="https://mgx-backend-cdn.metadl.com/generate/images/835894/2026-01-22/09cb07ed-667e-41fa-859d-4dc6d3779145.png" 
                  alt="Data Analytics"
                  className="w-8 h-8"
                />
              </div>
              <h4 className="text-xl font-semibold mb-3">Analisi Dettagliate</h4>
              <p className="text-gray-600">
                Statistiche per provincia, materiale e trend temporali delle attività estrattive
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <img 
                  src="https://mgx-backend-cdn.metadl.com/generate/images/835894/2026-01-22/90dec202-395d-4ffe-9829-290b1f499f03.png" 
                  alt="Admin Panel"
                  className="w-8 h-8"
                />
              </div>
              <h4 className="text-xl font-semibold mb-3">Aggiornamento Facile</h4>
              <p className="text-gray-600">
                Pannello amministrativo per caricare dati Excel e aggiornare le informazioni
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400">
            © 2026 Regione Puglia - Sistema di Monitoraggio Attività Estrattive
          </p>
        </div>
      </footer>
    </div>
  );
}