import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Home, Loader2, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

const client = createClient();

const COLORS = ['#0066CC', '#28A745', '#FFC107', '#DC3545', '#6F42C1', '#17A2B8'];

export default function CaveAutorizzatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Trend data
  const [trendData, setTrendData] = useState<any[]>([]);
  
  // Province and Material data
  const [provinceData, setProvinceData] = useState<any[]>([]);
  const [materialData, setMaterialData] = useState<any[]>([]);
  
  // Comune details
  const [comuneDetails, setComuneDetails] = useState<any[]>([]);
  const [showComuneTable, setShowComuneTable] = useState(false);
  
  // Statistics
  const [stats, setStats] = useState({
    totalCaves: 0,
    activeProvinces: 0,
    materialTypes: 0
  });
  
  // AI Comment
  const [aiComment, setAiComment] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load trend data (all years)
      const trendResponse = await client.entities.annual_cave_data.query({
        query: {},
        sort: 'anno',
        limit: 100
      });
      
      const trend = trendResponse.data.items.map((item: any) => ({
        anno: item.anno,
        cave: item.numero_cave
      }));
      setTrendData(trend);
      
      const years = trend.map((t: any) => t.anno).sort((a: number, b: number) => b - a);
      setAvailableYears(years);
      
      // Load province/material data for selected year
      const detailResponse = await client.entities.province_material_data.queryAll({
        query: { anno: parseInt(selectedYear) },
        limit: 1000
      });
      
      const details = detailResponse.data.items;
      
      // Aggregate by province
      const provinceMap = new Map();
      details.forEach((item: any) => {
        const current = provinceMap.get(item.provincia) || 0;
        provinceMap.set(item.provincia, current + item.numero_cave);
      });
      
      const provinces = Array.from(provinceMap.entries()).map(([name, value]) => ({
        name,
        cave: value
      }));
      setProvinceData(provinces);
      
      // Aggregate by material
      const materialMap = new Map();
      details.forEach((item: any) => {
        const current = materialMap.get(item.materiale) || 0;
        materialMap.set(item.materiale, current + item.numero_cave);
      });
      
      const materials = Array.from(materialMap.entries()).map(([name, value]) => ({
        name,
        value
      }));
      setMaterialData(materials);
      
      // Calculate stats
      const totalCaves = provinces.reduce((sum, p) => sum + p.cave, 0);
      setStats({
        totalCaves,
        activeProvinces: provinces.length,
        materialTypes: materials.length
      });
      
      // Load comune details from cave_details table
      const comuneResponse = await client.entities.cave_details.queryAll({
        query: { anno: parseInt(selectedYear) },
        limit: 1000
      });
      
      const comuneMap = new Map();
      comuneResponse.data.items.forEach((item: any) => {
        const key = `${item.comune}|${item.provincia}`;
        const current = comuneMap.get(key) || { comune: item.comune, provincia: item.provincia, count: 0 };
        current.count += 1;
        comuneMap.set(key, current);
      });
      
      const comuneList = Array.from(comuneMap.values()).sort((a, b) => b.count - a.count);
      setComuneDetails(comuneList);
      
      // Generate AI comment if data exists
      if (totalCaves > 0) {
        generateAIComment(totalCaves, provinces, materials);
      }
      
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i dati',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAIComment = async (total: number, provinces: any[], materials: any[]) => {
    setLoadingComment(true);
    try {
      const topProvince = provinces.length > 0 ? provinces.reduce((a, b) => a.cave > b.cave ? a : b) : null;
      const topMaterial = materials.length > 0 ? materials.reduce((a, b) => a.value > b.value ? a : b) : null;
      
      const prompt = `Analizza questi dati sulle cave autorizzate in Puglia per l'anno ${selectedYear}:
- Totale cave: ${total}
- Province attive: ${provinces.length}
- Provincia con più cave: ${topProvince?.name} (${topProvince?.cave} cave)
- Materiali estratti: ${materials.length} tipologie
- Materiale più comune: ${topMaterial?.name} (${topMaterial?.value} cave)

Genera un breve commento professionale (max 3 frasi) che evidenzi i punti chiave e le tendenze principali.`;

      const streamResponse = await client.apiCall.invoke({
        url: '/api/v1/aihub/gentxt',
        method: 'POST',
        data: {
          messages: [
            { role: 'system', content: 'Sei un esperto analista di dati geologici e minerari.' },
            { role: 'user', content: prompt }
          ],
          model: 'deepseek-v3.2',
          stream: true
        },
        options: { responseType: 'stream' }
      });

      const reader = streamResponse.body.getReader();
      const decoder = new TextDecoder();
      let comment = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content?.startsWith('[ERROR]')) throw new Error(parsed.content);
            if (parsed.content) {
              comment += parsed.content;
              setAiComment(comment);
            }
          } catch (e: any) {
            if (e.message?.startsWith('[ERROR]')) throw e;
          }
        }
      }
    } catch (error: any) {
      console.error('AI comment error:', error);
      setAiComment('Analisi AI non disponibile al momento.');
    } finally {
      setLoadingComment(false);
    }
  };

  const exportTrendChart = () => {
    const ws = XLSX.utils.json_to_sheet(trendData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trend Temporale');
    XLSX.writeFile(wb, `trend_cave_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ title: 'Esportato', description: 'Grafico trend esportato con successo' });
  };

  const exportProvinceChart = () => {
    const ws = XLSX.utils.json_to_sheet(provinceData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Province');
    XLSX.writeFile(wb, `province_${selectedYear}.xlsx`);
    toast({ title: 'Esportato', description: 'Grafico province esportato con successo' });
  };

  const exportMaterialChart = () => {
    const ws = XLSX.utils.json_to_sheet(materialData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Materiali');
    XLSX.writeFile(wb, `materiali_${selectedYear}.xlsx`);
    toast({ title: 'Esportato', description: 'Grafico materiali esportato con successo' });
  };

  const exportComuneTable = () => {
    const ws = XLSX.utils.json_to_sheet(comuneDetails);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Comuni');
    XLSX.writeFile(wb, `comuni_${selectedYear}.xlsx`);
    toast({ title: 'Esportato', description: 'Tabella comuni esportata con successo' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Cave Autorizzate</h1>
          <Button variant="outline" onClick={() => navigate('/menu')}>
            <Home className="w-4 h-4 mr-2" />
            Menu
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Year Selector */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Analisi Attività Estrattive</h2>
            <p className="text-gray-600">Dati e statistiche sulle cave autorizzate in Puglia</p>
          </div>
          <div className="w-48">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona anno" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">Cave Totali</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{stats.totalCaves}</p>
              <p className="text-sm text-gray-600 mt-2">Anno {selectedYear}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Province Attive</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{stats.activeProvinces}</p>
              <p className="text-sm text-gray-600 mt-2">Con cave autorizzate</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-purple-600">Tipologie Materiali</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{stats.materialTypes}</p>
              <p className="text-sm text-gray-600 mt-2">Materiali estratti</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Comment */}
        {aiComment && (
          <Card className="mb-8 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">💡 Analisi AI</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingComment ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-600">Generazione analisi...</span>
                </div>
              ) : (
                <p className="text-blue-800">{aiComment}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Trend Chart */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Trend Temporale Cave Autorizzate</CardTitle>
                <CardDescription>Evoluzione del numero di cave nel tempo</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={exportTrendChart}>
                <Download className="w-4 h-4 mr-2" />
                Esporta
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="anno" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="cave" stroke="#0066CC" strokeWidth={2} name="Cave Autorizzate" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Province and Material Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Distribuzione per Provincia</CardTitle>
                  <CardDescription>Anno {selectedYear}</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={exportProvinceChart}>
                  <Download className="w-4 h-4 mr-2" />
                  Esporta
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={provinceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cave" fill="#28A745" name="Cave" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Distribuzione per Materiale</CardTitle>
                  <CardDescription>Anno {selectedYear}</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={exportMaterialChart}>
                  <Download className="w-4 h-4 mr-2" />
                  Esporta
                </Button>
              </div>
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

        {/* Comune Details Table */}
        {comuneDetails.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Dettaglio per Comune</CardTitle>
                  <CardDescription>Cave autorizzate per comune - Anno {selectedYear}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportComuneTable}>
                    <Download className="w-4 h-4 mr-2" />
                    Esporta
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowComuneTable(!showComuneTable)}
                  >
                    {showComuneTable ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-2" />
                        Nascondi
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Mostra ({comuneDetails.length} comuni)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            {showComuneTable && (
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Comune</th>
                        <th className="text-left py-3 px-4 font-semibold">Provincia</th>
                        <th className="text-right py-3 px-4 font-semibold">N° Cave</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comuneDetails.map((item, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{item.comune}</td>
                          <td className="py-3 px-4">{item.provincia}</td>
                          <td className="py-3 px-4 text-right font-semibold">{item.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}