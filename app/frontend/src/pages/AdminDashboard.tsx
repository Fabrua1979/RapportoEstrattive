import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Home, LogOut, Upload, Plus, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

const client = createClient();

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Manual entry form
  const [anno, setAnno] = useState('');
  const [numeroCave, setNumeroCave] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Excel upload
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

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Check if year already exists
      const existingData = await client.entities.annual_cave_data.query({
        query: { anno: parseInt(anno) },
        limit: 1
      });

      if (existingData.data.items.length > 0) {
        // Update existing record
        await client.entities.annual_cave_data.update({
          id: existingData.data.items[0].id,
          data: {
            numero_cave: parseInt(numeroCave),
            updated_at: new Date().toISOString()
          }
        });
        toast({
          title: 'Dati aggiornati',
          description: `Anno ${anno} aggiornato con ${numeroCave} cave`
        });
      } else {
        // Create new record
        await client.entities.annual_cave_data.create({
          data: {
            anno: parseInt(anno),
            numero_cave: parseInt(numeroCave),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        });
        toast({
          title: 'Dati inseriti',
          description: `Anno ${anno} creato con ${numeroCave} cave`
        });
      }

      setAnno('');
      setNumeroCave('');
    } catch (error: any) {
      const detail = error?.data?.detail || error?.response?.data?.detail || error.message;
      toast({
        title: 'Errore',
        description: detail,
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
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
      // Read Excel file
      const data = await excelFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log('Total rows:', jsonData.length);
      console.log('Sample row:', jsonData[0]);

      // Prepare cave details (file already filtered for AUTORIZZATA)
      const caveDetails = jsonData.map((row: any) => {
        const detail = {
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
        };
        return detail;
      });

      if (caveDetails.length === 0) {
        toast({
          title: 'Errore',
          description: 'Il file Excel è vuoto o non contiene dati validi',
          variant: 'destructive'
        });
        setUploading(false);
        return;
      }

      console.log('Prepared cave details:', caveDetails.length);

      // Delete existing records for this year
      const existingRecords = await client.entities.cave_details.query({
        query: { anno: parseInt(excelAnno) },
        limit: 1000
      });

      console.log('Existing records to delete:', existingRecords.data.items.length);

      for (const record of existingRecords.data.items) {
        await client.entities.cave_details.delete({ id: record.id });
      }

      // Insert new records in batches
      let insertedCount = 0;
      for (const detail of caveDetails) {
        try {
          await client.entities.cave_details.create({ data: detail });
          insertedCount++;
        } catch (err) {
          console.error('Error inserting record:', err);
        }
      }

      console.log('Inserted records:', insertedCount);

      // Update or create annual summary
      const existingAnnual = await client.entities.annual_cave_data.query({
        query: { anno: parseInt(excelAnno) },
        limit: 1
      });

      if (existingAnnual.data.items.length > 0) {
        await client.entities.annual_cave_data.update({
          id: existingAnnual.data.items[0].id,
          data: {
            numero_cave: insertedCount,
            updated_at: new Date().toISOString()
          }
        });
      } else {
        await client.entities.annual_cave_data.create({
          data: {
            anno: parseInt(excelAnno),
            numero_cave: insertedCount,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        });
      }

      toast({
        title: 'File caricato con successo',
        description: `${insertedCount} cave autorizzate caricate per l'anno ${excelAnno}`
      });

      setExcelFile(null);
      setExcelAnno('');
      // Reset file input
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
      {/* Header */}
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

        <div className="grid md:grid-cols-2 gap-6">
          {/* Manual Entry Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Inserimento Manuale
              </CardTitle>
              <CardDescription>
                Inserisci o aggiorna il numero totale di cave autorizzate per anno
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="anno">Anno</Label>
                  <Input
                    id="anno"
                    type="number"
                    placeholder="es. 2025"
                    value={anno}
                    onChange={(e) => setAnno(e.target.value)}
                    required
                    min="2000"
                    max="2100"
                  />
                </div>
                <div>
                  <Label htmlFor="numeroCave">Numero Cave Autorizzate</Label>
                  <Input
                    id="numeroCave"
                    type="number"
                    placeholder="es. 150"
                    value={numeroCave}
                    onChange={(e) => setNumeroCave(e.target.value)}
                    required
                    min="0"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    'Salva Dati'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Excel Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Caricamento File Excel
              </CardTitle>
              <CardDescription>
                Carica un file Excel con le cave autorizzate (già filtrate)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleExcelUpload} className="space-y-4">
                <div>
                  <Label htmlFor="excelAnno">Anno di Riferimento</Label>
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
                  <Label htmlFor="excel-file">File Excel (.xlsx)</Label>
                  <Input
                    id="excel-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Colonne richieste: Numero Fascicolo, Comune, Provincia, Stato Cava, Materiale
                  </p>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Caricamento...
                    </>
                  ) : (
                    'Carica File'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Informazioni</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Usa il file Excel semplificato con solo 5 colonne essenziali</li>
              <li>• Il file deve contenere SOLO le cave già filtrate come "AUTORIZZATA"</li>
              <li>• Colonne richieste: Numero Fascicolo, Comune, Provincia, Stato Cava, Materiale</li>
              <li>• I dati caricati sostituiranno quelli esistenti per lo stesso anno</li>
              <li>• Il numero totale di cave viene aggiornato automaticamente</li>
              <li>• Le elaborazioni grafiche si aggiorneranno nella dashboard</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}