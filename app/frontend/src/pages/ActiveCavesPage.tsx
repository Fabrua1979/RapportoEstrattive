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

export default function ActiveCavesPage() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [activeCavesData, setActiveCavesData] = useState<any[]>([]);
  const [authorizedCavesData, setAuthorizedCavesData] = useState<any[]>([]);
  const [caveDetails, setCaveDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedComune, setExpandedComune] = useState<string | null>(null);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch active caves data
      const activeCavesResponse = await client.entities.active_caves_data.query({});
      const activeCaves = activeCavesResponse.data?.items || [];
      setActiveCavesData(activeCaves);

      // Fetch authorized caves data for comparison
      const authorizedResponse = await client.entities.annual_cave_data.query({});
      const authorized = authorizedResponse.data?.items || [];
      setAuthorizedCavesData(authorized);

      // Fetch cave details
      const detailsResponse = await client.entities.cave_details.query({});
      const details = detailsResponse.data?.items || [];
      setCaveDetails(details);

      // Extract available years
      const years = [...new Set(activeCaves.map((d: any) => d.anno))].sort((a, b) => b - a);
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

  // Calculate temporal trend data
  const getTemporalTrendData = () => {
    const yearlyData: Record<number, { anno: number; cave_attive: number; cave_autorizzate: number }> = {};
    
    activeCavesData.forEach((item) => {
      if (!yearlyData[item.anno]) {
        yearlyData[item.anno] = { anno: item.anno, cave_attive: 0, cave_autorizzate: 0 };
      }
      yearlyData[item.anno].cave_attive += item.numero_cave;
    });

    authorizedCavesData.forEach((item) => {
      if (yearlyData[item.anno]) {
        yearlyData[item.anno].cave_autorizzate = item.numero_cave;
      }
    });

    return Object.values(yearlyData).sort((a, b) => a.anno - b.anno);
  };

  // Calculate percentage data
  const getPercentageData = () => {
    return getTemporalTrendData().map(item => ({
      anno: item.anno,
      percentuale: item.cave_autorizzate > 0 
        ? ((item.cave_attive / item.cave_autorizzate) * 100).toFixed(1)
        : 0
    }));
  };

  // Get data for selected year by province
  const getProvinceData = () => {
    const provinceMap: Record<string, { provincia: string; numero_cave: number; autorizzate: number }> = {};
    
    activeCavesData
      .filter(item => item.anno === selectedYear)
      .forEach(item => {
        if (!provinceMap[item.provincia]) {
          provinceMap[item.provincia] = { provincia: item.provincia, numero_cave: 0, autorizzate: 0 };
        }
        provinceMap[item.provincia].numero_cave += item.numero_cave;
      });

    // Get authorized caves for comparison
    authorizedCavesData
      .filter(item => item.anno === selectedYear)
      .forEach(item => {
        const provinceData = caveDetails.filter(d => d.anno === selectedYear && d.provincia === item.provincia);
        const provinceCount = provinceData.length;
        if (provinceMap[item.provincia]) {
          provinceMap[item.provincia].autorizzate = provinceCount;
        }
      });

    return Object.values(provinceMap).map(item => ({
      ...item,
      percentuale: item.autorizzate > 0 
        ? ((item.numero_cave / item.autorizzate) * 100).toFixed(1)
        : 0
    }));
  };

  // Get data for selected year by material
  const getMaterialData = () => {
    const materialMap: Record<string, number> = {};
    
    activeCavesData
      .filter(item => item.anno === selectedYear)
      .forEach(item => {
        materialMap[item.materiale] = (materialMap[item.materiale] || 0) + item.numero_cave;
      });

    return Object.entries(materialMap).map(([materiale, numero_cave]) => ({
      materiale,
      numero_cave
    }));
  };

  // Get comune details for selected year
  const getComuneDetails = () => {
    return caveDetails
      .filter(item => item.anno === selectedYear && item.stato_cava === 'Attiva')
      .reduce((acc: any[], item) => {
        const existing = acc.find(c => c.comune === item.comune);
        if (existing) {
          existing.numero_cave += 1;
          existing.dettagli.push(item);
        } else {
          acc.push({
            comune: item.comune,
            provincia: item.provincia,
            numero_cave: 1,
            dettagli: [item]
          });
        }
        return acc;
      }, [])
      .sort((a, b) => b.numero_cave - a.numero_cave);
  };

  const exportToExcel = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dati');
    XLSX.writeFile(wb, `${filename}_${selectedYear}.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Caricamento dati...</div>
      </div>
    );
  }

  const temporalData = getTemporalTrendData();
  const percentageData = getPercentageData();
  const provinceData = getProvinceData();
  const materialData = getMaterialData();
  const comuneDetails = getComuneDetails();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate('/menu')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Menu
              </Button>
              <h1 className="text-3xl font-bold text-gray-800">Cave in Attività</h1>
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
        {/* Temporal Trend */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Evoluzione Cave Attive vs Autorizzate</CardTitle>
                <CardDescription>Confronto temporale del numero di cave</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportToExcel(temporalData, 'evoluzione_cave_attive')}
              >
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
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="cave_attive" stroke="#00C49F" name="Cave Attive" strokeWidth={2} />
                <Line type="monotone" dataKey="cave_autorizzate" stroke="#0088FE" name="Cave Autorizzate" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Percentage Active */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Percentuale Cave Attive su Autorizzate</CardTitle>
                <CardDescription>Evoluzione del tasso di attività</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportToExcel(percentageData, 'percentuale_cave_attive')}
              >
                <Download className="w-4 h-4 mr-2" />
                Esporta
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={percentageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="anno" />
                <YAxis />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Bar dataKey="percentuale" fill="#FFBB28" name="% Attive" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Province Distribution */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Distribuzione per Provincia - Anno {selectedYear}</CardTitle>
                <CardDescription>Cave attive e percentuale su autorizzate</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportToExcel(provinceData, 'cave_attive_province')}
              >
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
                <Tooltip />
                <Legend />
                <Bar dataKey="numero_cave" fill="#00C49F" name="Cave Attive" />
                <Bar dataKey="percentuale" fill="#FF8042" name="% su Autorizzate" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Material Distribution */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Distribuzione per Materiale - Anno {selectedYear}</CardTitle>
                <CardDescription>Cave attive per tipologia di materiale</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportToExcel(materialData, 'cave_attive_materiali')}
              >
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
                  dataKey="numero_cave"
                  nameKey="materiale"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {materialData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Comune Details Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Dettagli per Comune - Anno {selectedYear}</CardTitle>
                <CardDescription>Clicca su un comune per vedere i dettagli delle cave</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportToExcel(comuneDetails, 'cave_attive_comuni')}
              >
                <Download className="w-4 h-4 mr-2" />
                Esporta
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Comune</TableHead>
                  <TableHead>Provincia</TableHead>
                  <TableHead className="text-right">N. Cave Attive</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comuneDetails.map((item, index) => (
                  <>
                    <TableRow 
                      key={index}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpandedComune(expandedComune === item.comune ? null : item.comune)}
                    >
                      <TableCell>
                        {expandedComune === item.comune ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{item.comune}</TableCell>
                      <TableCell>{item.provincia}</TableCell>
                      <TableCell className="text-right">{item.numero_cave}</TableCell>
                    </TableRow>
                    {expandedComune === item.comune && (
                      <TableRow>
                        <TableCell colSpan={4} className="bg-gray-50">
                          <div className="p-4 space-y-2">
                            {item.dettagli.map((detail: any, idx: number) => (
                              <div key={idx} className="text-sm border-l-2 border-green-500 pl-3">
                                <div><strong>Azienda:</strong> {detail.azienda}</div>
                                <div><strong>Località:</strong> {detail.localita}</div>
                                <div><strong>Materiale:</strong> {detail.materiale}</div>
                                <div><strong>Fascicolo:</strong> {detail.numero_fascicolo}</div>
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