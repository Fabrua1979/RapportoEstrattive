import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowLeft, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const client = createClient();

export default function DestinationsPage() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [destinationData, setDestinationData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await client.entities.destination_data.query({});
      const data = response.data?.items || [];
      setDestinationData(data);
      const years = [...new Set(data.map((d: any) => d.anno))].sort((a, b) => b - a);
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
    destinationData.forEach((item) => {
      if (!yearlyData[item.anno]) yearlyData[item.anno] = { anno: item.anno, locale: 0, nazionale: 0, estera: 0 };
      if (item.destinazione_tipo === 'locale') yearlyData[item.anno].locale += item.volume_m3;
      if (item.destinazione_tipo === 'nazionale') yearlyData[item.anno].nazionale += item.volume_m3;
      if (item.destinazione_tipo === 'estera') yearlyData[item.anno].estera += item.volume_m3;
    });
    return Object.values(yearlyData).sort((a: any, b: any) => a.anno - b.anno);
  };

  const getForeignDestinations = () => {
    const map: Record<string, number> = {};
    destinationData
      .filter(i => i.anno === selectedYear && i.destinazione_tipo === 'estera' && i.destinazione_dettaglio)
      .forEach(i => {
        map[i.destinazione_dettaglio] = (map[i.destinazione_dettaglio] || 0) + i.volume_m3;
      });
    return Object.entries(map).map(([paese, volume_m3]) => ({ paese, volume_m3 }));
  };

  const getDistributionData = () => {
    const map: Record<string, number> = { locale: 0, nazionale: 0, estera: 0 };
    destinationData.filter(i => i.anno === selectedYear).forEach(i => {
      map[i.destinazione_tipo] += i.volume_m3;
    });
    return Object.entries(map).map(([tipo, volume_m3]) => ({ tipo, volume_m3 }));
  };

  const exportToExcel = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dati');
    XLSX.writeFile(wb, `${filename}_${selectedYear}.xlsx`);
  };

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center"><div className="text-xl text-gray-600">Caricamento...</div></div>;

  const temporalData = getTemporalData();
  const foreignDestinations = getForeignDestinations();
  const distributionData = getDistributionData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate('/menu')}><ArrowLeft className="w-4 h-4 mr-2" />Menu</Button>
              <h1 className="text-3xl font-bold text-gray-800">Destinazioni Geografiche</h1>
            </div>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>{availableYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div><CardTitle>Evoluzione Destinazioni</CardTitle></div>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(temporalData, 'evoluzione_destinazioni')}><Download className="w-4 h-4 mr-2" />Esporta</Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={temporalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="anno" />
                <YAxis />
                <Tooltip formatter={(v) => `${v.toLocaleString()} m³`} />
                <Legend />
                <Line type="monotone" dataKey="locale" stroke="#0088FE" name="Locale" strokeWidth={2} />
                <Line type="monotone" dataKey="nazionale" stroke="#00C49F" name="Nazionale" strokeWidth={2} />
                <Line type="monotone" dataKey="estera" stroke="#FFBB28" name="Estera" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div><CardTitle>Distribuzione Destinazioni - {selectedYear}</CardTitle></div>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(distributionData, 'distribuzione_destinazioni')}><Download className="w-4 h-4 mr-2" />Esporta</Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={distributionData} dataKey="volume_m3" nameKey="tipo" cx="50%" cy="50%" outerRadius={100} label>
                  {distributionData.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v.toLocaleString()} m³`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div><CardTitle>Destinazioni Estere - {selectedYear}</CardTitle></div>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(foreignDestinations, 'destinazioni_estere')}><Download className="w-4 h-4 mr-2" />Esporta</Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={foreignDestinations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="paese" />
                <YAxis />
                <Tooltip formatter={(v) => `${v.toLocaleString()} m³`} />
                <Bar dataKey="volume_m3" fill="#FFBB28" name="Volume (m³)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}