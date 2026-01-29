import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const client = createClient();

export default function EmploymentPage() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [employmentData, setEmploymentData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await client.entities.employment_data.query({});
      const data = response.data?.items || [];
      setEmploymentData(data);
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
    employmentData.forEach((item) => {
      if (!yearlyData[item.anno]) yearlyData[item.anno] = { anno: item.anno, occupati: 0 };
      yearlyData[item.anno].occupati += item.numero_occupati;
    });
    return Object.values(yearlyData).sort((a: any, b: any) => a.anno - b.anno);
  };

  const getProvinceData = () => {
    const map: Record<string, any> = {};
    employmentData.filter(i => i.anno === selectedYear).forEach(i => {
      if (!map[i.provincia]) map[i.provincia] = { provincia: i.provincia, occupati: 0 };
      map[i.provincia].occupati += i.numero_occupati;
    });
    return Object.values(map);
  };

  const getMaterialData = () => {
    const map: Record<string, number> = {};
    employmentData.filter(i => i.anno === selectedYear).forEach(i => {
      map[i.materiale] = (map[i.materiale] || 0) + i.numero_occupati;
    });
    return Object.entries(map).map(([materiale, occupati]) => ({ materiale, occupati }));
  };

  const exportToExcel = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dati');
    XLSX.writeFile(wb, `${filename}_${selectedYear}.xlsx`);
  };

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center"><div className="text-xl text-gray-600">Caricamento...</div></div>;

  const temporalData = getTemporalData();
  const provinceData = getProvinceData();
  const materialData = getMaterialData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate('/menu')}><ArrowLeft className="w-4 h-4 mr-2" />Menu</Button>
              <h1 className="text-3xl font-bold text-gray-800">Occupazione</h1>
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
              <div><CardTitle>Evoluzione Occupati</CardTitle></div>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(temporalData, 'evoluzione_occupati')}><Download className="w-4 h-4 mr-2" />Esporta</Button>
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
                <Line type="monotone" dataKey="occupati" stroke="#82CA9D" name="Occupati" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div><CardTitle>Occupati per Provincia - {selectedYear}</CardTitle></div>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(provinceData, 'occupati_province')}><Download className="w-4 h-4 mr-2" />Esporta</Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={provinceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="provincia" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="occupati" fill="#82CA9D" name="Occupati" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div><CardTitle>Occupati per Materiale - {selectedYear}</CardTitle></div>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(materialData, 'occupati_materiali')}><Download className="w-4 h-4 mr-2" />Esporta</Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={materialData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="materiale" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="occupati" fill="#8884D8" name="Occupati" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}