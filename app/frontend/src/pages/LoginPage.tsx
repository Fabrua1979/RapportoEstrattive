import { useEffect } from 'react';
import { createClient } from '@metagptx/web-sdk';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const client = createClient();

export default function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await client.auth.me();
      if (user.data) {
        navigate('/admin');
      }
    } catch (error) {
      // User not authenticated, stay on login page
    }
  };

  const handleLogin = async () => {
    await client.auth.toLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <Home className="w-4 h-4 mr-2" />
            Torna alla Home
          </Button>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Area Amministrativa</CardTitle>
            <CardDescription className="text-base">
              Accedi per gestire i dati delle attività estrattive
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg"
              onClick={handleLogin}
            >
              Accedi con Atoms
            </Button>
            <p className="text-sm text-gray-500 text-center mt-4">
              Effettua il login per accedere al pannello di amministrazione
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}