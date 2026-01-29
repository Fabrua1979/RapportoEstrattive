import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, Trash2, Plus, Settings, Mountain, Activity, TrendingUp, ShoppingCart, DollarSign, Users, Tag, MapPin, Target, Save } from 'lucide-react';
import * as XLSX from 'xlsx';

const client = createClient();

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeChapter, setActiveChapter] = useState<string>('config');

  // Configuration states
  const [provinces, setProvinces] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [priceMaterials, setPriceMaterials] = useState<any[]>([]);
  const [foreignDestinations, setForeignDestinations] = useState<any[]>([]);

  // Form states for configuration
  const [newProvince, setNewProvince] = useState('');
  const [newMaterial, setNewMaterial] = useState('');
  const [newPriceMaterial, setNewPriceMaterial] = useState({ name: '', parent_id: '' });
  const [newDestination, setNewDestination] = useState('');

  // Reset states
  const [resetYear, setResetYear] = useState<number>(2025);
  const [resetChapter, setResetChapter] = useState<string>('');

  // Form states for Cave Attive
  const [activeCavesForm, setActiveCavesForm] = useState({
    anno: 2025,
    provincia: '',
    materiale: '',
    cave_attive: 0,
    percentuale_su_autorizzate: 0
  });

  // Form states for Estrazioni
  const [extractionsForm, setExtractionsForm] = useState({
    anno: 2025,
    provincia: '',
    materiale: '',
    volume_estratto_m3: 0
  });

  // Form states for Vendite
  const [salesForm, setSalesForm] = useState({
    anno: 2025,
    provincia: '',
    materiale: '',
    volume_venduto_m3: 0,
    percentuale_su_estratto: 0
  });

  // Form states for Dati Economici
  const [economicForm, setEconomicForm] = useState({
    anno: 2025,
    provincia: '',
    materiale: '',
    fatturato_euro: 0,
    costi_euro: 0,
    utile_lordo_euro: 0,
    utile_netto_euro: 0
  });

  // Form states for Occupazione
  const [employmentForm, setEmploymentForm] = useState({
    anno: 2025,
    provincia: '',
    materiale: '',
    numero_occupati: 0
  });

  // Form states for Prezzi
  const [priceForm, setPriceForm] = useState({
    anno: 2025,
    materiale_prezzo_id: '',
    prezzo_euro_m3: 0
  });

  // Form states for Destinazioni
  const [destinationForm, setDestinationForm] = useState({
    anno: 2025,
    provincia: '',
    materiale: '',
    locale_m3: 0,
    nazionale_m3: 0,
    estero_m3: 0,
    destinazione_estera_id: ''
  });

  // Form states for Concorrenti
  const [competitorForm, setCompetitorForm] = useState({
    anno: 2025,
    provincia: '',
    materiale: '',
    comunale: 0,
    provinciale: 0,
    regionale: 0,
    nazionale: 0,
    internazionale: 0
  });

  // Form states for Cave Autorizzate
  const [caveAutorizzateForm, setCaveAutorizzateForm] = useState({
    anno: 2025,
    provincia: '',
    materiale: '',
    numero_cave: 0
  });

  const chapters = [
    { id: 'cave-autorizzate', name: 'Cave Autorizzate', icon: Mountain, entity: 'annual_cave_data' },
    { id: 'cave-attive', name: 'Cave in Attività', icon: Activity, entity: 'active_caves_data' },
    { id: 'estrazioni', name: 'Estrazioni', icon: TrendingUp, entity: 'extraction_data' },
    { id: 'vendite', name: 'Vendite', icon: ShoppingCart, entity: 'sales_data' },
    { id: 'dati-economici', name: 'Dati Economici', icon: DollarSign, entity: 'economic_data' },
    { id: 'occupazione', name: 'Occupazione', icon: Users, entity: 'employment_data' },
    { id: 'prezzi', name: 'Prezzi', icon: Tag, entity: 'price_data' },
    { id: 'destinazioni', name: 'Destinazioni', icon: MapPin, entity: 'destination_data' },
    { id: 'concorrenti', name: 'Concorrenti', icon: Target, entity: 'competitor_data' }
  ];

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await client.auth.me();
      if (userData.data) {
        setUser(userData.data);
        await loadConfigurations();
      } else {
        navigate('/login');
      }
    } catch (error) {
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadConfigurations = async () => {
    try {
      const [provincesRes, materialsRes, priceMaterialsRes, destinationsRes] = await Promise.all([
        client.entities.config_provinces.query({}),
        client.entities.config_materials.query({}),
        client.entities.config_price_materials.query({}),
        client.entities.config_foreign_destinations.query({})
      ]);

      setProvinces(provincesRes.data?.items || []);
      setMaterials(materialsRes.data?.items || []);
      setPriceMaterials(priceMaterialsRes.data?.items || []);
      setForeignDestinations(destinationsRes.data?.items || []);
    } catch (error) {
      console.error('Error loading configurations:', error);
    }
  };

  // Configuration handlers
  const handleAddProvince = async () => {
    if (!newProvince.trim()) return;
    try {
      await client.entities.config_provinces.create({ data: { sigla: newProvince.toUpperCase() } });
      toast({ title: 'Provincia aggiunta con successo' });
      setNewProvince('');
      await loadConfigurations();
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteProvince = async (id: number) => {
    try {
      await client.entities.config_provinces.delete({ id: id.toString() });
      toast({ title: 'Provincia eliminata' });
      await loadConfigurations();
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddMaterial = async () => {
    if (!newMaterial.trim()) return;
    try {
      await client.entities.config_materials.create({ data: { nome: newMaterial } });
      toast({ title: 'Materiale aggiunto con successo' });
      setNewMaterial('');
      await loadConfigurations();
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteMaterial = async (id: number) => {
    try {
      await client.entities.config_materials.delete({ id: id.toString() });
      toast({ title: 'Materiale eliminato' });
      await loadConfigurations();
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddPriceMaterial = async () => {
    if (!newPriceMaterial.name.trim() || !newPriceMaterial.parent_id) return;
    try {
      await client.entities.config_price_materials.create({
        data: {
          nome: newPriceMaterial.name,
          materiale_generale_id: parseInt(newPriceMaterial.parent_id)
        }
      });
      toast({ title: 'Materiale prezzo aggiunto con successo' });
      setNewPriceMaterial({ name: '', parent_id: '' });
      await loadConfigurations();
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeletePriceMaterial = async (id: number) => {
    try {
      await client.entities.config_price_materials.delete({ id: id.toString() });
      toast({ title: 'Materiale prezzo eliminato' });
      await loadConfigurations();
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddDestination = async () => {
    if (!newDestination.trim()) return;
    try {
      await client.entities.config_foreign_destinations.create({ data: { paese: newDestination } });
      toast({ title: 'Destinazione estera aggiunta con successo' });
      setNewDestination('');
      await loadConfigurations();
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteDestination = async (id: number) => {
    try {
      await client.entities.config_foreign_destinations.delete({ id: id.toString() });
      toast({ title: 'Destinazione estera eliminata' });
      await loadConfigurations();
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    }
  };

  const handleResetData = async () => {
    if (!resetYear || !resetChapter) {
      toast({ title: 'Errore', description: 'Seleziona anno e capitolo', variant: 'destructive' });
      return;
    }

    try {
      await client.apiCall.invoke({
        url: '/api/v1/data-reset/reset',
        method: 'POST',
        data: { anno: resetYear, capitolo: resetChapter }
      });

      toast({ title: 'Successo', description: `Dati ${resetChapter} per anno ${resetYear} resettati` });
      setResetYear(2025);
      setResetChapter('');
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    }
  };

  // Chapter data handlers
  const handleAddActiveCaves = async () => {
    if (!activeCavesForm.provincia || !activeCavesForm.materiale) {
      toast({ title: 'Errore', description: 'Compila tutti i campi obbligatori', variant: 'destructive' });
      return;
    }
    try {
      await client.entities.active_caves_data.create({ data: activeCavesForm });
      toast({ title: 'Dato aggiunto con successo' });
      setActiveCavesForm({ anno: 2025, provincia: '', materiale: '', cave_attive: 0, percentuale_su_autorizzate: 0 });
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddExtraction = async () => {
    if (!extractionsForm.provincia || !extractionsForm.materiale) {
      toast({ title: 'Errore', description: 'Compila tutti i campi obbligatori', variant: 'destructive' });
      return;
    }
    try {
      await client.entities.extraction_data.create({ data: extractionsForm });
      toast({ title: 'Dato aggiunto con successo' });
      setExtractionsForm({ anno: 2025, provincia: '', materiale: '', volume_estratto_m3: 0 });
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddSales = async () => {
    if (!salesForm.provincia || !salesForm.materiale) {
      toast({ title: 'Errore', description: 'Compila tutti i campi obbligatori', variant: 'destructive' });
      return;
    }
    try {
      await client.entities.sales_data.create({ data: salesForm });
      toast({ title: 'Dato aggiunto con successo' });
      setSalesForm({ anno: 2025, provincia: '', materiale: '', volume_venduto_m3: 0, percentuale_su_estratto: 0 });
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddEconomic = async () => {
    if (!economicForm.provincia || !economicForm.materiale) {
      toast({ title: 'Errore', description: 'Compila tutti i campi obbligatori', variant: 'destructive' });
      return;
    }
    try {
      await client.entities.economic_data.create({ data: economicForm });
      toast({ title: 'Dato aggiunto con successo' });
      setEconomicForm({ anno: 2025, provincia: '', materiale: '', fatturato_euro: 0, costi_euro: 0, utile_lordo_euro: 0, utile_netto_euro: 0 });
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddEmployment = async () => {
    if (!employmentForm.provincia || !employmentForm.materiale) {
      toast({ title: 'Errore', description: 'Compila tutti i campi obbligatori', variant: 'destructive' });
      return;
    }
    try {
      await client.entities.employment_data.create({ data: employmentForm });
      toast({ title: 'Dato aggiunto con successo' });
      setEmploymentForm({ anno: 2025, provincia: '', materiale: '', numero_occupati: 0 });
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddPrice = async () => {
    if (!priceForm.materiale_prezzo_id) {
      toast({ title: 'Errore', description: 'Seleziona un materiale prezzo', variant: 'destructive' });
      return;
    }
    try {
      await client.entities.price_data.create({ 
        data: {
          ...priceForm,
          materiale_prezzo_id: parseInt(priceForm.materiale_prezzo_id)
        }
      });
      toast({ title: 'Dato aggiunto con successo' });
      setPriceForm({ anno: 2025, materiale_prezzo_id: '', prezzo_euro_m3: 0 });
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddDestinationData = async () => {
    if (!destinationForm.provincia || !destinationForm.materiale) {
      toast({ title: 'Errore', description: 'Compila tutti i campi obbligatori', variant: 'destructive' });
      return;
    }
    try {
      await client.entities.destination_data.create({ 
        data: {
          ...destinationForm,
          destinazione_estera_id: destinationForm.destinazione_estera_id ? parseInt(destinationForm.destinazione_estera_id) : null
        }
      });
      toast({ title: 'Dato aggiunto con successo' });
      setDestinationForm({ anno: 2025, provincia: '', materiale: '', locale_m3: 0, nazionale_m3: 0, estero_m3: 0, destinazione_estera_id: '' });
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddCompetitor = async () => {
    if (!competitorForm.provincia || !competitorForm.materiale) {
      toast({ title: 'Errore', description: 'Compila tutti i campi obbligatori', variant: 'destructive' });
      return;
    }
    try {
      await client.entities.competitor_data.create({ data: competitorForm });
      toast({ title: 'Dato aggiunto con successo' });
      setCompetitorForm({ anno: 2025, provincia: '', materiale: '', comunale: 0, provinciale: 0, regionale: 0, nazionale: 0, internazionale: 0 });
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddCaveAutorizzate = async () => {
    if (!caveAutorizzateForm.provincia || !caveAutorizzateForm.materiale) {
      toast({ title: 'Errore', description: 'Compila tutti i campi obbligatori', variant: 'destructive' });
      return;
    }
    try {
      await client.entities.province_material_data.create({ 
        data: {
          anno: caveAutorizzateForm.anno,
          provincia: caveAutorizzateForm.provincia,
          materiale: caveAutorizzateForm.materiale,
          numero_cave: caveAutorizzateForm.numero_cave
        }
      });
      toast({ title: 'Dato aggiunto con successo' });
      setCaveAutorizzateForm({ anno: 2025, provincia: '', materiale: '', numero_cave: 0 });
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    }
  };



  // Excel upload handlers
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>, entityName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      toast({ title: 'Upload in corso...', description: `Caricamento di ${jsonData.length} righe` });

      for (const row of jsonData) {
        await (client.entities as any)[entityName].create({ data: row });
      }

      toast({ title: 'Successo', description: `${jsonData.length} righe caricate` });
      e.target.value = '';
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    }
  };

  const handleLogout = async () => {
    await client.auth.logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Caricamento...</div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold text-gray-800">Pannello Amministrativo</h1>
            </div>
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeChapter} onValueChange={setActiveChapter}>
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="config">
              <Settings className="w-4 h-4 mr-2" />
              Configurazione
            </TabsTrigger>
            {chapters.slice(0, 4).map(chapter => {
              const Icon = chapter.icon;
              return (
                <TabsTrigger key={chapter.id} value={chapter.id}>
                  <Icon className="w-4 h-4 mr-2" />
                  {chapter.name}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsList className="grid w-full grid-cols-5 mb-8">
            {chapters.slice(4).map(chapter => {
              const Icon = chapter.icon;
              return (
                <TabsTrigger key={chapter.id} value={chapter.id}>
                  <Icon className="w-4 h-4 mr-2" />
                  {chapter.name}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Configuration Tab */}
          <TabsContent value="config">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Province</CardTitle>
                  <CardDescription>Gestisci le province della Puglia</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Sigla (es. BA)"
                      value={newProvince}
                      onChange={(e) => setNewProvince(e.target.value)}
                      maxLength={2}
                    />
                    <Button onClick={handleAddProvince} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {provinces.map((prov) => (
                      <div key={prov.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>{prov.sigla}</span>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteProvince(prov.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Materiali</CardTitle>
                  <CardDescription>Gestisci i materiali estrattivi</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nome materiale"
                      value={newMaterial}
                      onChange={(e) => setNewMaterial(e.target.value)}
                    />
                    <Button onClick={handleAddMaterial} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {materials.map((mat) => (
                      <div key={mat.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>{mat.nome}</span>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteMaterial(mat.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Materiali Prezzi</CardTitle>
                  <CardDescription>Classi specifiche collegate ai materiali generali</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      placeholder="Nome classe (es. Calcare 1a scelta)"
                      value={newPriceMaterial.name}
                      onChange={(e) => setNewPriceMaterial({ ...newPriceMaterial, name: e.target.value })}
                    />
                    <Select
                      value={newPriceMaterial.parent_id}
                      onValueChange={(value) => setNewPriceMaterial({ ...newPriceMaterial, parent_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona materiale generale" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((mat) => (
                          <SelectItem key={mat.id} value={mat.id.toString()}>
                            {mat.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddPriceMaterial} className="w-full bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Aggiungi
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {priceMaterials.map((pm) => {
                      const parent = materials.find(m => m.id === pm.materiale_generale_id);
                      return (
                        <div key={pm.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <div className="font-medium">{pm.nome}</div>
                            <div className="text-sm text-gray-500">→ {parent?.nome}</div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleDeletePriceMaterial(pm.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Destinazioni Estere</CardTitle>
                  <CardDescription>Gestisci i paesi di destinazione</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nome paese"
                      value={newDestination}
                      onChange={(e) => setNewDestination(e.target.value)}
                    />
                    <Button onClick={handleAddDestination} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {foreignDestinations.map((dest) => (
                      <div key={dest.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>{dest.paese}</span>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteDestination(dest.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Reset Dati</CardTitle>
                  <CardDescription>Elimina tutti i dati di un capitolo per un anno specifico</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Anno</Label>
                      <Input
                        type="number"
                        value={resetYear}
                        onChange={(e) => setResetYear(parseInt(e.target.value))}
                        min={2000}
                        max={2100}
                      />
                    </div>
                    <div>
                      <Label>Capitolo</Label>
                      <Select value={resetChapter} onValueChange={setResetChapter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona capitolo" />
                        </SelectTrigger>
                        <SelectContent>
                          {chapters.map((ch) => (
                            <SelectItem key={ch.id} value={ch.entity}>
                              {ch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleResetData} variant="destructive" className="w-full">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Reset Dati
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          {/* Cave Autorizzate Tab */}
          <TabsContent value="cave-autorizzate">
            <Card>
              <CardHeader>
                <CardTitle>Cave Autorizzate - Inserimento Dati</CardTitle>
                <CardDescription>
                  Inserisci i dati delle cave autorizzate. Puoi inserire dati aggregati per anno o caricare file Excel con dati comunali dettagliati.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">📋 Come Inserire i Dati</h3>
                  <div className="text-sm text-blue-800 space-y-2">
                    <p><strong>Opzione 1 - Inserimento Manuale:</strong> Usa il form sottostante per inserire dati aggregati per provincia e materiale</p>
                    <p><strong>Opzione 2 - Upload Excel:</strong> Carica un file Excel con dati dettagliati per comune. Il file deve contenere le colonne: anno, provincia, materiale, comune, cave_autorizzate</p>
                    <p className="text-xs mt-2">💡 <strong>Nota:</strong> I dati inseriti qui saranno visualizzati nella pagina "Cave Autorizzate" del menu principale</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label>Anno</Label>
                    <Input
                      type="number"
                      value={caveAutorizzateForm.anno}
                      onChange={(e) => setCaveAutorizzateForm({ ...caveAutorizzateForm, anno: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Provincia *</Label>
                    <Select value={caveAutorizzateForm.provincia} onValueChange={(v) => setCaveAutorizzateForm({ ...caveAutorizzateForm, provincia: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((p) => (
                          <SelectItem key={p.id} value={p.sigla}>{p.sigla}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Materiale *</Label>
                    <Select value={caveAutorizzateForm.materiale} onValueChange={(v) => setCaveAutorizzateForm({ ...caveAutorizzateForm, materiale: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((m) => (
                          <SelectItem key={m.id} value={m.nome}>{m.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Cave Autorizzate</Label>
                    <Input
                      type="number"
                      value={caveAutorizzateForm.numero_cave}
                      onChange={(e) => setCaveAutorizzateForm({ ...caveAutorizzateForm, numero_cave: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={handleAddCaveAutorizzate} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Aggiungi Dato
                  </Button>
                  <div className="flex-1">
                    <Label htmlFor="excel-cave-autorizzate" className="cursor-pointer">
                      <div className="flex items-center justify-center gap-2 h-10 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        <Upload className="w-4 h-4" />
                        Carica Excel
                      </div>
                    </Label>
                    <Input
                      id="excel-cave-autorizzate"
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => handleExcelUpload(e, 'annual_cave_data')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cave Attive Tab */}
          <TabsContent value="cave-attive">
            <Card>
              <CardHeader>
                <CardTitle>Cave in Attività - Inserimento Dati</CardTitle>
                <CardDescription>Inserisci i dati delle cave in attività per provincia e materiale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label>Anno</Label>
                    <Input
                      type="number"
                      value={activeCavesForm.anno}
                      onChange={(e) => setActiveCavesForm({ ...activeCavesForm, anno: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Provincia *</Label>
                    <Select value={activeCavesForm.provincia} onValueChange={(v) => setActiveCavesForm({ ...activeCavesForm, provincia: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((p) => (
                          <SelectItem key={p.id} value={p.sigla}>{p.sigla}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Materiale *</Label>
                    <Select value={activeCavesForm.materiale} onValueChange={(v) => setActiveCavesForm({ ...activeCavesForm, materiale: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((m) => (
                          <SelectItem key={m.id} value={m.nome}>{m.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cave Attive</Label>
                    <Input
                      type="number"
                      value={activeCavesForm.cave_attive}
                      onChange={(e) => setActiveCavesForm({ ...activeCavesForm, cave_attive: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>% su Autorizzate</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={activeCavesForm.percentuale_su_autorizzate}
                      onChange={(e) => setActiveCavesForm({ ...activeCavesForm, percentuale_su_autorizzate: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button onClick={handleAddActiveCaves} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Aggiungi Dato
                  </Button>
                  <div className="flex-1">
                    <Label htmlFor="excel-active-caves" className="cursor-pointer">
                      <div className="flex items-center justify-center gap-2 h-10 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        <Upload className="w-4 h-4" />
                        Carica Excel
                      </div>
                    </Label>
                    <Input
                      id="excel-active-caves"
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => handleExcelUpload(e, 'active_caves_data')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Estrazioni Tab */}
          <TabsContent value="estrazioni">
            <Card>
              <CardHeader>
                <CardTitle>Estrazioni - Inserimento Dati</CardTitle>
                <CardDescription>Inserisci i volumi estratti per provincia e materiale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label>Anno</Label>
                    <Input
                      type="number"
                      value={extractionsForm.anno}
                      onChange={(e) => setExtractionsForm({ ...extractionsForm, anno: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Provincia *</Label>
                    <Select value={extractionsForm.provincia} onValueChange={(v) => setExtractionsForm({ ...extractionsForm, provincia: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((p) => (
                          <SelectItem key={p.id} value={p.sigla}>{p.sigla}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Materiale *</Label>
                    <Select value={extractionsForm.materiale} onValueChange={(v) => setExtractionsForm({ ...extractionsForm, materiale: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((m) => (
                          <SelectItem key={m.id} value={m.nome}>{m.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Volume Estratto (m³)</Label>
                    <Input
                      type="number"
                      value={extractionsForm.volume_estratto_m3}
                      onChange={(e) => setExtractionsForm({ ...extractionsForm, volume_estratto_m3: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button onClick={handleAddExtraction} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Aggiungi Dato
                  </Button>
                  <div className="flex-1">
                    <Label htmlFor="excel-extractions" className="cursor-pointer">
                      <div className="flex items-center justify-center gap-2 h-10 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        <Upload className="w-4 h-4" />
                        Carica Excel
                      </div>
                    </Label>
                    <Input
                      id="excel-extractions"
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => handleExcelUpload(e, 'extraction_data')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vendite Tab */}
          <TabsContent value="vendite">
            <Card>
              <CardHeader>
                <CardTitle>Vendite - Inserimento Dati</CardTitle>
                <CardDescription>Inserisci i volumi venduti per provincia e materiale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label>Anno</Label>
                    <Input
                      type="number"
                      value={salesForm.anno}
                      onChange={(e) => setSalesForm({ ...salesForm, anno: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Provincia *</Label>
                    <Select value={salesForm.provincia} onValueChange={(v) => setSalesForm({ ...salesForm, provincia: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((p) => (
                          <SelectItem key={p.id} value={p.sigla}>{p.sigla}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Materiale *</Label>
                    <Select value={salesForm.materiale} onValueChange={(v) => setSalesForm({ ...salesForm, materiale: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((m) => (
                          <SelectItem key={m.id} value={m.nome}>{m.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Volume Venduto (m³)</Label>
                    <Input
                      type="number"
                      value={salesForm.volume_venduto_m3}
                      onChange={(e) => setSalesForm({ ...salesForm, volume_venduto_m3: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>% su Estratto</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={salesForm.percentuale_su_estratto}
                      onChange={(e) => setSalesForm({ ...salesForm, percentuale_su_estratto: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button onClick={handleAddSales} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Aggiungi Dato
                  </Button>
                  <div className="flex-1">
                    <Label htmlFor="excel-sales" className="cursor-pointer">
                      <div className="flex items-center justify-center gap-2 h-10 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        <Upload className="w-4 h-4" />
                        Carica Excel
                      </div>
                    </Label>
                    <Input
                      id="excel-sales"
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => handleExcelUpload(e, 'sales_data')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dati Economici Tab */}
          <TabsContent value="dati-economici">
            <Card>
              <CardHeader>
                <CardTitle>Dati Economici - Inserimento Dati</CardTitle>
                <CardDescription>Inserisci fatturato, costi e utili per provincia e materiale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label>Anno</Label>
                    <Input
                      type="number"
                      value={economicForm.anno}
                      onChange={(e) => setEconomicForm({ ...economicForm, anno: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Provincia *</Label>
                    <Select value={economicForm.provincia} onValueChange={(v) => setEconomicForm({ ...economicForm, provincia: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((p) => (
                          <SelectItem key={p.id} value={p.sigla}>{p.sigla}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Materiale *</Label>
                    <Select value={economicForm.materiale} onValueChange={(v) => setEconomicForm({ ...economicForm, materiale: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((m) => (
                          <SelectItem key={m.id} value={m.nome}>{m.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Fatturato (€)</Label>
                    <Input
                      type="number"
                      value={economicForm.fatturato_euro}
                      onChange={(e) => setEconomicForm({ ...economicForm, fatturato_euro: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Costi (€)</Label>
                    <Input
                      type="number"
                      value={economicForm.costi_euro}
                      onChange={(e) => setEconomicForm({ ...economicForm, costi_euro: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Utile Lordo (€)</Label>
                    <Input
                      type="number"
                      value={economicForm.utile_lordo_euro}
                      onChange={(e) => setEconomicForm({ ...economicForm, utile_lordo_euro: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Utile Netto (€)</Label>
                    <Input
                      type="number"
                      value={economicForm.utile_netto_euro}
                      onChange={(e) => setEconomicForm({ ...economicForm, utile_netto_euro: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button onClick={handleAddEconomic} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Aggiungi Dato
                  </Button>
                  <div className="flex-1">
                    <Label htmlFor="excel-economic" className="cursor-pointer">
                      <div className="flex items-center justify-center gap-2 h-10 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        <Upload className="w-4 h-4" />
                        Carica Excel
                      </div>
                    </Label>
                    <Input
                      id="excel-economic"
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => handleExcelUpload(e, 'economic_data')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Occupazione Tab */}
          <TabsContent value="occupazione">
            <Card>
              <CardHeader>
                <CardTitle>Occupazione - Inserimento Dati</CardTitle>
                <CardDescription>Inserisci il numero di occupati per provincia e materiale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label>Anno</Label>
                    <Input
                      type="number"
                      value={employmentForm.anno}
                      onChange={(e) => setEmploymentForm({ ...employmentForm, anno: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Provincia *</Label>
                    <Select value={employmentForm.provincia} onValueChange={(v) => setEmploymentForm({ ...employmentForm, provincia: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((p) => (
                          <SelectItem key={p.id} value={p.sigla}>{p.sigla}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Materiale *</Label>
                    <Select value={employmentForm.materiale} onValueChange={(v) => setEmploymentForm({ ...employmentForm, materiale: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((m) => (
                          <SelectItem key={m.id} value={m.nome}>{m.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Numero Occupati</Label>
                    <Input
                      type="number"
                      value={employmentForm.numero_occupati}
                      onChange={(e) => setEmploymentForm({ ...employmentForm, numero_occupati: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button onClick={handleAddEmployment} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Aggiungi Dato
                  </Button>
                  <div className="flex-1">
                    <Label htmlFor="excel-employment" className="cursor-pointer">
                      <div className="flex items-center justify-center gap-2 h-10 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        <Upload className="w-4 h-4" />
                        Carica Excel
                      </div>
                    </Label>
                    <Input
                      id="excel-employment"
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => handleExcelUpload(e, 'employment_data')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prezzi Tab */}
          <TabsContent value="prezzi">
            <Card>
              <CardHeader>
                <CardTitle>Prezzi - Inserimento Dati</CardTitle>
                <CardDescription>Inserisci i prezzi per classe di materiale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Anno</Label>
                    <Input
                      type="number"
                      value={priceForm.anno}
                      onChange={(e) => setPriceForm({ ...priceForm, anno: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Classe Materiale *</Label>
                    <Select value={priceForm.materiale_prezzo_id} onValueChange={(v) => setPriceForm({ ...priceForm, materiale_prezzo_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        {priceMaterials.map((pm) => (
                          <SelectItem key={pm.id} value={pm.id.toString()}>
                            {pm.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prezzo (€/m³)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={priceForm.prezzo_euro_m3}
                      onChange={(e) => setPriceForm({ ...priceForm, prezzo_euro_m3: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button onClick={handleAddPrice} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Aggiungi Dato
                  </Button>
                  <div className="flex-1">
                    <Label htmlFor="excel-price" className="cursor-pointer">
                      <div className="flex items-center justify-center gap-2 h-10 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        <Upload className="w-4 h-4" />
                        Carica Excel
                      </div>
                    </Label>
                    <Input
                      id="excel-price"
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => handleExcelUpload(e, 'price_data')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Destinazioni Tab */}
          <TabsContent value="destinazioni">
            <Card>
              <CardHeader>
                <CardTitle>Destinazioni - Inserimento Dati</CardTitle>
                <CardDescription>Inserisci le destinazioni geografiche dei materiali estratti</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label>Anno</Label>
                    <Input
                      type="number"
                      value={destinationForm.anno}
                      onChange={(e) => setDestinationForm({ ...destinationForm, anno: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Provincia *</Label>
                    <Select value={destinationForm.provincia} onValueChange={(v) => setDestinationForm({ ...destinationForm, provincia: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((p) => (
                          <SelectItem key={p.id} value={p.sigla}>{p.sigla}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Materiale *</Label>
                    <Select value={destinationForm.materiale} onValueChange={(v) => setDestinationForm({ ...destinationForm, materiale: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((m) => (
                          <SelectItem key={m.id} value={m.nome}>{m.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Locale (m³)</Label>
                    <Input
                      type="number"
                      value={destinationForm.locale_m3}
                      onChange={(e) => setDestinationForm({ ...destinationForm, locale_m3: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Nazionale (m³)</Label>
                    <Input
                      type="number"
                      value={destinationForm.nazionale_m3}
                      onChange={(e) => setDestinationForm({ ...destinationForm, nazionale_m3: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Estero (m³)</Label>
                    <Input
                      type="number"
                      value={destinationForm.estero_m3}
                      onChange={(e) => setDestinationForm({ ...destinationForm, estero_m3: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Paese Estero (opzionale)</Label>
                    <Select value={destinationForm.destinazione_estera_id} onValueChange={(v) => setDestinationForm({ ...destinationForm, destinazione_estera_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        {foreignDestinations.map((d) => (
                          <SelectItem key={d.id} value={d.id.toString()}>
                            {d.paese}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button onClick={handleAddDestinationData} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Aggiungi Dato
                  </Button>
                  <div className="flex-1">
                    <Label htmlFor="excel-destination" className="cursor-pointer">
                      <div className="flex items-center justify-center gap-2 h-10 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        <Upload className="w-4 h-4" />
                        Carica Excel
                      </div>
                    </Label>
                    <Input
                      id="excel-destination"
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => handleExcelUpload(e, 'destination_data')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Concorrenti Tab */}
          <TabsContent value="concorrenti">
            <Card>
              <CardHeader>
                <CardTitle>Concorrenti - Inserimento Dati</CardTitle>
                <CardDescription>Inserisci i dati sulla concorrenza per tipologia</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label>Anno</Label>
                    <Input
                      type="number"
                      value={competitorForm.anno}
                      onChange={(e) => setCompetitorForm({ ...competitorForm, anno: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Provincia *</Label>
                    <Select value={competitorForm.provincia} onValueChange={(v) => setCompetitorForm({ ...competitorForm, provincia: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((p) => (
                          <SelectItem key={p.id} value={p.sigla}>{p.sigla}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Materiale *</Label>
                    <Select value={competitorForm.materiale} onValueChange={(v) => setCompetitorForm({ ...competitorForm, materiale: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((m) => (
                          <SelectItem key={m.id} value={m.nome}>{m.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Comunale</Label>
                    <Input
                      type="number"
                      value={competitorForm.comunale}
                      onChange={(e) => setCompetitorForm({ ...competitorForm, comunale: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Provinciale</Label>
                    <Input
                      type="number"
                      value={competitorForm.provinciale}
                      onChange={(e) => setCompetitorForm({ ...competitorForm, provinciale: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Regionale</Label>
                    <Input
                      type="number"
                      value={competitorForm.regionale}
                      onChange={(e) => setCompetitorForm({ ...competitorForm, regionale: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Nazionale</Label>
                    <Input
                      type="number"
                      value={competitorForm.nazionale}
                      onChange={(e) => setCompetitorForm({ ...competitorForm, nazionale: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Internazionale</Label>
                    <Input
                      type="number"
                      value={competitorForm.internazionale}
                      onChange={(e) => setCompetitorForm({ ...competitorForm, internazionale: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button onClick={handleAddCompetitor} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Aggiungi Dato
                  </Button>
                  <div className="flex-1">
                    <Label htmlFor="excel-competitor" className="cursor-pointer">
                      <div className="flex items-center justify-center gap-2 h-10 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        <Upload className="w-4 h-4" />
                        Carica Excel
                      </div>
                    </Label>
                    <Input
                      id="excel-competitor"
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => handleExcelUpload(e, 'competitor_data')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
