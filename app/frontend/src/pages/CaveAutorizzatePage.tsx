import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Home, Loader2, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const client = createClient();

const COLORS = ['#0066CC', '#28A745', '#FFC107', '#DC3545', '#6C757D', '#17A2B8', '#E83E8C', '#6610F2'];

export default function CaveAutorizzatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [annualData, setAnnualData] = useState<any[]>([]);
  const [provinceData, setProvinceData] = useState<any[]>([]);
  const [materialData, setMaterialData] = useState<any[]>([]);
  const [commentary, setCommentary] = useState<string>('');
  const [generatingCommentary, setGeneratingCommentary] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      loadYearDetails(parseInt(selectedYear));
    }
  }, [selectedYear]);

  const loadData = async () => {
    try {
      // Load all annual data
      const response = await client.entities.annual_cave_data.queryAll({
        sort: 'anno',
        limit: 100
      });

      const data = response.data.items;
      setAnnualData(data);

      // Extract available years
      const years = data.map((item: any) => item.anno).sort((a: number, b: number) => b - a);
      setAvailableYears(years);

      if (years.length > 0) {
        setSelectedYear(years[0].toString());
      }
    } catch (error: any) {
      const detail = error?.data?.detail || error?.response?.data?.detail || error.message;
      toast({
        title: 'Errore nel caricamento',
        description: detail,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadYearDetails = async (year: number) => {
    try {
      // Load cave details for selected year
      const response = await client.entities.cave_details.queryAll({
        query: { anno: year },
        limit: 1000
      });

      const details = response.data.items;

      // Process province data
      const provinceCount: { [key: string]: number } = {};
      details.forEach((cave: any) => {
        const prov = cave.provincia || 'N/A';
        provinceCount[prov] = (provinceCount[prov] || 0) + 1;
      });

      const provinceChartData = Object.entries(provinceCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      setProvinceData(provinceChartData);

      // Process material data
      const materialCount: { [key: string]: number } = {};
      details.forEach((cave: any) => {
        const mat = cave.materiale || 'N/A';
        materialCount[mat] = (materialCount[mat] || 0) + 1;
      });

      const materialChartData = Object.entries(materialCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      setMaterialData(materialChartData);

      // Generate AI commentary
      generateCommentary(year, details.length, provinceChartData, materialChartData);
    } catch (error: any) {
      const detail = error?.data?.detail || error?.response?.data?.detail || error.message;
      toast({
        title: 'Errore nel caricamento dettagli',
        description: detail,
        variant: 'destructive'
      });
    }
  };

  const generateCommentary = async (year: number, totalCaves: number, provinces: any[], materials: any[]) => {
    setGeneratingCommentary(true);
    try {
      const prompt = `Genera un breve commento professionale (massimo 3-4 frasi) in italiano sui dati delle cave autorizzate in Puglia per l'anno ${year}. 
      
Dati:
- Numero totale cave autorizzate: ${totalCaves}
- Distribuzione per provincia: ${provinces.map(p => `${p.name}: ${p.value}`).join(', ')}
- Distribuzione per materiale: ${materials.map(m => `${m.name}: ${m.value}`).join(', ')}

Il commento deve evidenziare i trend principali, le province più attive e i materiali più estratti. Usa un tono istituzionale e professionale.`;

      const response = await client.apiCall.invoke({
        url: '/api/v1/aihub/gentxt',
        method: 'POST',
        data: {
          messages: [
            { role: 'system', content: 'Sei un analista esperto di dati estrattivi per la Regione Puglia.' },
            { role: 'user', content: prompt }
          ],
          model: 'deepseek-v3.2',
          stream: false
        }
      });

      setCommentary(response.data.content);
    } catch (error: any) {
      const detail = error?.data?.detail || error?.response?.data?.detail || error.message;
      setCommentary('Impossibile generare il commento automatico. Dati visualizzati correttamente.');
    } finally {
      setGeneratingCommentary(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  const chartData = annualData.map(item => ({
    anno: item.anno,
    cave: item.numero_cave
  }));

  const currentYearData = annualData.find(item => item.anno === parseInt(selectedYear));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Cave Autorizzate in Puglia</h1>
          <Button variant="outline" onClick={() => navigate('/menu')}>
            <Home className="w-4 h-4 mr-2" />
            Menu
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Year Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Seleziona Anno</CardTitle>
            <CardDescription>Visualizza i dati per un anno specifico</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Seleziona un anno" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Cave Autorizzate {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {currentYearData?.numero_cave || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Province Attive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {provinceData.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Tipologie Materiali</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {materialData.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Commentary */}
        {selectedYear && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Analisi Automatica
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generatingCommentary ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generazione commento in corso...
                </div>
              ) : (
                <p className="text-gray-800 leading-relaxed">{commentary}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Temporal Trend Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Trend Temporale Cave Autorizzate</CardTitle>
            <CardDescription>Evoluzione del numero di cave autorizzate nel tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="anno" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="cave" stroke="#0066CC" strokeWidth={3} name="Cave Autorizzate" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Province and Material Charts */}
        {selectedYear && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Province Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuzione per Provincia ({selectedYear})</CardTitle>
                <CardDescription>Numero di cave autorizzate per provincia</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={provinceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0066CC" name="Cave" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Material Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuzione per Materiale ({selectedYear})</CardTitle>
                <CardDescription>Tipologie di materiali estratti</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={materialData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {materialData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Data Table */}
        {selectedYear && provinceData.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Riepilogo Statistico ({selectedYear})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Provincia</th>
                      <th className="px-4 py-3 text-right font-semibold">N° Cave</th>
                      <th className="px-4 py-3 text-right font-semibold">% sul Totale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {provinceData.map((prov, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{prov.name}</td>
                        <td className="px-4 py-3 text-right">{prov.value}</td>
                        <td className="px-4 py-3 text-right">
                          {((prov.value / (currentYearData?.numero_cave || 1)) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}