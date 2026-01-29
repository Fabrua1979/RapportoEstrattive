import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const client = createClient();

export default function PricesPage() {
  const navigate = useNavigate();
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [availableMaterials, setAvailableMaterials] = useState<string[]>([]);
  const [priceData, setPriceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await client.entities.price_data.query({});
      const data = response.data?.items || [];
      setPriceData(data);
      const materials = [...new Set(data.map((d: any) => d.classe_materiale))];
      setAvailableMaterials(materials);
      if (materials.length > 0) setSelectedMaterial(materials[0]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTemporalData = () => {
    return priceData
      .filter(item => item.classe_materiale === selectedMaterial)
      .sort((a, b) => a.anno - b.anno);
  };

  const exportToExcel = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dati');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center"><div className="text-xl text-gray-600">Caricamento...</div></div>;

  const temporalData = getTemporalData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate('/menu')}><ArrowLeft className="w-4 h-4 mr-2" />Menu</Button>
              <h1 className="text-3xl font-bold text-gray-800">Prezzi (€/m³)</h1>
            </div>
            <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
              <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
              <SelectContent>{availableMaterials.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div><CardTitle>Evoluzione Prezzo - {selectedMaterial}</CardTitle></div>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(temporalData, `prezzi_${selectedMaterial}`)}><Download className="w-4 h-4 mr-2" />Esporta</Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={temporalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="anno" />
                <YAxis />
                <Tooltip formatter={(v) => `€${v}/m³`} />
                <Legend />
                <Line type="monotone" dataKey="prezzo_euro_m3" stroke="#FF6B9D" name="Prezzo (€/m³)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}