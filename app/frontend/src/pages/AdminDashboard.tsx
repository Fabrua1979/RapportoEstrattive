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
import { ArrowLeft, Upload, Trash2, Plus, Settings, Mountain, Activity, TrendingUp, ShoppingCart, DollarSign, Users, Tag, MapPin, Target, BarChart3 } from 'lucide-react';
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

  // Form states
  const [newProvince, setNewProvince] = useState('');
  const [newMaterial, setNewMaterial] = useState('');
  const [newPriceMaterial, setNewPriceMaterial] = useState({ name: '', parent_id: '' });
  const [newDestination, setNewDestination] = useState('');

  // Reset states
  const [resetYear, setResetYear] = useState<number>(2025);
  const [resetChapter, setResetChapter] = useState<string>('');

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
      const response = await client.apiCall.invoke({
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
          <TabsList className="grid w-full grid-cols-5 mb-8">
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
              {/* Province */}
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
                    <Button onClick={handleAddProvince}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
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

              {/* Materials */}
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
                    <Button onClick={handleAddMaterial}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
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

              {/* Price Materials */}
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
                    <Button onClick={handleAddPriceMaterial} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Aggiungi
                    </Button>
                  </div>
                  <div className="space-y-2">
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

              {/* Foreign Destinations */}
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
                    <Button onClick={handleAddDestination}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
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

              {/* Reset Data */}
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

          {/* Chapter Tabs - To be implemented with forms similar to Cave Autorizzate */}
          {chapters.map(chapter => (
            <TabsContent key={chapter.id} value={chapter.id}>
              <Card>
                <CardHeader>
                  <CardTitle>{chapter.name}</CardTitle>
                  <CardDescription>
                    Form di inserimento dati per {chapter.name} - In sviluppo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Questa sezione conterrà i form per l'inserimento manuale e upload Excel per {chapter.name}.
                    Implementazione in corso...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}