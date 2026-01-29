import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const client = createClient();

export default function EconomicDataPage() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [economicData, setEconomicData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await client.entities.economic_data.query({});
      const data = response.data?.items || [];
      setEconomicData(data);
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
    economicData.forEach((item) => {
      if (!yearlyData[item.anno]) {
        yearlyData[item.anno] = { anno: item.anno, fatturato: 0, costi: 0, utile_lordo: 0, utile_netto: 0 };
      }
      yearlyData[item.anno].fatturato += item.fatturato;
      yearlyData[item.anno].costi += item.costi;
      yearlyData[item.anno].utile_lordo += item.utile_lordo;
      yearlyData[item.anno].utile_netto += item.utile_netto;
    });
    return Object.values(yearlyData).sort((a: any, b: any) => a.anno - b.anno);
  };

  const getProvinceData = () => {
    const map: Record<string, any> = {};
    economicData.filter(i => i.anno === selectedYear).forEach(i => {
      if (!map[i.provincia]) map[i.provincia] = { provincia: i.provincia, fatturato: 0 };
      map[i.provincia].fatturato += i.fatturato;
    });
    return Object.values(map);
  };

  const getMaterialData = () => {
    const map: Record<string, number> = {};
    economicData.filter(i => i.anno === selectedYear).forEach(i => {
      map[i.materiale] = (map[i.materiale] || 0) + i.fatturato;
    });
    return Object.entries(map).map(([materiale, fatturato]) => ({ materiale, fatturato }));
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
              <h1 className="text-3xl font-bold text-gray-800">Dati Economici (€)</h1>
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
              <div><CardTitle>Evoluzione Fatturato e Utile Netto</CardTitle></div>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(temporalData, 'evoluzione_economica')}><Download className="w-4 h-4 mr-2" />Esporta</Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={temporalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="anno" />
                <YAxis />
                <Tooltip formatter={(v) => `€${v.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="fatturato" stroke="#00C49F" name="Fatturato (€)" strokeWidth={2} />
                <Line type="monotone" dataKey="utile_netto" stroke="#0088FE" name="Utile Netto (€)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div><CardTitle>Dettaglio Economico Annuale</CardTitle></div>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(temporalData, 'dettaglio_economico')}><Download className="w-4 h-4 mr-2" />Esporta</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Anno</TableHead>
                  <TableHead className="text-right">Fatturato (€)</TableHead>
                  <TableHead className="text-right">Costi (€)</TableHead>
                  <TableHead className="text-right">Utile Lordo (€)</TableHead>
                  <TableHead className="text-right">Utile Netto (€)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {temporalData.map((item: any) => (
                  <TableRow key={item.anno}>
                    <TableCell className="font-medium">{item.anno}</TableCell>
                    <TableCell className="text-right">€{item.fatturato.toLocaleString()}</TableCell>
                    <TableCell className="text-right">€{item.costi.toLocaleString()}</TableCell>
                    <TableCell className="text-right">€{item.utile_lordo.toLocaleString()}</TableCell>
                    <TableCell className="text-right">€{item.utile_netto.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div><CardTitle>Fatturato per Provincia - {selectedYear}</CardTitle></div>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(provinceData, 'fatturato_province')}><Download className="w-4 h-4 mr-2" />Esporta</Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={provinceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="provincia" />
                <YAxis />
                <Tooltip formatter={(v) => `€${v.toLocaleString()}`} />
                <Bar dataKey="fatturato" fill="#00C49F" name="Fatturato (€)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div><CardTitle>Fatturato per Materiale - {selectedYear}</CardTitle></div>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(materialData, 'fatturato_materiali')}><Download className="w-4 h-4 mr-2" />Esporta</Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={materialData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="materiale" />
                <YAxis />
                <Tooltip formatter={(v) => `€${v.toLocaleString()}`} />
                <Bar dataKey="fatturato" fill="#FFBB28" name="Fatturato (€)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}