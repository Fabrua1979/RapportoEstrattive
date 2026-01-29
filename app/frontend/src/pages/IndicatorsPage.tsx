import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const client = createClient();

export default function IndicatorsPage() {
  const navigate = useNavigate();
  const [viewByMaterial, setViewByMaterial] = useState(false);
  const [economicData, setEconomicData] = useState<any[]>([]);
  const [employmentData, setEmploymentData] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [economic, employment, sales] = await Promise.all([
        client.entities.economic_data.query({}),
        client.entities.employment_data.query({}),
        client.entities.sales_data.query({})
      ]);
      setEconomicData(economic.data?.items || []);
      setEmploymentData(employment.data?.items || []);
      setSalesData(sales.data?.items || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateIndicators = () => {
    if (viewByMaterial) {
      const materialMap: Record<string, any> = {};
      economicData.forEach((item) => {
        const key = `${item.anno}_${item.materiale}`;
        if (!materialMap[key]) {
          materialMap[key] = { anno: item.anno, materiale: item.materiale, fatturato: 0, utile_lordo: 0, utile_netto: 0, dipendenti: 0, vendite: 0 };
        }
        materialMap[key].fatturato += item.fatturato;
        materialMap[key].utile_lordo += item.utile_lordo;
        materialMap[key].utile_netto += item.utile_netto;
      });

      employmentData.forEach((item) => {
        const key = `${item.anno}_${item.materiale}`;
        if (materialMap[key]) materialMap[key].dipendenti += item.numero_occupati;
      });

      salesData.forEach((item) => {
        const key = `${item.anno}_${item.materiale}`;
        if (materialMap[key]) materialMap[key].vendite += item.volume_m3;
      });

      return Object.values(materialMap).map((item: any) => ({
        label: `${item.anno} - ${item.materiale}`,
        anno: item.anno,
        materiale: item.materiale,
        margine_lordo: item.fatturato > 0 ? ((item.utile_lordo / item.fatturato) * 100).toFixed(2) : 0,
        margine_netto: item.fatturato > 0 ? ((item.utile_netto / item.fatturato) * 100).toFixed(2) : 0,
        fatturato_per_dipendente: item.dipendenti > 0 ? (item.fatturato / item.dipendenti).toFixed(0) : 0,
        fatturato_per_m3: item.vendite > 0 ? (item.fatturato / item.vendite).toFixed(2) : 0
      }));
    } else {
      const yearlyData: Record<number, any> = {};
      economicData.forEach((item) => {
        if (!yearlyData[item.anno]) {
          yearlyData[item.anno] = { anno: item.anno, fatturato: 0, utile_lordo: 0, utile_netto: 0, dipendenti: 0, vendite: 0 };
        }
        yearlyData[item.anno].fatturato += item.fatturato;
        yearlyData[item.anno].utile_lordo += item.utile_lordo;
        yearlyData[item.anno].utile_netto += item.utile_netto;
      });

      employmentData.forEach((item) => {
        if (yearlyData[item.anno]) yearlyData[item.anno].dipendenti += item.numero_occupati;
      });

      salesData.forEach((item) => {
        if (yearlyData[item.anno]) yearlyData[item.anno].vendite += item.volume_m3;
      });

      return Object.values(yearlyData)
        .sort((a: any, b: any) => a.anno - b.anno)
        .map((item: any) => ({
          label: item.anno.toString(),
          anno: item.anno,
          margine_lordo: item.fatturato > 0 ? ((item.utile_lordo / item.fatturato) * 100).toFixed(2) : 0,
          margine_netto: item.fatturato > 0 ? ((item.utile_netto / item.fatturato) * 100).toFixed(2) : 0,
          fatturato_per_dipendente: item.dipendenti > 0 ? (item.fatturato / item.dipendenti).toFixed(0) : 0,
          fatturato_per_m3: item.vendite > 0 ? (item.fatturato / item.vendite).toFixed(2) : 0
        }));
    }
  };

  const exportToExcel = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dati');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center"><div className="text-xl text-gray-600">Caricamento...</div></div>;

  const indicators = calculateIndicators();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate('/menu')}><ArrowLeft className="w-4 h-4 mr-2" />Menu</Button>
              <h1 className="text-3xl font-bold text-gray-800">Indicatori KPI</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="view-mode">Vista Generale</Label>
              <Switch id="view-mode" checked={viewByMaterial} onCheckedChange={setViewByMaterial} />
              <Label htmlFor="view-mode">Per Materiale</Label>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div><CardTitle>Margine Lordo / Fatturato (%)</CardTitle></div>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(indicators, 'margine_lordo')}><Download className="w-4 h-4 mr-2" />Esporta</Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={indicators}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend />
                <Line type="monotone" dataKey="margine_lordo" stroke="#00C49F" name="Margine Lordo (%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div><CardTitle>Margine Netto / Fatturato (%)</CardTitle></div>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(indicators, 'margine_netto')}><Download className="w-4 h-4 mr-2" />Esporta</Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={indicators}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend />
                <Line type="monotone" dataKey="margine_netto" stroke="#0088FE" name="Margine Netto (%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div><CardTitle>Fatturato / Dipendenti (€)</CardTitle></div>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(indicators, 'fatturato_dipendenti')}><Download className="w-4 h-4 mr-2" />Esporta</Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={indicators}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(v) => `€${v.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="fatturato_per_dipendente" stroke="#FFBB28" name="Fatturato/Dipendente (€)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div><CardTitle>Fatturato / Vendite (€/m³)</CardTitle></div>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(indicators, 'fatturato_vendite')}><Download className="w-4 h-4 mr-2" />Esporta</Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={indicators}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(v) => `€${v}/m³`} />
                <Legend />
                <Line type="monotone" dataKey="fatturato_per_m3" stroke="#FF8042" name="Fatturato/Vendite (€/m³)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}