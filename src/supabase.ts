import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validação detalhada para ignorar placeholders ou chaves não configuradas
const isPlaceholder = (val: string) => {
  if (!val) return true;
  const lower = val.toLowerCase();
  return (
    lower.includes('your_') ||
    lower.includes('placeholder') ||
    lower.includes('example.com') ||
    lower.includes('djzmljprkyykhuitcqpt') ||
    !val.startsWith('https://')
  );
};

const isConfigured = !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey);

class SupabaseMockBuilder {
  private tableName: string;
  private queryParams: any[] = [];
  private isSingle = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  private getCollection() {
    try {
      const data = localStorage.getItem(`mock_db_${this.tableName}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  private saveCollection(data: any[]) {
    try {
      localStorage.setItem(`mock_db_${this.tableName}`, JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }
  }

  select(columns: string = '*') {
    return this;
  }

  eq(column: string, value: any) {
    this.queryParams.push({ type: 'eq', column, value });
    return this;
  }

  neq(column: string, value: any) {
    this.queryParams.push({ type: 'neq', column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.queryParams.push({ type: 'order', column, options });
    return this;
  }

  single() {
    this.isSingle = true;
    const promise = this.exec();
    return {
      then: (onfulfilled?: any, onrejected?: any) => promise.then(onfulfilled, onrejected),
      catch: (onrejected?: any) => promise.catch(onrejected),
      finally: (onfinally?: any) => promise.finally(onfinally)
    };
  }

  then(onfulfilled?: any, onrejected?: any) {
    return this.exec().then(onfulfilled, onrejected);
  }

  catch(onrejected?: any) {
    return this.exec().catch(onrejected);
  }

  finally(onfinally?: any) {
    return this.exec().finally(onfinally);
  }

  private async exec() {
    let items = this.getCollection();

    // Auto-provisionamento de permissões para garantir que o usuário acesse todas as abas
    if (this.tableName === 'permissoes_usuarios') {
      const emailFilter = this.queryParams.find(q => q.type === 'eq' && q.column === 'email');
      const email = emailFilter ? emailFilter.value : 'joaovitormachry@gmail.com';
      
      const exists = items.some((i: any) => i.email === email);
      if (!exists) {
        const newPerm = {
          id: `mock-perm-${Math.random().toString(36).substr(2, 9)}`,
          email: email,
          pode_acessar_premio: true,
          pode_acessar_orcamentos: true,
          pode_acessar_notas_fiscais: true,
          pode_acessar_sicredi: true,
          pode_acessar_manuais: true,
          pode_acessar_config: true,
          is_admin: true,
          created_at: new Date().toISOString()
        };
        items.push(newPerm);
        this.saveCollection(items);
      }
    }

    // Aplicar filtros eq
    for (const filter of this.queryParams) {
      if (filter.type === 'eq') {
        items = items.filter((item: any) => item[filter.column] === filter.value);
      } else if (filter.type === 'neq') {
        items = items.filter((item: any) => item[filter.column] !== filter.value);
      }
    }

    // Aplicar ordenação
    const orderFilter = this.queryParams.find(q => q.type === 'order');
    if (orderFilter) {
      const asc = orderFilter.options?.ascending !== false;
      const col = orderFilter.column;
      items.sort((a: any, b: any) => {
        const valA = a[col];
        const valB = b[col];
        if (valA < valB) return asc ? -1 : 1;
        if (valA > valB) return asc ? 1 : -1;
        return 0;
      });
    }

    if (this.isSingle) {
      if (items.length === 0) {
        return { data: null, error: { code: 'PGRST116', message: 'Row not found' } };
      }
      return { data: items[0], error: null };
    }

    return { data: items, error: null };
  }

  insert(values: any | any[]) {
    const arr = Array.isArray(values) ? values : [values];
    const items = this.getCollection();
    const newItems = arr.map((item: any) => ({
      id: item.id || `mock-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      ...item
    }));

    this.saveCollection([...items, ...newItems]);

    return {
      select: (cols?: string) => {
        const nextBuilder = new SupabaseMockBuilder(this.tableName);
        nextBuilder.queryParams = [{ type: 'eq', column: 'id', value: newItems[0].id }];
        return nextBuilder;
      },
      then: (onfulfilled?: any) => Promise.resolve({ data: newItems, error: null }).then(onfulfilled)
    };
  }

  update(values: any) {
    return {
      eq: (column: string, value: any) => {
        const items = this.getCollection();
        let updatedCount = 0;
        const nextItems = items.map((item: any) => {
          if (item[column] === value) {
            updatedCount++;
            return { ...item, ...values, updated_at: new Date().toISOString() };
          }
          return item;
        });

        this.saveCollection(nextItems);
        const updatedItems = nextItems.filter((i: any) => i[column] === value);
        
        return {
          then: (onfulfilled?: any) => Promise.resolve({ data: updatedItems, error: null }).then(onfulfilled)
        };
      }
    };
  }

  upsert(values: any | any[]) {
    const arr = Array.isArray(values) ? values : [values];
    const items = this.getCollection();

    const nextItems = [...items];
    const upsertedItems: any[] = [];

    arr.forEach((item: any) => {
      const index = nextItems.findIndex((i: any) => {
        if (item.id && i.id === item.id) return true;
        if (this.tableName === 'permissoes_usuarios' && item.email && i.email === item.email) return true;
        return false;
      });

      if (index > -1) {
        const updated = { ...nextItems[index], ...item, updated_at: new Date().toISOString() };
        nextItems[index] = updated;
        upsertedItems.push(updated);
      } else {
        const created = {
          id: item.id || `mock-${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString(),
          ...item
        };
        nextItems.push(created);
        upsertedItems.push(created);
      }
    });

    this.saveCollection(nextItems);

    return {
      select: (cols?: string) => {
        return {
          single: () => {
            return {
              then: (onfulfilled?: any) => Promise.resolve({ data: upsertedItems[upsertedItems.length - 1], error: null }).then(onfulfilled),
              catch: (onrejected?: any) => Promise.resolve({ data: upsertedItems[upsertedItems.length - 1], error: null }).catch(onrejected)
            };
          },
          then: (onfulfilled?: any) => Promise.resolve({ data: upsertedItems, error: null }).then(onfulfilled)
        };
      },
      then: (onfulfilled?: any) => Promise.resolve({ data: upsertedItems, error: null }).then(onfulfilled)
    };
  }

  delete() {
    return {
      eq: (column: string, value: any) => {
        const items = this.getCollection();
        const nextItems = items.filter((item: any) => item[column] !== value);
        this.saveCollection(nextItems);
        
        return {
          then: (onfulfilled?: any) => Promise.resolve({ data: items.filter((item: any) => item[column] === value), error: null }).then(onfulfilled)
        };
      }
    };
  }
}

// Export do Supabase Client real ou mockado
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : ({
      auth: {
        getSession: async () => {
          try {
            const savedSession = localStorage.getItem('mock_supabase_session');
            if (savedSession) {
              return { data: { session: JSON.parse(savedSession) }, error: null };
            }
          } catch (e) {}
          return { data: { session: null }, error: null };
        },
        onAuthStateChange: (callback: any) => {
          // Dispara callback inicial opcional com a sessão atual
          try {
            const savedSession = localStorage.getItem('mock_supabase_session');
            if (savedSession && callback) {
              callback('SIGNED_IN', JSON.parse(savedSession));
            }
          } catch (e) {}
          return { data: { subscription: { unsubscribe: () => {} } } };
        },
        signInWithPassword: async ({ email }: any) => {
          const mockSession = {
            user: { id: 'mock-user-id', email: email || 'teste@agafarma.com.br', email_confirmed_at: new Date().toISOString() },
            access_token: 'mock-token'
          };
          try {
            localStorage.setItem('mock_supabase_session', JSON.stringify(mockSession));
          } catch (e) {}
          return { data: { session: mockSession }, error: null };
        },
        signUp: async ({ email }: any) => {
          const mockSession = {
            user: { id: 'mock-user-id', email: email || 'teste@agafarma.com.br', email_confirmed_at: new Date().toISOString() },
            access_token: 'mock-token'
          };
          try {
            localStorage.setItem('mock_supabase_session', JSON.stringify(mockSession));
          } catch (e) {}
          return { data: { session: mockSession }, error: null };
        },
        signOut: async () => {
          try {
            localStorage.removeItem('mock_supabase_session');
          } catch (e) {}
          return { error: null };
        }
      },
      from: (tableName: string) => {
        return new SupabaseMockBuilder(tableName);
      }
    } as any);
