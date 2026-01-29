import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, TrendingUp, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const client = createClient();

interface RevenueData {
  id: number;
  anno: number;
  importo_euro: number;
}

export default function RegionalRevenuePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRevenueData();
  }, []);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      const response = await client.entities.regional_revenue_data.query({
        query: {},
        sort: 'anno',
        limit: 100
      });
      setRevenueData(response.data.items);
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i dati degli incassi',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const chartData = revenueData.map(item => ({
    anno: item.anno.toString(),
    importo: item.importo_euro
  }));

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.importo_euro, 0);
  const avgRevenue = revenueData.length > 0 ? totalRevenue / revenueData.length : 0;
  const latestYear = revenueData.length > 0 ? Math.max(...revenueData.map(d => d.anno)) : 0;
  const latestRevenue = revenueData.find(d => d.anno === latestYear)?.importo_euro || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/menu')}
            className="hover:bg-white/80"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Incassi Regionali dalla Tariffa sulle Attività Estrattive
            </h1>
            <p className="text-gray-600 mt-2">
              Evoluzione annuale degli incassi regionali derivanti dalla tariffa sulle attività estrattive
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : revenueData.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-600 text-center">
                Nessun dato disponibile. Contatta l'amministratore per inserire i dati degli incassi.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="border-2 border-emerald-200 bg-white/80 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardDescription>Incasso Ultimo Anno ({latestYear})</CardDescription>
                  <CardTitle className="text-3xl text-emerald-600">
                    {formatCurrency(latestRevenue)}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="border-2 border-teal-200 bg-white/80 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardDescription>Incasso Medio Annuo</CardDescription>
                  <CardTitle className="text-3xl text-teal-600">
                    {formatCurrency(avgRevenue)}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="border-2 border-cyan-200 bg-white/80 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardDescription>Incasso Totale</CardDescription>
                  <CardTitle className="text-3xl text-cyan-600">
                    {formatCurrency(totalRevenue)}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Chart */}
            <Card className="border-2 border-emerald-200 bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Evoluzione Annuale degli Incassi
                </CardTitle>
                <CardDescription>
                  Andamento temporale degli incassi regionali dalla tariffa sulle attività estrattive
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="anno" 
                      stroke="#6b7280"
                      style={{ fontSize: '14px' }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      style={{ fontSize: '14px' }}
                      tickFormatter={(value) => `€${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '2px solid #10b981',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="importo" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      name="Incasso (€)"
                      dot={{ fill: '#10b981', r: 6 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Data Table */}
            <Card className="border-2 border-emerald-200 bg-white/80 backdrop-blur mt-8">
              <CardHeader>
                <CardTitle>Dettaglio Annuale</CardTitle>
                <CardDescription>Tabella completa degli incassi per anno</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-emerald-200">
                        <th className="text-left p-3 font-semibold text-gray-700">Anno</th>
                        <th className="text-right p-3 font-semibold text-gray-700">Incasso (€)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueData.map((item, index) => (
                        <tr 
                          key={item.id} 
                          className={`border-b ${index % 2 === 0 ? 'bg-emerald-50/50' : 'bg-white'} hover:bg-emerald-100/50 transition-colors`}
                        >
                          <td className="p-3 font-medium text-gray-900">{item.anno}</td>
                          <td className="p-3 text-right font-semibold text-emerald-600">
                            {formatCurrency(item.importo_euro)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}