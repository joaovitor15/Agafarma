import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Users, ChevronDown, Shield, UserPlus, AlertTriangle, X } from 'lucide-react';

export function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [isUsersExpanded, setIsUsersExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isUsersExpanded && !isEditing) {
      fetchUsers();
    }
  }, [isUsersExpanded, isEditing]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('permissoes_usuarios')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    
    // Check if user already exists
    if (users.find(u => u.email === newEmail)) {
      setAlertMessage('Usuário já existe na lista.');
      return;
    }

    const { data, error } = await supabase
      .from('permissoes_usuarios')
      .insert([{ email: newEmail }])
      .select()
      .single();

    if (!error && data) {
      setUsers([data, ...users]);
      setNewEmail('');
      setIsEditing(false);
    } else {
      console.error("Error adding user", error);
      setAlertMessage('Erro ao adicionar usuário. Certifique-se de ser administrador.');
    }
  };

  const togglePermission = async (id: string, field: string, currentValue: boolean, user_is_admin: boolean = false) => {
    if (field !== 'is_admin' && user_is_admin) {
      setAlertMessage('Atenção: Administradores têm acesso total. Não é possível remover o acesso a módulos específicos enquanto o usuário for administrador.');
      return;
    }

    if (field === 'is_admin' && currentValue === true) {
      const adminCount = users.filter(u => u.is_admin).length;
      if (adminCount <= 1) {
        setAlertMessage('Atenção: O sistema precisa de pelo menos um administrador. Você não pode remover este privilégio.');
        return;
      }
    }

    const { data, error } = await supabase
      .from('permissoes_usuarios')
      .update({ [field]: !currentValue })
      .eq('id', id)
      .select()
      .single();
      
    if (!error && data) {
      setUsers(users.map(u => u.id === id ? data : u));
    }
  };

  return (
    <>
      {alertMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start mb-4">
              <div className="p-2 bg-yellow-100 rounded-full text-yellow-600 mr-4 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1 mt-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-tight">Aviso do Sistema</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {alertMessage}
                </p>
              </div>
              <button 
                onClick={() => setAlertMessage(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 dark:text-gray-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setAlertMessage(null)}
                className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden mt-6">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#0066b3]"></div>
      
      {isEditing ? (
        <form onSubmit={handleAddUser} className="animate-in fade-in pt-2">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">
            <UserPlus className="w-5 h-5 text-[#0066b3] dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Cadastrar Novo Usuário</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email do Usuário</label>
              <input 
                type="email" 
                id="newEmail"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-shadow"
                placeholder="Ex: joao@exemplo.com"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-100 dark:border-gray-700">
            <button 
              type="button"
              onClick={() => {
                setIsEditing(false);
                setNewEmail('');
              }}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 bg-[#0066b3] text-white font-medium rounded-lg hover:bg-[#005291] transition-colors"
            >
              Salvar Cadastro
            </button>
          </div>
        </form>
      ) : (
        <>
          <div 
            className={`flex justify-between items-center cursor-pointer group ${isUsersExpanded ? 'border-b border-gray-100 dark:border-gray-700 pb-4 mb-6' : ''}`}
            onClick={() => setIsUsersExpanded(!isUsersExpanded)}
          >
            <div className="flex items-center gap-2">
              <Users className={`w-5 h-5 transition-colors ${isUsersExpanded ? 'text-[#0066b3] dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:hover:text-gray-300 dark:text-gray-400'}`} />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Gerenciar Usuários</h3>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                  setIsUsersExpanded(true);
                }}
                className="flex items-center space-x-2 p-2 sm:px-4 sm:py-2 bg-blue-50 dark:bg-blue-900/40 text-[#0066b3] dark:text-blue-400 font-medium rounded-full sm:rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
              >
                <UserPlus className="w-5 h-5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Adicionar Usuário</span>
              </button>
              <div className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isUsersExpanded ? 'bg-gray-100 dark:bg-gray-700' : ''}`}>
                <ChevronDown className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isUsersExpanded ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </div>

          {isUsersExpanded && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <div className="space-y-4">
                {loading ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700 rounded-lg">
                    Carregando usuários...
                  </div>
                ) : users.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700 rounded-lg">
                    Nenhum usuário cadastrado.
                  </div>
                ) : (
                  users.map(user => (
                    <div key={user.id} className="bg-[#f8fafc] dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                      <div className="p-5 border-b border-gray-100/50">
                        <div className="flex items-center justify-between mb-1">
                           <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-lg flex items-center gap-2">
                             {user.email}
                             {user.is_admin && (
                               <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                 <Shield className="w-3 h-3 mr-1" /> Admin
                               </span>
                             )}
                           </h4>
                        </div>
                      </div>
                      
                      <div className="p-5 bg-white dark:bg-gray-800">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                           <label className="flex items-center gap-3 cursor-pointer group">
                             <div className="relative inline-flex items-center">
                               <input 
                                 type="checkbox" 
                                 className="sr-only peer" 
                                 checked={user.is_admin || user.pode_acessar_premio}
                                 onChange={() => togglePermission(user.id, 'pode_acessar_premio', user.pode_acessar_premio, user.is_admin)}
                               />
                               <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0066b3]"></div>
                             </div>
                             <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100 transition-colors">Prêmio Meta</span>
                           </label>
                           
                           <label className="flex items-center gap-3 cursor-pointer group">
                             <div className="relative inline-flex items-center">
                               <input 
                                 type="checkbox" 
                                 className="sr-only peer" 
                                 checked={user.is_admin || user.pode_acessar_sicredi}
                                 onChange={() => togglePermission(user.id, 'pode_acessar_sicredi', user.pode_acessar_sicredi, user.is_admin)}
                               />
                               <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0066b3]"></div>
                             </div>
                             <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100 transition-colors">Recibos Sicredi</span>
                           </label>
                           
                           <label className="flex items-center gap-3 cursor-pointer group">
                             <div className="relative inline-flex items-center">
                               <input 
                                 type="checkbox" 
                                 className="sr-only peer" 
                                 checked={user.is_admin || user.pode_acessar_config}
                                 onChange={() => togglePermission(user.id, 'pode_acessar_config', user.pode_acessar_config, user.is_admin)}
                               />
                               <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0066b3]"></div>
                             </div>
                             <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100 transition-colors">Configurações</span>
                           </label>

                           <label className="flex items-center gap-3 cursor-pointer group">
                             <div className="relative inline-flex items-center">
                               <input 
                                 type="checkbox" 
                                 className="sr-only peer" 
                                 checked={user.is_admin || user.pode_acessar_manuais}
                                 onChange={() => togglePermission(user.id, 'pode_acessar_manuais', user.pode_acessar_manuais, user.is_admin)}
                               />
                               <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0066b3]"></div>
                             </div>
                             <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100 transition-colors">Central de Manuais</span>
                           </label>

                           <label className="flex items-center gap-3 cursor-pointer group">
                             <div className="relative inline-flex items-center">
                               <input 
                                 type="checkbox" 
                                 className="sr-only peer" 
                                 checked={user.is_admin || user.pode_acessar_orcamentos}
                                 onChange={() => togglePermission(user.id, 'pode_acessar_orcamentos', user.pode_acessar_orcamentos, user.is_admin)}
                               />
                               <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0066b3]"></div>
                             </div>
                             <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100 transition-colors">Orçamentos Judiciais</span>
                           </label>
                           
                           <label className="flex items-center gap-3 cursor-pointer group">
                             <div className="relative inline-flex items-center">
                               <input 
                                 type="checkbox" 
                                 className="sr-only peer" 
                                 checked={user.is_admin || user.pode_acessar_notas_fiscais}
                                 onChange={() => togglePermission(user.id, 'pode_acessar_notas_fiscais', user.pode_acessar_notas_fiscais, user.is_admin)}
                               />
                               <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0066b3]"></div>
                             </div>
                             <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100 transition-colors">Notas Fiscais</span>
                           </label>
                           
                           <label className="flex items-center gap-3 cursor-pointer group">
                             <div className="relative inline-flex items-center">
                               <input 
                                 type="checkbox" 
                                 className="sr-only peer" 
                                 checked={user.is_admin}
                                 onChange={() => togglePermission(user.id, 'is_admin', user.is_admin)}
                               />
                               <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                             </div>
                             <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100 transition-colors">Administrador do Sistema</span>
                           </label>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </>
  );
}
