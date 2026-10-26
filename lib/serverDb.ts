import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Empresa,
  Usuario,
  Documento,
  SistemaConfig,
  ModeloDespesa,
} from './types';
import { INITIAL_CONFIG } from './storage';

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

function requireDatabase(): SupabaseClient {
  const client = getSupabase();
  if (!client) throw new Error('Supabase não configurado. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Vercel.');
  return client;
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
    const supabase = requireDatabase();
    const [empRes, usrRes, docRes, cfgRes, modRes] = await Promise.all([
      supabase.from('empresas').select('*').order('created_at', { ascending: false }),
      supabase.from('usuarios').select('*'),
      supabase.from('documentos').select('*').order('created_at', { ascending: false }),
      supabase.from('configuracoes').select('*').eq('id', 'global').maybeSingle(),
      supabase.from('modelos_despesa').select('*'),
    ]);
    for (const [name, result] of [
      ['empresas', empRes], ['usuarios', usrRes], ['documentos', docRes],
      ['configuracoes', cfgRes], ['modelos_despesa', modRes],
    ] as const) {
      if (result.error) throw new Error(`Falha ao consultar ${name} no Supabase: ${result.error.message}`);
    }
    // Nunca recriar cadastros ou credenciais automaticamente em consultas.
    return {
      source: 'supabase',
      empresas: empRes.data as Empresa[],
      usuarios: usrRes.data as Usuario[],
      documentos: docRes.data as Documento[],
      config: (cfgRes.data?.config as SistemaConfig) || INITIAL_CONFIG,
      modelos_despesa: modRes.data as ModeloDespesa[],
      last_updated: new Date().toISOString(),
    };
  },

  // --- Documentos ---
  async getDocumentos(): Promise<Documento[]> {
    const data = await this.getAllData();
    return data.documentos;
  },

  async saveDocumento(doc: Documento): Promise<Documento> {
    const supabase = requireDatabase();
    const { error } = await supabase.from('documentos').upsert(doc);
    if (error) throw new Error(`Erro ao gravar documentos no Supabase: ${error.message}`);
    return doc;
  },

  async deleteDocumento(id: string): Promise<boolean> {
    const supabase = requireDatabase();
    const { error } = await supabase.from('documentos').delete().eq('id', id);
    if (error) throw new Error(`Erro ao gravar documentos no Supabase: ${error.message}`);
    return true;
  },

  // --- Empresas ---
  async getEmpresas(): Promise<Empresa[]> {
    const data = await this.getAllData();
    return data.empresas;
  },

  async saveEmpresa(empresa: Empresa): Promise<Empresa> {
    const supabase = requireDatabase();
    const { error } = await supabase.from('empresas').upsert(empresa);
    if (error) throw new Error(`Erro ao gravar empresas no Supabase: ${error.message}`);
    return empresa;
  },

  async deleteEmpresa(id: string): Promise<boolean> {
    const supabase = requireDatabase();
    const { error } = await supabase.from('empresas').update({ status: 'inativa', excluida_logica: true }).eq('id', id);
    if (error) throw new Error(`Erro ao gravar empresas no Supabase: ${error.message}`);
    return true;
  },

  // --- Usuários ---
  async getUsuarios(): Promise<Usuario[]> {
    const data = await this.getAllData();
    return data.usuarios;
  },

  async saveUsuario(usuario: Usuario): Promise<Usuario> {
    const supabase = requireDatabase();
    const { error } = await supabase.from('usuarios').upsert(usuario);
    if (error) throw new Error(`Erro ao gravar usuarios no Supabase: ${error.message}`);
    return usuario;
  },

  // --- Configurações & Sequenciais ---
  async getConfig(): Promise<SistemaConfig> {
    const data = await this.getAllData();
    return data.config;
  },

  async saveConfig(cfg: SistemaConfig): Promise<SistemaConfig> {
    const supabase = requireDatabase();
    const { error } = await supabase.from('configuracoes').upsert({ id: 'global', config: cfg });
    if (error) throw new Error(`Erro ao gravar configuracoes no Supabase: ${error.message}`);
    return cfg;
  },

  // --- Modelos de Despesa ---
  async getModelosDespesa(): Promise<ModeloDespesa[]> {
    const data = await this.getAllData();
    return data.modelos_despesa;
  },

  async saveModeloDespesa(modelo: ModeloDespesa): Promise<ModeloDespesa> {
    const supabase = requireDatabase();
    const { error } = await supabase.from('modelos_despesa').upsert(modelo);
    if (error) throw new Error(`Erro ao gravar modelos_despesa no Supabase: ${error.message}`);
    return modelo;
  },

  async deleteModeloDespesa(id: string): Promise<boolean> {
    const supabase = requireDatabase();
    const { error } = await supabase.from('modelos_despesa').delete().eq('id', id);
    if (error) throw new Error(`Erro ao gravar modelos_despesa no Supabase: ${error.message}`);
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
