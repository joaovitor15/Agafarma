import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Store } from 'lucide-react';

export function Auth({ onSession }: { onSession: (session: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('agafarma_saved_email');
    const savedPassword = localStorage.getItem('agafarma_saved_password');
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (rememberMe) {
          localStorage.setItem('agafarma_saved_email', email);
          localStorage.setItem('agafarma_saved_password', password);
        } else {
          localStorage.removeItem('agafarma_saved_email');
          localStorage.removeItem('agafarma_saved_password');
        }
        onSession(data.session);
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          onSession(data.session);
        } else {
          setError('Verifique seu email para confirmar o cadastro!');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro durante a autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col py-12 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="m-auto w-full">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center flex-row items-center space-x-3">
          <div className="p-2 rounded-lg">
            <svg viewBox="0 0 100 100" className="w-12 h-12 drop-shadow-sm" xmlns="http://www.w3.org/2000/svg">
              {/* Arco Branco com Seta */}
              <path 
                d="M 18.8 68 A 36 36 0 0 1 68 18.8" 
                fill="none" 
                stroke="#0066b3" 
                className="dark:stroke-blue-400"
                strokeWidth="8" 
                strokeLinecap="round" 
              />
              <polygon 
                points="78.4,24.8 59.6,25.5 69.6,8.1" 
                fill="#0066b3" 
                className="dark:fill-blue-400 dark:stroke-blue-400"
                stroke="#0066b3" 
                strokeWidth="2" 
                strokeLinejoin="round" 
              />
              
              {/* Arco Laranja com Seta */}
              <path 
                d="M 81.2 32 A 36 36 0 0 1 32 81.2" 
                fill="none" 
                stroke="#ff8c00" 
                strokeWidth="8" 
                strokeLinecap="round" 
              />
              <polygon 
                points="21.6,75.2 40.4,74.5 30.4,91.9" 
                fill="#ff8c00" 
                stroke="#ff8c00" 
                strokeWidth="2" 
                strokeLinejoin="round" 
              />
              
              {/* Coração Central Amarelo (Menor) */}
              <g transform="translate(50, 48.5) scale(0.75) translate(-50, -48.5)">
                <path
                  d="M50 72.5 L46.5 69 C32 54.5 26 48.5 26 39.5 C26 31 32.5 24.5 41 24.5 C45 24.5 48.5 26.5 50 30 C51.5 26.5 55 24.5 59 24.5 C67.5 24.5 74 31 74 39.5 C74 48.5 68 54.5 53.5 69 L50 72.5 Z"
                  fill="#fecb00"
                />
              </g>
            </svg>
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Agafarma Tuparendi</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
          {isLogin ? 'Faça login na sua conta' : 'Crie sua conta'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100 dark:border-gray-700">
          <form className="space-y-6" onSubmit={handleAuth}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-[#0066b3] focus:border-[#0066b3] sm:text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-[#0066b3] focus:border-[#0066b3] sm:text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#0066b3] focus:ring-[#0066b3] border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Lembre-me
                </label>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0066b3] hover:bg-[#005291] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0066b3] disabled:opacity-50"
              >
                {loading ? 'Processando...' : isLogin ? 'Entrar' : 'Cadastrar'}
              </button>
            </div>
            
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-[#0066b3] dark:text-blue-400 hover:underline"
              >
                {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}
