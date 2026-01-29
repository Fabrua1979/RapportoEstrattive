import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mountain, Home, Lock } from 'lucide-react';

export default function MenuPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Mountain className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Attività Estrattive Puglia</h1>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/')}>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button variant="outline" onClick={() => navigate('/login')}>
              <Lock className="w-4 h-4 mr-2" />
              Admin
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Menu Principale</h2>
          <p className="text-xl text-gray-600">Seleziona una sezione per visualizzare i dati</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Cave Autorizzate Card */}
          <Card 
            className="hover:shadow-xl transition-shadow cursor-pointer border-2 border-blue-200 hover:border-blue-400"
            onClick={() => navigate('/cave-autorizzate')}
          >
            <CardHeader>
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Mountain className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Cave Autorizzate</CardTitle>
              <CardDescription className="text-base">
                Visualizza il numero di cave autorizzate per anno, con analisi per provincia e materiale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Visualizza Dati
              </Button>
            </CardContent>
          </Card>

          {/* Placeholder Cards for Future Chapters */}
          <Card className="opacity-60 cursor-not-allowed border-2 border-gray-200">
            <CardHeader>
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <CardTitle className="text-2xl">Fatturato</CardTitle>
              <CardDescription className="text-base">
                Analisi del fatturato delle attività estrattive (In sviluppo)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Prossimamente
              </Button>
            </CardContent>
          </Card>

          <Card className="opacity-60 cursor-not-allowed border-2 border-gray-200">
            <CardHeader>
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <CardTitle className="text-2xl">Produzione</CardTitle>
              <CardDescription className="text-base">
                Dati sulla produzione estrattiva regionale (In sviluppo)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Prossimamente
              </Button>
            </CardContent>
          </Card>

          <Card className="opacity-60 cursor-not-allowed border-2 border-gray-200">
            <CardHeader>
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">👷</span>
              </div>
              <CardTitle className="text-2xl">Occupazione</CardTitle>
              <CardDescription className="text-base">
                Statistiche sull'occupazione nel settore (In sviluppo)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Prossimamente
              </Button>
            </CardContent>
          </Card>

          <Card className="opacity-60 cursor-not-allowed border-2 border-gray-200">
            <CardHeader>
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📈</span>
              </div>
              <CardTitle className="text-2xl">Altri Indicatori</CardTitle>
              <CardDescription className="text-base">
                Ulteriori metriche e analisi (In sviluppo)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Prossimamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}