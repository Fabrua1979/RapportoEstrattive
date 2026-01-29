import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Home, LogOut, Upload, Plus, Loader2, Database } from 'lucide-react';
import * as XLSX from 'xlsx';

const client = createClient();

const PROVINCE = ['BA', 'BT', 'BR', 'FG', 'LE', 'TA'];
const MATERIALI = ['Calcare', 'Calcarenite', 'Argilla', 'Conglomerati', 'Tufo', 'Pietra', 'Sabbia', 'Ghiaia', 'Altro'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Manual entry for trend (annual total)
  const [annoTrend, setAnnoTrend] = useState('');
  const [numeroCaveTrend, setNumeroCaveTrend] = useState('');
  const [submittingTrend, setSubmittingTrend] = useState(false);
  
  // Manual entry for province/material data
  const [annoDettaglio, setAnnoDettaglio] = useState('');
  const [provincia, setProvincia] = useState('');
  const [materiale, setMateriale] = useState('');
  const [numeroCaveDettaglio, setNumeroCaveDettaglio] = useState('');
  const [submittingDettaglio, setSubmittingDettaglio] = useState(false);
  
  // Excel upload (only for comune details)
  const [excelAnno, setExcelAnno] = useState('');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await client.auth.me();
      if (!userData.data) {
        navigate('/login');
        return;
      }
      setUser(userData.data);
    } catch (error) {
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await client.auth.logout();
    navigate('/');
  };

  const handleTrendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingTrend(true);

    try {
      const existingData = await client.entities.annual_cave_data.query({
        query: { anno: parseInt(annoTrend) },
        limit: 1
      });

      if (existingData.data.items.length > 0) {
        await client.entities.annual_cave_data.update({
          id: existingData.data.items[0].id,
          data: {
            numero_cave: parseInt(numeroCaveTrend),
            updated_at: new Date().toISOString()
          }
        });
        toast({
          title: 'Trend aggiornato',
          description: `Anno ${annoTrend} aggiornato con ${numeroCaveTrend} cave`
        });
      } else {
        await client.entities.annual_cave_data.create({
          data: {
            anno: parseInt(annoTrend),
            numero_cave: parseInt(numeroCaveTrend),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        });
        toast({
          title: 'Trend inserito',
          description: `Anno ${annoTrend} creato con ${numeroCaveTrend} cave`
        });
      }

      setAnnoTrend('');
      setNumeroCaveTrend('');
    } catch (error: any) {
      const detail = error?.data?.detail || error?.response?.data?.detail || error.message;
      toast({
        title: 'Errore',
        description: detail,
        variant: 'destructive'
      });
    } finally {
      setSubmittingTrend(false);
    }
  };

  const handleDettaglioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingDettaglio(true);

    try {
      const existingData = await client.entities.province_material_data.query({
        query: { 
          anno: parseInt(annoDettaglio),
          provincia: provincia,
          materiale: materiale
        },
        limit: 1
      });

      if (existingData.data.items.length > 0) {
        await client.entities.province_material_data.update({
          id: existingData.data.items[0].id,
          data: {
            numero_cave: parseInt(numeroCaveDettaglio),
            updated_at: new Date().toISOString()
          }
        });
        toast({
          title: 'Dati aggiornati',
          description: `${provincia} - ${materiale} (${annoDettaglio}): ${numeroCaveDettaglio} cave`
        });
      } else {
        await client.entities.province_material_data.create({
          data: {
            anno: parseInt(annoDettaglio),
            provincia: provincia,
            materiale: materiale,
            numero_cave: parseInt(numeroCaveDettaglio),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        });
        toast({
          title: 'Dati inseriti',
          description: `${provincia} - ${materiale} (${annoDettaglio}): ${numeroCaveDettaglio} cave`
        });
      }

      setNumeroCaveDettaglio('');
    } catch (error: any) {
      const detail = error?.data?.detail || error?.response?.data?.detail || error.message;
      toast({
        title: 'Errore',
        description: detail,
        variant: 'destructive'
      });
    } finally {
      setSubmittingDettaglio(false);
    }
  };

  const handleExcelUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelFile || !excelAnno) {
      toast({
        title: 'Errore',
        description: 'Seleziona un file Excel e specifica l\'anno',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      const data = await excelFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log('Total rows:', jsonData.length);

      const caveDetails = jsonData.map((row: any) => ({
        anno: parseInt(excelAnno),
        numero_fascicolo: row['Numero Fascicolo'] ? String(row['Numero Fascicolo']).trim() : '',
        comune: row['Comune'] ? String(row['Comune']).trim() : '',
        provincia: row['Provincia'] ? String(row['Provincia']).trim() : '',
        stato_cava: row['Stato Cava'] ? String(row['Stato Cava']).trim() : 'AUTORIZZATA',
        materiale: row['Materiale'] ? String(row['Materiale']).trim() : '',
        azienda: '',
        localita: '',
        dati_catastali: '',
        aperta_fino_al: null,
        numero_decreto: null,
        data_decreto: null,
        scadenza_autorizzazione: null,
        created_at: new Date().toISOString()
      }));

      if (caveDetails.length === 0) {
        toast({
          title: 'Errore',
          description: 'Il file Excel è vuoto',
          variant: 'destructive'
        });
        setUploading(false);
        return;
      }

      const existingRecords = await client.entities.cave_details.query({
        query: { anno: parseInt(excelAnno) },
        limit: 1000
      });

      for (const record of existingRecords.data.items) {
        await client.entities.cave_details.delete({ id: record.id });
      }

      let insertedCount = 0;
      for (const detail of caveDetails) {
        try {
          await client.entities.cave_details.create({ data: detail });
          insertedCount++;
        } catch (err) {
          console.error('Error inserting record:', err);
        }
      }

      toast({
        title: 'File caricato',
        description: `${insertedCount} cave caricate per l'anno ${excelAnno}. I dettagli per comune sono ora disponibili nella dashboard.`
      });

      setExcelFile(null);
      setExcelAnno('');
      const fileInput = document.getElementById('excel-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      console.error('Upload error:', error);
      const detail = error?.data?.detail || error?.response?.data?.detail || error.message;
      toast({
        title: 'Errore nel caricamento',
        description: detail,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
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
          <h1 className="text-2xl font-bold text-gray-800">Pannello Amministrativo</h1>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/menu')}>
              <Home className="w-4 h-4 mr-2" />
              Menu
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Esci
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Benvenuto, {user?.email}</h2>
          <p className="text-gray-600">Gestisci i dati delle cave autorizzate</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Trend Temporale */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Trend Temporale
              </CardTitle>
              <CardDescription>
                Numero totale cave per anno (grafico trend)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTrendSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="annoTrend">Anno</Label>
                  <Input
                    id="annoTrend"
                    type="number"
                    placeholder="es. 2025"
                    value={annoTrend}
                    onChange={(e) => setAnnoTrend(e.target.value)}
                    required
                    min="2000"
                    max="2100"
                  />
                </div>
                <div>
                  <Label htmlFor="numeroCaveTrend">Numero Cave</Label>
                  <Input
                    id="numeroCaveTrend"
                    type="number"
                    placeholder="es. 150"
                    value={numeroCaveTrend}
                    onChange={(e) => setNumeroCaveTrend(e.target.value)}
                    required
                    min="0"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={submittingTrend}
                >
                  {submittingTrend ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    'Salva'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Dati Provincia/Materiale */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Dati Dettaglio
              </CardTitle>
              <CardDescription>
                Cave per provincia e materiale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDettaglioSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="annoDettaglio">Anno</Label>
                  <Input
                    id="annoDettaglio"
                    type="number"
                    placeholder="es. 2025"
                    value={annoDettaglio}
                    onChange={(e) => setAnnoDettaglio(e.target.value)}
                    required
                    min="2000"
                    max="2100"
                  />
                </div>
                <div>
                  <Label htmlFor="provincia">Provincia</Label>
                  <Select value={provincia} onValueChange={setProvincia} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona provincia" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVINCE.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="materiale">Materiale</Label>
                  <Select value={materiale} onValueChange={setMateriale} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona materiale" />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIALI.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="numeroCaveDettaglio">Numero Cave</Label>
                  <Input
                    id="numeroCaveDettaglio"
                    type="number"
                    placeholder="es. 25"
                    value={numeroCaveDettaglio}
                    onChange={(e) => setNumeroCaveDettaglio(e.target.value)}
                    required
                    min="0"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={submittingDettaglio}
                >
                  {submittingDettaglio ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    'Salva'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Excel Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Carica Excel
              </CardTitle>
              <CardDescription>
                Dettagli per comune (solo per tabella)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleExcelUpload} className="space-y-4">
                <div>
                  <Label htmlFor="excelAnno">Anno</Label>
                  <Input
                    id="excelAnno"
                    type="number"
                    placeholder="es. 2025"
                    value={excelAnno}
                    onChange={(e) => setExcelAnno(e.target.value)}
                    required
                    min="2000"
                    max="2100"
                  />
                </div>
                <div>
                  <Label htmlFor="excel-file">File Excel</Label>
                  <Input
                    id="excel-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Caricamento...
                    </>
                  ) : (
                    'Carica'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Guida</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li><strong>Trend Temporale:</strong> Inserisci il totale annuale per il grafico di evoluzione temporale</li>
              <li><strong>Dati Dettaglio:</strong> Inserisci cave per provincia e materiale (per grafici di distribuzione)</li>
              <li><strong>Carica Excel:</strong> Carica file con dettagli per comune (visibili nella tabella dettagliata)</li>
              <li>• I tre tipi di dati sono indipendenti e non si influenzano a vicenda</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}