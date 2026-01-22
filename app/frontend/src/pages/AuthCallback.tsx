import { useEffect, useState } from 'react';
import { createClient } from '@metagptx/web-sdk';
import { Loader2 } from 'lucide-react';

const client = createClient();

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      await client.auth.login().then(() => {
        window.location.href = '/admin';
      });
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'autenticazione');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">{error}</p>
          <a href="/login" className="text-blue-600 hover:underline">
            Torna al login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-xl text-gray-600">Autenticazione in corso...</p>
      </div>
    </div>
  );
}