import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mountain, Home, Lock, Activity, TrendingUp, ShoppingCart, DollarSign, Users, Tag, MapPin, Target, BarChart3 } from 'lucide-react';

export default function MenuPage() {
  const navigate = useNavigate();

  const chapters = [
    {
      id: 1,
      title: 'Cave Autorizzate',
      description: 'Numero di cave autorizzate per anno, con analisi per provincia e materiale',
      icon: Mountain,
      path: '/cave-autorizzate',
      color: 'blue'
    },
    {
      id: 2,
      title: 'Cave in Attività',
      description: 'Cave attive e percentuale su autorizzate, dettagli per provincia e materiale',
      icon: Activity,
      path: '/cave-attive',
      color: 'green'
    },
    {
      id: 3,
      title: 'Estrazioni',
      description: 'Volumi estratti in m³, analisi per provincia e materiale',
      icon: TrendingUp,
      path: '/estrazioni',
      color: 'orange'
    },
    {
      id: 4,
      title: 'Vendite',
      description: 'Volumi venduti in m³ e percentuale su estratto, dettagli per provincia e materiale',
      icon: ShoppingCart,
      path: '/vendite',
      color: 'purple'
    },
    {
      id: 5,
      title: 'Dati Economici',
      description: 'Fatturato, costi, utile lordo e netto in euro, analisi per provincia e materiale',
      icon: DollarSign,
      path: '/dati-economici',
      color: 'emerald'
    },
    {
      id: 6,
      title: 'Occupazione',
      description: 'Numero di occupati nel settore estrattivo, dettagli per provincia e materiale',
      icon: Users,
      path: '/occupazione',
      color: 'cyan'
    },
    {
      id: 7,
      title: 'Prezzi',
      description: 'Prezzi in €/m³ per classi di materiale, evoluzione temporale',
      icon: Tag,
      path: '/prezzi',
      color: 'pink'
    },
    {
      id: 8,
      title: 'Destinazioni',
      description: 'Destinazioni geografiche (locali, nazionali, estere) dei materiali estratti',
      icon: MapPin,
      path: '/destinazioni',
      color: 'indigo'
    },
    {
      id: 9,
      title: 'Concorrenti',
      description: 'Analisi della concorrenza per tipologia (comunale, provinciale, regionale, nazionale, internazionale)',
      icon: Target,
      path: '/concorrenti',
      color: 'red'
    },
    {
      id: 10,
      title: 'Indicatori',
      description: 'KPI calcolati automaticamente: margini, produttività, efficienza economica',
      icon: BarChart3,
      path: '/indicatori',
      color: 'amber'
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string; border: string; hover: string }> = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200 hover:border-blue-400', hover: 'hover:bg-blue-700' },
      green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200 hover:border-green-400', hover: 'hover:bg-green-700' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200 hover:border-orange-400', hover: 'hover:bg-orange-700' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200 hover:border-purple-400', hover: 'hover:bg-purple-700' },
      emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200 hover:border-emerald-400', hover: 'hover:bg-emerald-700' },
      cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', border: 'border-cyan-200 hover:border-cyan-400', hover: 'hover:bg-cyan-700' },
      pink: { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-200 hover:border-pink-400', hover: 'hover:bg-pink-700' },
      indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-200 hover:border-indigo-400', hover: 'hover:bg-indigo-700' },
      red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200 hover:border-red-400', hover: 'hover:bg-red-700' },
      amber: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200 hover:border-amber-400', hover: 'hover:bg-amber-700' }
    };
    return colorMap[color] || colorMap.blue;
  };

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
          <p className="text-xl text-gray-600">Seleziona un capitolo per visualizzare i dati</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chapters.map((chapter) => {
            const Icon = chapter.icon;
            const colors = getColorClasses(chapter.color);
            
            return (
              <Card 
                key={chapter.id}
                className={`hover:shadow-xl transition-shadow cursor-pointer border-2 ${colors.border}`}
                onClick={() => navigate(chapter.path)}
              >
                <CardHeader>
                  <div className={`w-16 h-16 ${colors.bg} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className={`w-8 h-8 ${colors.text}`} />
                  </div>
                  <CardTitle className="text-2xl">{chapter.title}</CardTitle>
                  <CardDescription className="text-base">
                    {chapter.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full"
                    style={{ 
                      backgroundColor: chapter.color === 'blue' ? '#2563eb' :
                                     chapter.color === 'green' ? '#16a34a' :
                                     chapter.color === 'orange' ? '#ea580c' :
                                     chapter.color === 'purple' ? '#9333ea' :
                                     chapter.color === 'emerald' ? '#059669' :
                                     chapter.color === 'cyan' ? '#0891b2' :
                                     chapter.color === 'pink' ? '#db2777' :
                                     chapter.color === 'indigo' ? '#4f46e5' :
                                     chapter.color === 'red' ? '#dc2626' :
                                     chapter.color === 'amber' ? '#d97706' : '#2563eb'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(chapter.path);
                    }}
                  >
                    Visualizza Dati
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}