import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Empresa,
  Usuario,
  Documento,
  SistemaConfig,
  ModeloDespesa,
} from './types';
import { INITIAL_CONFIG } from './storage';

// Conexão Supabase configurada via variáveis de ambiente
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
  if (!client) {
    throw new Error(
      'Supabase não configurado. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Vercel ou no ambiente.'
    );
  }
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
      ['empresas', empRes],
      ['usuarios', usrRes],
      ['documentos', docRes],
      ['configuracoes', cfgRes],
      ['modelos_despesa', modRes],
    ] as const) {
      if (result.error) {
        throw new Error(`Falha ao consultar ${name} no Supabase: ${result.error.message}`);
      }
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

  async getDocumentoById(id: string): Promise<Documento | null> {
    const supabase = requireDatabase();
    const { data, error } = await supabase.from('documentos').select('*').eq('id', id).maybeSingle();
    if (error) {
      throw new Error(`Erro ao consultar documento ${id} no Supabase: ${error.message}`);
    }
    return (data as Documento) || null;
  },

  async saveDocumento(doc: Documento): Promise<Documento> {
    const supabase = requireDatabase();
    const { error } = await supabase.from('documentos').upsert(doc);
    if (error) {
      // Tratamento de erros e tentativa de regravação:
      // Se falhar devido à coluna 'retencao_impostos' (código PGRST204 ou menção no erro),
      // regrava sem essa coluna para garantir compatibilidade com versões anteriores da tabela.
      if (
        (error.message && error.message.includes('retencao_impostos')) ||
        error.code === 'PGRST204'
      ) {
        const docSemRetencao = { ...doc };
        delete (docSemRetencao as Record<string, unknown>).retencao_impostos;
        const retry = await supabase.from('documentos').upsert(docSemRetencao);
        if (retry.error) {
          throw new Error(`Erro ao regravar documento no Supabase: ${retry.error.message}`);
        }
        return doc;
      }
      throw new Error(`Erro ao gravar documento no Supabase: ${error.message}`);
    }
    return doc;
  },

  async deleteDocumento(id: string): Promise<boolean> {
    const supabase = requireDatabase();
    const { error } = await supabase.from('documentos').delete().eq('id', id);
    if (error) throw new Error(`Erro ao excluir documento no Supabase: ${error.message}`);
    return true;
  },

  // --- Empresas ---
  async getEmpresas(): Promise<Empresa[]> {
    const data = await this.getAllData();
    return data.empresas;
  },

  async getEmpresaById(id: string): Promise<Empresa | null> {
    const supabase = requireDatabase();
    const { data, error } = await supabase.from('empresas').select('*').eq('id', id).maybeSingle();
    if (error) {
      throw new Error(`Erro ao consultar empresa ${id} no Supabase: ${error.message}`);
    }
    return (data as Empresa) || null;
  },

  async saveEmpresa(empresa: Empresa): Promise<Empresa> {
    const supabase = requireDatabase();
    const { error } = await supabase.from('empresas').upsert(empresa);
    if (error) throw new Error(`Erro ao gravar empresa no Supabase: ${error.message}`);
    return empresa;
  },

  async deleteEmpresa(id: string): Promise<boolean> {
    const supabase = requireDatabase();
    const { error } = await supabase
      .from('empresas')
      .update({ status: 'inativa', excluida_logica: true })
      .eq('id', id);
    if (error) throw new Error(`Erro ao inativar/excluir empresa no Supabase: ${error.message}`);
    return true;
  },

  // --- Usuários ---
  async getUsuarios(): Promise<Usuario[]> {
    const data = await this.getAllData();
    return data.usuarios;
  },

  async getUsuarioById(id: string): Promise<Usuario | null> {
    const supabase = requireDatabase();
    const { data, error } = await supabase.from('usuarios').select('*').eq('id', id).maybeSingle();
    if (error) {
      throw new Error(`Erro ao consultar usuário ${id} no Supabase: ${error.message}`);
    }
    return (data as Usuario) || null;
  },

  async saveUsuario(usuario: Usuario): Promise<Usuario> {
    const supabase = requireDatabase();
    const { error } = await supabase.from('usuarios').upsert(usuario);
    if (error) throw new Error(`Erro ao gravar usuário no Supabase: ${error.message}`);
    return usuario;
  },

  async deleteUsuario(id: string): Promise<boolean> {
    const supabase = requireDatabase();
    // Exclusão de usuários acionada pela rota DELETE /api/usuarios/[id]
    // 1. Tenta a exclusão física do registro no Supabase
    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    if (error) {
      // 2. Se a exclusão física falhar por restrição de chave estrangeira ou política RLS,
      // realiza exclusão lógica (inativação) preservando integridade referencial
      const inactRes = await supabase
        .from('usuarios')
        .update({ status: 'inativo' })
        .eq('id', id);

      if (inactRes.error) {
        throw new Error(
          `Erro ao excluir usuário no Supabase: ${error.message} (tentativa de inativação: ${inactRes.error.message})`
        );
      }
    }
    return true;
  },

  // --- Configurações & Sequenciais ---
  async getConfig(): Promise<SistemaConfig> {
    const data = await this.getAllData();
    return data.config;
  },

  async saveConfig(cfg: SistemaConfig): Promise<SistemaConfig> {
    const supabase = requireDatabase();
    const { error } = await supabase.from('configuracoes').upsert({ id: 'global', config: cfg });
    if (error) throw new Error(`Erro ao gravar configurações no Supabase: ${error.message}`);
    return cfg;
  },

  // --- Modelos de Despesa ---
  async getModelosDespesa(): Promise<ModeloDespesa[]> {
    const data = await this.getAllData();
    return data.modelos_despesa;
  },

  async getModeloDespesaById(id: string): Promise<ModeloDespesa | null> {
    const supabase = requireDatabase();
    const { data, error } = await supabase.from('modelos_despesa').select('*').eq('id', id).maybeSingle();
    if (error) {
      throw new Error(`Erro ao consultar modelo de despesa ${id} no Supabase: ${error.message}`);
    }
    return (data as ModeloDespesa) || null;
  },

  async saveModeloDespesa(modelo: ModeloDespesa): Promise<ModeloDespesa> {
    const supabase = requireDatabase();
    const { error } = await supabase.from('modelos_despesa').upsert(modelo);
    if (error) throw new Error(`Erro ao gravar modelos de despesa no Supabase: ${error.message}`);
    return modelo;
  },

  async deleteModeloDespesa(id: string): Promise<boolean> {
    const supabase = requireDatabase();
    const { error } = await supabase.from('modelos_despesa').delete().eq('id', id);
    if (error) throw new Error(`Erro ao excluir modelo de despesa no Supabase: ${error.message}`);
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

    // 1. Reconciliação de Empresas
    if (clientData.empresas && clientData.empresas.length > 0) {
      for (const emp of clientData.empresas) {
        const existe = current.empresas.find((e) => e.id === emp.id);
        if (!existe) {
          await this.saveEmpresa(emp);
          current.empresas.unshift(emp);
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
        }
      }
    }

    // 3. Reconciliação de Usuários (se fornecido)
    if (clientData.usuarios && clientData.usuarios.length > 0) {
      for (const usr of clientData.usuarios) {
        const existe = current.usuarios.find(
          (u) => u.id === usr.id || u.login.toLowerCase() === usr.login.toLowerCase()
        );
        if (!existe) {
          await this.saveUsuario(usr);
          current.usuarios.push(usr);
        }
      }
    }

    // 4. Reconciliação de Modelos de Despesa
    if (clientData.modelos_despesa && clientData.modelos_despesa.length > 0) {
      for (const mod of clientData.modelos_despesa) {
        const existe = current.modelos_despesa.find((m) => m.id === mod.id);
        if (!existe) {
          await this.saveModeloDespesa(mod);
          current.modelos_despesa.unshift(mod);
        }
      }
    }

    return await this.getAllData();
  },
};
