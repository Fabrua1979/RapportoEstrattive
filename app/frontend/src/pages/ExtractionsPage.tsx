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

export default function ExtractionsPage() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [extractionData, setExtractionData] = useState<any[]>([]);
  const [caveDetails, setCaveDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedComune, setExpandedComune] = useState<string | null>(null);
  const [aiComment, setAiComment] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedYear && extractionData.length > 0) {
      generateAIComment();
    }
  }, [selectedYear, extractionData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const extractionResponse = await client.entities.extraction_data.query({});
      const extractions = extractionResponse.data?.items || [];
      setExtractionData(extractions);

      const detailsResponse = await client.entities.cave_details.query({});
      const details = detailsResponse.data?.items || [];
      setCaveDetails(details);

      const years = [...new Set(extractions.map((d: any) => d.anno))].sort((a, b) => b - a);
      setAvailableYears(years);
      if (years.length > 0 && !years.includes(selectedYear)) {
        setSelectedYear(years[0]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTemporalTrendData = () => {
    const yearlyData: Record<number, { anno: number; volume_m3: number }> = {};
    
    extractionData.forEach((item) => {
      if (!yearlyData[item.anno]) {
        yearlyData[item.anno] = { anno: item.anno, volume_m3: 0 };
      }
      yearlyData[item.anno].volume_m3 += item.volume_m3;
    });

    return Object.values(yearlyData).sort((a, b) => a.anno - b.anno);
  };

  const getProvinceData = () => {
    const provinceMap: Record<string, number> = {};
    
    extractionData
      .filter(item => item.anno === selectedYear)
      .forEach(item => {
        provinceMap[item.provincia] = (provinceMap[item.provincia] || 0) + item.volume_m3;
      });

    return Object.entries(provinceMap).map(([provincia, volume_m3]) => ({
      provincia,
      volume_m3
    }));
  };

  const getMaterialData = () => {
    const materialMap: Record<string, number> = {};
    
    extractionData
      .filter(item => item.anno === selectedYear)
      .forEach(item => {
        materialMap[item.materiale] = (materialMap[item.materiale] || 0) + item.volume_m3;
      });

    return Object.entries(materialMap).map(([materiale, volume_m3]) => ({
      materiale,
      volume_m3
    }));
  };

  const getComuneDetails = () => {
    const comuneMap: Record<string, any> = {};
    
    extractionData
      .filter(item => item.anno === selectedYear)
      .forEach(item => {
        const comuneDetails = caveDetails.filter(d => 
          d.anno === selectedYear && 
          d.provincia === item.provincia
        );
        
        comuneDetails.forEach(detail => {
          if (!comuneMap[detail.comune]) {
            comuneMap[detail.comune] = {
              comune: detail.comune,
              provincia: detail.provincia,
              volume_m3: 0,
              dettagli: []
            };
          }
          comuneMap[detail.comune].volume_m3 += item.volume_m3 / comuneDetails.length;
          comuneMap[detail.comune].dettagli.push({...detail, volume_estratto: item.volume_m3 / comuneDetails.length});
        });
      });

    return Object.values(comuneMap).sort((a: any, b: any) => b.volume_m3 - a.volume_m3);
  };

  const generateAIComment = async () => {
    try {
      setAiLoading(true);
      const yearData = extractionData.filter(d => d.anno === selectedYear);
      const totalVolume = yearData.reduce((sum, d) => sum + d.volume_m3, 0);
      
      const provinceMap: Record<string, number> = {};
      yearData.forEach(d => {
        provinceMap[d.provincia] = (provinceMap[d.provincia] || 0) + d.volume_m3;
      });
      const topProvince = Object.entries(provinceMap).sort((a, b) => b[1] - a[1])[0];

      const materialMap: Record<string, number> = {};
      yearData.forEach(d => {
        materialMap[d.materiale] = (materialMap[d.materiale] || 0) + d.volume_m3;
      });
      const topMaterial = Object.entries(materialMap).sort((a, b) => b[1] - a[1])[0];

      const prompt = `Analizza questi dati sulle estrazioni di materiali in Puglia per l'anno ${selectedYear}:
- Volume totale estratto: ${totalVolume.toLocaleString()} m³
- Provincia con maggiori estrazioni: ${topProvince?.[0]} con ${topProvince?.[1]?.toLocaleString()} m³
- Materiale più estratto: ${topMaterial?.[0]} con ${topMaterial?.[1]?.toLocaleString()} m³

Genera un commento professionale di massimo 3 frasi che evidenzi i trend principali e le implicazioni per il settore estrattivo pugliese.`;

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
        onComplete: () => {
          setAiLoading(false);
        },
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
      const response = await client.entities.extraction_data.query({
        query: { anno: selectedYear },
        limit: 1000
      });
      const data = response.data?.items || [];
      exportToExcel(data, 'dati_comunali_estrazioni');
    } catch (error) {
      console.error('Error exporting comune data:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Caricamento dati...</div>
      </div>
    );
  }

  const temporalData = getTemporalTrendData();
  const provinceData = getProvinceData();
  const materialData = getMaterialData();
  const comuneDetails = getComuneDetails();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate('/menu')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Menu
              </Button>
              <h1 className="text-3xl font-bold text-gray-800">Estrazioni (m³)</h1>
            </div>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* AI Comment */}
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
                <CardTitle>Evoluzione Estrazioni Totali</CardTitle>
                <CardDescription>Volume estratto in m³ per anno</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(temporalData, 'evoluzione_estrazioni')}>
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
                <Line type="monotone" dataKey="volume_m3" stroke="#FF8042" name="Volume Estratto (m³)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Distribuzione per Provincia - Anno {selectedYear}</CardTitle>
                <CardDescription>Volume estratto per provincia</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(provinceData, 'estrazioni_province')}>
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
                <Bar dataKey="volume_m3" fill="#FF8042" name="Volume (m³)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Distribuzione per Materiale - Anno {selectedYear}</CardTitle>
                <CardDescription>Volume estratto per tipologia di materiale</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(materialData, 'estrazioni_materiali')}>
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
                <Button variant="outline" size="sm" onClick={() => exportToExcel(comuneDetails, 'estrazioni_comuni')}>
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
                  <TableHead className="text-right">Volume Estratto (m³)</TableHead>
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
                              <div key={idx} className="text-sm border-l-2 border-orange-500 pl-3">
                                <div><strong>Azienda:</strong> {detail.azienda}</div>
                                <div><strong>Materiale:</strong> {detail.materiale}</div>
                                <div><strong>Volume Estratto:</strong> {detail.volume_estratto?.toLocaleString()} m³</div>
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
