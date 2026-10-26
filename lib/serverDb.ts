import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Empresa,
  Usuario,
  Documento,
  SistemaConfig,
  ModeloDespesa,
} from './types';
import {
  INITIAL_USUARIOS,
  INITIAL_EMPRESAS,
  INITIAL_DOCUMENTOS,
  INITIAL_CONFIG,
  INITIAL_MODELOS_DESPESA,
} from './storage';
import fs from 'fs';
import path from 'path';

// Estado global em memória no servidor para persistência central entre requisições
interface ServerDataStore {
  usuarios: Usuario[];
  empresas: Empresa[];
  documentos: Documento[];
  config: SistemaConfig;
  modelos_despesa: ModeloDespesa[];
  last_updated: string;
}

// Arquivo de persistência local no servidor para suportar reinícios sem Supabase
const PERSISTENCE_FILE = path.join(process.cwd(), '.server_db_data.json');

let inMemoryStore: ServerDataStore | null = null;

function loadStoreFromFile(): ServerDataStore {
  try {
    if (fs.existsSync(PERSISTENCE_FILE)) {
      const raw = fs.readFileSync(PERSISTENCE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.documentos && parsed.empresas && parsed.usuarios && parsed.config) {
        // Expurgar documentos legados de teste/desenvolvimento anteriores a 22/10/2026
        parsed.documentos = (parsed.documentos as Documento[]).filter(
          (d) =>
            (d.data_emissao && d.data_emissao >= '2026-10-22') ||
            (d.created_at && d.created_at >= '2026-10-22')
        );
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Não foi possível carregar arquivo de persistência do servidor:', err);
  }

  return {
    usuarios: [...INITIAL_USUARIOS],
    empresas: [...INITIAL_EMPRESAS],
    documentos: [],
    config: { ...INITIAL_CONFIG },
    modelos_despesa: [...INITIAL_MODELOS_DESPESA],
    last_updated: new Date().toISOString(),
  };
}

function saveStoreToFile(store: ServerDataStore) {
  try {
    store.last_updated = new Date().toISOString();
    fs.writeFileSync(PERSISTENCE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    // Em ambientes serverless read-only da Vercel, o fs pode falhar; mantemos em memória
    console.warn('Aviso: gravação em disco no servidor falhou (normal em serverless):', err);
  }
}

function getStore(): ServerDataStore {
  if (!inMemoryStore) {
    inMemoryStore = loadStoreFromFile();
  }
  return inMemoryStore;
}

// Conexão Supabase se configurada via variáveis de ambiente
let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && key) {
    try {
      supabaseClient = createClient(url, key, {
        auth: { persistSession: false },
      });
      return supabaseClient;
    } catch (err) {
      console.error('Erro ao inicializar cliente Supabase:', err);
    }
  }

  return null;
}

export interface UnifiedServerData {
  source: 'supabase' | 'server_store';
  empresas: Empresa[];
  usuarios: Usuario[];
  documentos: Documento[];
  config: SistemaConfig;
  modelos_despesa: ModeloDespesa[];
  last_updated: string;
}

export const ServerDb = {
  isSupabaseConfigured(): boolean {
    return !!getSupabase();
  },

  async getAllData(): Promise<UnifiedServerData> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const [empRes, usrRes, docRes, cfgRes, modRes] = await Promise.all([
          supabase.from('empresas').select('*').order('created_at', { ascending: false }),
          supabase.from('usuarios').select('*'),
          supabase.from('documentos').select('*').order('created_at', { ascending: false }),
          supabase.from('configuracoes').select('*').eq('id', 'global').maybeSingle(),
          supabase.from('modelos_despesa').select('*'),
        ]);

        if (!empRes.error && !docRes.error && empRes.data && docRes.data) {
          // Se o banco Supabase estiver vazio, auto-semeia com os dados iniciais
          if (empRes.data.length === 0 && docRes.data.length === 0) {
            await this.seedSupabase(supabase);
            return this.getAllData();
          }

          return {
            source: 'supabase',
            empresas: empRes.data as Empresa[],
            usuarios: usrRes.data as Usuario[],
            documentos: docRes.data as Documento[],
            config: (cfgRes.data?.config as SistemaConfig) || getStore().config,
            modelos_despesa: (modRes.data as ModeloDespesa[]) || getStore().modelos_despesa,
            last_updated: new Date().toISOString(),
          };
        }
      } catch (err) {
        console.warn('Supabase query falhou, utilizando fallback server store:', err);
      }
    }

    const store = getStore();
    return {
      source: 'server_store',
      empresas: store.empresas,
      usuarios: store.usuarios,
      documentos: store.documentos,
      config: store.config,
      modelos_despesa: store.modelos_despesa,
      last_updated: store.last_updated,
    };
  },

  async seedSupabase(supabase: SupabaseClient) {
    const store = getStore();
    try {
      await supabase.from('empresas').upsert(store.empresas);
      await supabase.from('usuarios').upsert(store.usuarios);
      await supabase.from('documentos').upsert(store.documentos);
      await supabase.from('configuracoes').upsert({ id: 'global', config: store.config });
      await supabase.from('modelos_despesa').upsert(store.modelos_despesa);
    } catch (e) {
      console.error('Erro ao semear Supabase:', e);
    }
  },

  // --- Documentos ---
  async getDocumentos(): Promise<Documento[]> {
    const data = await this.getAllData();
    return data.documentos;
  },

  async saveDocumento(doc: Documento): Promise<Documento> {
    const store = getStore();
    const idx = store.documentos.findIndex((d) => d.id === doc.id);

    // Proteção de concorrência para emissão de novos documentos:
    // Se for um novo documento (não edição de existente), garante que não haja
    // duplicidade de número para o mesmo fornecedor e tipo de documento.
    if (idx < 0) {
      const fornecedorId = doc.empresa_emissora_id;
      const tipo = doc.tipo;
      const duplicado = store.documentos.find(
        (d) =>
          d.id !== doc.id &&
          d.empresa_emissora_id === fornecedorId &&
          d.tipo === tipo &&
          (d.numero_sequencial === doc.numero_sequencial || d.numero === doc.numero)
      );

      if (duplicado) {
        const maxSeq = store.documentos
          .filter(
            (d) =>
              d.empresa_emissora_id === fornecedorId &&
              d.tipo === tipo
          )
          .reduce((max, d) => Math.max(max, d.numero_sequencial || 0), 0);
        const novoSeq = Math.max(maxSeq + 1, (doc.numero_sequencial || 0) + 1);
        doc.numero_sequencial = novoSeq;
        const anoRef = new Date().getFullYear();
        if (tipo === 'recibo') {
          doc.numero = `${String(novoSeq).padStart(3, '0')}/${anoRef}`;
        } else if (tipo === 'rdc') {
          doc.numero = `${String(novoSeq).padStart(6, '0')}/${anoRef}`;
        } else if (tipo === 'recibo_medico') {
          doc.numero = `${String(novoSeq).padStart(3, '0')}/${anoRef}`;
        }
      }
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.from('documentos').upsert(doc);
        if (!error) {
          if (idx >= 0) store.documentos[idx] = doc;
          else store.documentos.unshift(doc);
          saveStoreToFile(store);
          return doc;
        }
      } catch (err) {
        console.error('Erro ao salvar documento no Supabase:', err);
      }
    }

    if (idx >= 0) {
      store.documentos[idx] = doc;
    } else {
      store.documentos.unshift(doc);
    }
    saveStoreToFile(store);
    return doc;
  },

  async deleteDocumento(id: string): Promise<boolean> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('documentos').delete().eq('id', id);
      } catch (err) {
        console.error('Erro ao deletar documento no Supabase:', err);
      }
    }

    const store = getStore();
    store.documentos = store.documentos.filter((d) => d.id !== id);
    saveStoreToFile(store);
    return true;
  },

  // --- Empresas ---
  async getEmpresas(): Promise<Empresa[]> {
    const data = await this.getAllData();
    return data.empresas;
  },

  async saveEmpresa(empresa: Empresa): Promise<Empresa> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.from('empresas').upsert(empresa);
        if (!error) {
          const store = getStore();
          const idx = store.empresas.findIndex((e) => e.id === empresa.id);
          if (idx >= 0) store.empresas[idx] = empresa;
          else store.empresas.unshift(empresa);
          saveStoreToFile(store);
          return empresa;
        }
      } catch (err) {
        console.error('Erro ao salvar empresa no Supabase:', err);
      }
    }

    const store = getStore();
    const idx = store.empresas.findIndex((e) => e.id === empresa.id);
    if (idx >= 0) {
      store.empresas[idx] = empresa;
    } else {
      store.empresas.unshift(empresa);
    }
    saveStoreToFile(store);
    return empresa;
  },

  async deleteEmpresa(id: string): Promise<boolean> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('empresas').delete().eq('id', id);
      } catch (err) {
        console.error('Erro ao deletar empresa no Supabase:', err);
      }
    }

    const store = getStore();
    store.empresas = store.empresas.filter((e) => e.id !== id);
    saveStoreToFile(store);
    return true;
  },

  // --- Usuários ---
  async getUsuarios(): Promise<Usuario[]> {
    const data = await this.getAllData();
    return data.usuarios;
  },

  async saveUsuario(usuario: Usuario): Promise<Usuario> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.from('usuarios').upsert(usuario);
        if (!error) {
          const store = getStore();
          const idx = store.usuarios.findIndex((u) => u.id === usuario.id);
          if (idx >= 0) store.usuarios[idx] = usuario;
          else store.usuarios.push(usuario);
          saveStoreToFile(store);
          return usuario;
        }
      } catch (err) {
        console.error('Erro ao salvar usuário no Supabase:', err);
      }
    }

    const store = getStore();
    const idx = store.usuarios.findIndex((u) => u.id === usuario.id);
    if (idx >= 0) {
      store.usuarios[idx] = usuario;
    } else {
      store.usuarios.push(usuario);
    }
    saveStoreToFile(store);
    return usuario;
  },

  async deleteUsuario(id: string): Promise<boolean> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('usuarios').delete().eq('id', id);
      } catch (err) {
        console.error('Erro ao deletar usuário no Supabase:', err);
      }
    }

    const store = getStore();
    store.usuarios = store.usuarios.filter((u) => u.id !== id);
    saveStoreToFile(store);
    return true;
  },

  // --- Configurações & Sequenciais ---
  async getConfig(): Promise<SistemaConfig> {
    const data = await this.getAllData();
    return data.config;
  },

  async saveConfig(cfg: SistemaConfig): Promise<SistemaConfig> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('configuracoes').upsert({ id: 'global', config: cfg });
      } catch (err) {
        console.error('Erro ao salvar configurações no Supabase:', err);
      }
    }

    const store = getStore();
    store.config = cfg;
    saveStoreToFile(store);
    return cfg;
  },

  // --- Modelos de Despesa ---
  async getModelosDespesa(): Promise<ModeloDespesa[]> {
    const data = await this.getAllData();
    return data.modelos_despesa;
  },

  async saveModeloDespesa(modelo: ModeloDespesa): Promise<ModeloDespesa> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('modelos_despesa').upsert(modelo);
      } catch (err) {
        console.error('Erro ao salvar modelo de despesa no Supabase:', err);
      }
    }

    const store = getStore();
    const idx = store.modelos_despesa.findIndex((m) => m.id === modelo.id);
    if (idx >= 0) {
      store.modelos_despesa[idx] = modelo;
    } else {
      store.modelos_despesa.unshift(modelo);
    }
    saveStoreToFile(store);
    return modelo;
  },

  async deleteModeloDespesa(id: string): Promise<boolean> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('modelos_despesa').delete().eq('id', id);
      } catch (err) {
        console.error('Erro ao deletar modelo no Supabase:', err);
      }
    }

    const store = getStore();
    store.modelos_despesa = store.modelos_despesa.filter((m) => m.id !== id);
    saveStoreToFile(store);
    return true;
  },

  // --- Reconciliação / Migração Segura de Dados do Cliente ---
  async reconcileClientData(clientData: {
    documentos?: Documento[];
    empresas?: Empresa[];
    usuarios?: Usuario[];
    config?: SistemaConfig;
    modelos_despesa?: ModeloDespesa[];
  }) {
    const current = await this.getAllData();
    let mudou = false;

    // 1. Reconciliação de Empresas
    if (clientData.empresas && clientData.empresas.length > 0) {
      for (const emp of clientData.empresas) {
        const existe = current.empresas.find((e) => e.id === emp.id);
        if (!existe) {
          await this.saveEmpresa(emp);
          current.empresas.unshift(emp);
          mudou = true;
        }
      }
    }

    // 2. Reconciliação de Documentos (preserva originais sem alterar número nem duplicar; descarta legados < 2026-10-22)
    if (clientData.documentos && clientData.documentos.length > 0) {
      for (const doc of clientData.documentos) {
        const isLegado =
          (!doc.data_emissao || doc.data_emissao < '2026-10-22') &&
          (!doc.created_at || doc.created_at < '2026-10-22');
        if (isLegado) continue;

        const existe = current.documentos.find((d) => d.id === doc.id);
        if (!existe) {
          await this.saveDocumento(doc);
          current.documentos.unshift(doc);
          mudou = true;
        }
      }
    }

    // 3. Reconciliação de Modelos de Despesa
    if (clientData.modelos_despesa && clientData.modelos_despesa.length > 0) {
      for (const mod of clientData.modelos_despesa) {
        const existe = current.modelos_despesa.find((m) => m.id === mod.id);
        if (!existe) {
          await this.saveModeloDespesa(mod);
          current.modelos_despesa.unshift(mod);
          mudou = true;
        }
      }
    }

    return await this.getAllData();
  },
};
