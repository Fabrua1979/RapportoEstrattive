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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  useEffect(() => {
    fetchData();
  }, []);

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

  const exportToExcel = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dati');
    XLSX.writeFile(wb, `${filename}_${selectedYear}.xlsx`);
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
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div><CardTitle>Evoluzione Vendite vs Estrazioni</CardTitle></div>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(temporalData, 'vendite_estrazioni')}><Download className="w-4 h-4 mr-2" />Esporta</Button>
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
                <Line type="monotone" dataKey="vendite" stroke="#8884D8" name="Vendite (m³)" strokeWidth={2} />
                <Line type="monotone" dataKey="estrazioni" stroke="#FF8042" name="Estrazioni (m³)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div><CardTitle>% Venduto su Estratto</CardTitle></div>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(percentageData, 'percentuale_vendite')}><Download className="w-4 h-4 mr-2" />Esporta</Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={percentageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="anno" />
                <YAxis />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="percentuale" fill="#00C49F" name="% Venduto" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div><CardTitle>Vendite per Provincia - {selectedYear}</CardTitle></div>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(provinceData, 'vendite_province')}><Download className="w-4 h-4 mr-2" />Esporta</Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={provinceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="provincia" />
                <YAxis />
                <Tooltip formatter={(v) => `${v.toLocaleString()} m³`} />
                <Bar dataKey="volume_m3" fill="#8884D8" name="Volume (m³)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div><CardTitle>Vendite per Materiale - {selectedYear}</CardTitle></div>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(materialData, 'vendite_materiali')}><Download className="w-4 h-4 mr-2" />Esporta</Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={materialData} dataKey="volume_m3" nameKey="materiale" cx="50%" cy="50%" outerRadius={100} label>
                  {materialData.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v.toLocaleString()} m³`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}