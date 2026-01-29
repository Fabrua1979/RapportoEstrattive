import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowLeft, Download, ChevronDown, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';

const client = createClient();

export default function SalesPage() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [extractionData, setExtractionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiComment, setAiComment] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedYear && salesData.length > 0) {
      generateAIComment();
    }
  }, [selectedYear, salesData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const salesResponse = await client.entities.sales_data.query({});
      const sales = salesResponse.data?.items || [];
      setSalesData(sales);

      const extractionResponse = await client.entities.extraction_data.query({});
      const extractions = extractionResponse.data?.items || [];
      setExtractionData(extractions);

      const years = [...new Set(sales.map((d: any) => d.anno))].sort((a, b) => b - a);
      setAvailableYears(years);
      if (years.length > 0) setSelectedYear(years[0]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTemporalData = () => {
    const yearlyData: Record<number, any> = {};
    salesData.forEach((item) => {
      if (!yearlyData[item.anno]) yearlyData[item.anno] = { anno: item.anno, vendite: 0, estrazioni: 0 };
      yearlyData[item.anno].vendite += item.volume_m3;
    });
    extractionData.forEach((item) => {
      if (yearlyData[item.anno]) yearlyData[item.anno].estrazioni += item.volume_m3;
    });
    return Object.values(yearlyData).sort((a: any, b: any) => a.anno - b.anno);
  };

  const getPercentageData = () => {
    return getTemporalData().map((item: any) => ({
      anno: item.anno,
      percentuale: item.estrazioni > 0 ? ((item.vendite / item.estrazioni) * 100).toFixed(1) : 0
    }));
  };

  const getProvinceData = () => {
    const map: Record<string, any> = {};
    salesData.filter(i => i.anno === selectedYear).forEach(i => {
      if (!map[i.provincia]) map[i.provincia] = { provincia: i.provincia, volume_m3: 0 };
      map[i.provincia].volume_m3 += i.volume_m3;
    });
    return Object.values(map);
  };

  const getMaterialData = () => {
    const map: Record<string, number> = {};
    salesData.filter(i => i.anno === selectedYear).forEach(i => {
      map[i.materiale] = (map[i.materiale] || 0) + i.volume_m3;
    });
    return Object.entries(map).map(([materiale, volume_m3]) => ({ materiale, volume_m3 }));
  };

  const generateAIComment = async () => {
    try {
      setAiLoading(true);
      const yearData = salesData.filter(d => d.anno === selectedYear);
      const totalSales = yearData.reduce((sum, d) => sum + d.volume_m3, 0);
      const yearExtraction = extractionData.filter(d => d.anno === selectedYear);
      const totalExtraction = yearExtraction.reduce((sum, d) => sum + d.volume_m3, 0);
      const percentage = totalExtraction > 0 ? ((totalSales / totalExtraction) * 100).toFixed(1) : 0;

      const prompt = `Analizza questi dati sulle vendite di materiali estrattivi in Puglia per l'anno ${selectedYear}:
- Volume totale venduto: ${totalSales.toLocaleString()} m³
- Volume totale estratto: ${totalExtraction.toLocaleString()} m³
- Percentuale venduto su estratto: ${percentage}%

Genera un commento professionale di massimo 3 frasi che evidenzi l'efficienza commerciale e le dinamiche di mercato.`;

      let fullComment = '';
      await client.ai.gentxt({
        messages: [{ role: 'user', content: prompt }],
        model: 'deepseek-v3.2',
        stream: true,
        onChunk: (chunk) => {
          if (chunk.content) {
            fullComment += chunk.content;
            setAiComment(fullComment);
          }
        },
        onComplete: () => { setAiLoading(false); },
        onError: (error) => {
          console.error('AI generation error:', error);
          setAiLoading(false);
        }
      });
    } catch (error) {
      console.error('Error generating AI comment:', error);
      setAiLoading(false);
    }
  };

  const exportToExcel = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dati');
    XLSX.writeFile(wb, `${filename}_${selectedYear}.xlsx`);
  };

  const exportComuneData = async () => {
    try {
      const response = await client.entities.sales_data.query({
        query: { anno: selectedYear },
        limit: 1000
      });
      const data = response.data?.items || [];
      exportToExcel(data, 'dati_comunali_vendite');
    } catch (error) {
      console.error('Error exporting comune data:', error);
    }
  };

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center"><div className="text-xl text-gray-600">Caricamento...</div></div>;

  const temporalData = getTemporalData();
  const percentageData = getPercentageData();
  const provinceData = getProvinceData();
  const materialData = getMaterialData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate('/menu')}><ArrowLeft className="w-4 h-4 mr-2" />Menu</Button>
              <h1 className="text-3xl font-bold text-gray-800">Vendite (m³)</h1>
            </div>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>{availableYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {aiComment && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💡</div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Analisi AI</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {aiLoading ? 'Generazione analisi in corso...' : aiComment}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Evoluzione Vendite Totali</CardTitle>
                <CardDescription>Volume venduto in m³ per anno</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(temporalData, 'evoluzione_vendite')}>
                <Download className="w-4 h-4 mr-2" />
                Esporta
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={temporalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="anno" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString()} m³`} />
                <Legend />
                <Line type="monotone" dataKey="volume_m3" stroke="#00C49F" name="Volume Venduto (m³)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Distribuzione per Provincia - Anno {selectedYear}</CardTitle>
                <CardDescription>Volume venduto per provincia</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(provinceData, 'vendite_province')}>
                <Download className="w-4 h-4 mr-2" />
                Esporta
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={provinceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="provincia" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString()} m³`} />
                <Legend />
                <Bar dataKey="volume_m3" fill="#00C49F" name="Volume (m³)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Distribuzione per Materiale - Anno {selectedYear}</CardTitle>
                <CardDescription>Volume venduto per tipologia di materiale</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(materialData, 'vendite_materiali')}>
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
                  dataKey="volume_m3"
                  nameKey="materiale"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.materiale}: ${entry.volume_m3.toLocaleString()} m³`}
                >
                  {materialData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toLocaleString()} m³`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Dettagli per Comune - Anno {selectedYear}</CardTitle>
                <CardDescription>Clicca su un comune per vedere i dettagli</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportToExcel(comuneDetails, 'vendite_comuni')}>
                  <Download className="w-4 h-4 mr-2" />
                  Esporta Tabella
                </Button>
                <Button variant="outline" size="sm" onClick={exportComuneData}>
                  <Download className="w-4 h-4 mr-2" />
                  Scarica Dati Comunali
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Comune</TableHead>
                  <TableHead>Provincia</TableHead>
                  <TableHead className="text-right">Volume Venduto (m³)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comuneDetails.map((item: any, index) => (
                  <>
                    <TableRow 
                      key={index}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpandedComune(expandedComune === item.comune ? null : item.comune)}
                    >
                      <TableCell>
                        {expandedComune === item.comune ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </TableCell>
                      <TableCell className="font-medium">{item.comune}</TableCell>
                      <TableCell>{item.provincia}</TableCell>
                      <TableCell className="text-right">{item.volume_m3.toLocaleString()} m³</TableCell>
                    </TableRow>
                    {expandedComune === item.comune && (
                      <TableRow>
                        <TableCell colSpan={4} className="bg-gray-50">
                          <div className="p-4 space-y-2">
                            {item.dettagli.map((detail: any, idx: number) => (
                              <div key={idx} className="text-sm border-l-2 border-green-500 pl-3">
                                <div><strong>Azienda:</strong> {detail.azienda}</div>
                                <div><strong>Materiale:</strong> {detail.materiale}</div>
                                <div><strong>Volume Venduto:</strong> {detail.volume_venduto?.toLocaleString()} m³</div>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

