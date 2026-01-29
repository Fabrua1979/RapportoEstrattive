import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Database, Search, Trash2, Table as TableIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const client = createClient();

export default function DatabaseAdmin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableSchema, setTableSchema] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [customQuery, setCustomQuery] = useState('');
  const [queryResult, setQueryResult] = useState<any[]>([]);

  useEffect(() => {
    checkAuthAndLoadTables();
  }, []);

  const checkAuthAndLoadTables = async () => {
    try {
      const userData = await client.auth.me();
      if (!userData.data) {
        navigate('/login');
        return;
      }
      await loadTables();
    } catch (error) {
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadTables = async () => {
    try {
      const response = await client.apiCall.invoke({
        url: '/api/v1/db-admin/tables',
        method: 'GET'
      });
      setTables(response.data.tables || []);
    } catch (error: any) {
      toast({ 
        title: 'Errore', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };

  const loadTableSchema = async (tableName: string) => {
    try {
      const response = await client.apiCall.invoke({
        url: `/api/v1/db-admin/table/${tableName}/schema`,
        method: 'GET'
      });
      setTableSchema(response.data.columns || []);
    } catch (error: any) {
      toast({ 
        title: 'Errore', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };

  const loadTableData = async (tableName: string, limit = 100, offset = 0) => {
    try {
      const response = await client.apiCall.invoke({
        url: `/api/v1/db-admin/table/${tableName}/data`,
        method: 'GET',
        data: { limit, offset }
      });
      setTableData(response.data.data || []);
      setTotalRows(response.data.total || 0);
    } catch (error: any) {
      toast({ 
        title: 'Errore', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };

  const handleTableSelect = async (tableName: string) => {
    setSelectedTable(tableName);
    await loadTableSchema(tableName);
    await loadTableData(tableName);
  };

  const executeCustomQuery = async () => {
    if (!customQuery.trim()) {
      toast({ 
        title: 'Errore', 
        description: 'Inserisci una query SQL', 
        variant: 'destructive' 
      });
      return;
    }

    try {
      const response = await client.apiCall.invoke({
        url: '/api/v1/db-admin/query',
        method: 'POST',
        data: { sql: customQuery }
      });
      setQueryResult(response.data.data || []);
      toast({ 
        title: 'Successo', 
        description: `Query eseguita: ${response.data.rows} righe restituite` 
      });
    } catch (error: any) {
      toast({ 
        title: 'Errore', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };

  const truncateTable = async () => {
    if (!selectedTable) return;

    if (!confirm(`Sei sicuro di voler eliminare TUTTI i dati dalla tabella ${selectedTable}? Questa azione è irreversibile!`)) {
      return;
    }

    try {
      await client.apiCall.invoke({
        url: `/api/v1/db-admin/table/${selectedTable}/truncate`,
        method: 'DELETE'
      });
      toast({ title: 'Successo', description: `Tabella ${selectedTable} svuotata` });
      await loadTableData(selectedTable);
    } catch (error: any) {
      toast({ 
        title: 'Errore', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
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
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Admin
            </Button>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Database className="w-8 h-8" />
              Amministrazione Database
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Table Browser */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TableIcon className="w-5 h-5" />
              Esplora Tabelle
            </CardTitle>
            <CardDescription>Visualizza lo schema e i dati delle tabelle del database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Seleziona Tabella</Label>
                <Select value={selectedTable} onValueChange={handleTableSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Scegli una tabella" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map((table) => (
                      <SelectItem key={table} value={table}>
                        {table}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedTable && (
                <div className="flex items-end">
                  <Button onClick={truncateTable} variant="destructive" className="w-full">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Svuota Tabella
                  </Button>
                </div>
              )}
            </div>

            {tableSchema.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Schema Tabella</h3>
                <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Colonna</th>
                        <th className="text-left p-2">Tipo</th>
                        <th className="text-left p-2">Nullable</th>
                        <th className="text-left p-2">Default</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableSchema.map((col, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2 font-mono">{col.name}</td>
                          <td className="p-2">{col.type}</td>
                          <td className="p-2">{col.nullable ? 'Sì' : 'No'}</td>
                          <td className="p-2 font-mono text-xs">{col.default || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tableData.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Dati Tabella ({totalRows} righe totali)</h3>
                <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto max-h-96">
                  <pre className="text-xs">{JSON.stringify(tableData, null, 2)}</pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Custom Query */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Query Personalizzata
            </CardTitle>
            <CardDescription>Esegui query SELECT personalizzate (solo lettura)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Query SQL</Label>
              <Textarea
                placeholder="SELECT * FROM table_name WHERE ..."
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                rows={4}
                className="font-mono text-sm"
              />
            </div>
            <Button onClick={executeCustomQuery} className="w-full">
              <Search className="w-4 h-4 mr-2" />
              Esegui Query
            </Button>

            {queryResult.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Risultati Query ({queryResult.length} righe)</h3>
                <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto max-h-96">
                  <pre className="text-xs">{JSON.stringify(queryResult, null, 2)}</pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}