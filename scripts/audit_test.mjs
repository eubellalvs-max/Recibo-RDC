// scripts/audit_test.mjs
import assert from 'assert';

const BASE_URL = 'http://localhost:3000';

async function req(url, options = {}) {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runAuditTests() {
  console.log('=== INICIANDO BATERIA DE TESTES DE AUDITORIA E INTEGRIDADE ===\n');

  // 1. Teste de Conexão Central e Sincronização
  console.log('[TESTE 1] GET /api/sync - Leitura do estado central do servidor');
  const syncRes = await req('/api/sync');
  assert.strictEqual(syncRes.ok, true, 'GET /api/sync deve responder 200');
  assert.ok(Array.isArray(syncRes.data.empresas), 'Deve conter lista de empresas');
  assert.ok(Array.isArray(syncRes.data.usuarios), 'Deve conter lista de usuários');
  assert.ok(Array.isArray(syncRes.data.documentos), 'Deve conter lista de documentos');
  console.log(`✓ Sincronização central OK: ${syncRes.data.empresas.length} empresas, ${syncRes.data.usuarios.length} usuários, ${syncRes.data.documentos.length} documentos`);

  // Preservação do banco original
  const initialUserCount = syncRes.data.usuarios.length;
  const initialCompanyCount = syncRes.data.empresas.length;

  // 2. Teste de CRUD de Usuários (Criação, Atualização, Consulta, Exclusão)
  console.log('\n[TESTE 2] CRUD Completo de Usuários');
  const testUserId = `usr-test-${Date.now()}`;
  const novoUsuario = {
    id: testUserId,
    nome: 'Operador de Testes Automatizados',
    login: `test_${Date.now()}`,
    email: 'teste.auditoria@abeas.org.br',
    senha: '123',
    perfil: 'emissor',
    status: 'ativo',
    empresas_permitidas: [syncRes.data.empresas[0]?.id],
    created_at: new Date().toISOString(),
  };

  // 2.1 Criar Usuário
  const createUsrRes = await req('/api/usuarios', {
    method: 'POST',
    body: JSON.stringify(novoUsuario),
  });
  assert.strictEqual(createUsrRes.ok, true, 'Criação de usuário deve responder 200');
  console.log(`✓ Usuário criado com sucesso (ID: ${testUserId})`);

  // 2.2 Atualizar Usuário via PUT /api/usuarios/[id]
  novoUsuario.nome = 'Operador de Testes Atualizado';
  const updateUsrRes = await req(`/api/usuarios/${testUserId}`, {
    method: 'PUT',
    body: JSON.stringify(novoUsuario),
  });
  assert.strictEqual(updateUsrRes.ok, true, 'Atualização de usuário via /api/usuarios/[id] deve responder 200');
  assert.strictEqual(updateUsrRes.data.nome, 'Operador de Testes Atualizado', 'Nome deve ser atualizado');
  console.log('✓ Atualização de usuário via PUT /api/usuarios/[id] OK');

  // 2.3 Excluir Usuário de Teste via DELETE /api/usuarios/[id]
  const deleteUsrRes = await req(`/api/usuarios/${testUserId}`, {
    method: 'DELETE',
  });
  assert.strictEqual(deleteUsrRes.ok, true, 'Exclusão de usuário via /api/usuarios/[id] deve responder 200');
  console.log('✓ Exclusão de usuário via DELETE /api/usuarios/[id] OK');

  // 2.4 Verificar que o usuário de teste foi removido
  const checkUsrRes = await req('/api/usuarios');
  const foundDeleted = checkUsrRes.data.find((u) => u.id === testUserId);
  assert.strictEqual(foundDeleted, undefined, 'Usuário excluído não deve existir na listagem');
  assert.strictEqual(checkUsrRes.data.length, initialUserCount, 'Quantidade de usuários restaurada');
  console.log('✓ Integridade e limpeza pós-teste de usuários confirmadas');

  // 3. Teste de CRUD de Empresas e Sequenciador de Numeração
  console.log('\n[TESTE 3] Cadastro de Empresa e Numeração Sequencial por Fornecedor');
  const testEmpresaId = `emp-test-${Date.now()}`;
  const novaEmpresa = {
    id: testEmpresaId,
    tipo_pessoa: 'PJ',
    razao_social: 'Fornecedor Teste Auditoria Ltda',
    nome_fantasia: 'Fornecedor Auditoria',
    cnpj: '11.222.333/0001-99',
    endereco: 'Rua de Testes',
    numero: '100',
    bairro: 'Centro',
    cidade: 'Brasília',
    uf: 'DF',
    cep: '70000-000',
    tipo: 'emissora',
    status: 'ativa',
    proximo_recibo_num: 1,
    created_at: new Date().toISOString(),
  };

  const createEmpRes = await req('/api/empresas', {
    method: 'POST',
    body: JSON.stringify(novaEmpresa),
  });
  assert.strictEqual(createEmpRes.ok, true, 'Criação de empresa deve responder 200');
  console.log(`✓ Empresa/Fornecedor criado (ID: ${testEmpresaId})`);

  // Atualizar sequencial do fornecedor para 10
  novaEmpresa.proximo_recibo_num = 10;
  const updateEmpRes = await req(`/api/empresas/${testEmpresaId}`, {
    method: 'PUT',
    body: JSON.stringify(novaEmpresa),
  });
  assert.strictEqual(updateEmpRes.ok, true, 'Atualização de sequencial deve responder 200');
  assert.strictEqual(updateEmpRes.data.proximo_recibo_num, 10, 'Sequencial deve ser 10');
  console.log('✓ Atualização e persistência de sequencial da empresa OK');

  // 4. Teste de Emissão de Recibo, Preservação de Número na Edição e Cancelamento
  console.log('\n[TESTE 4] Emissão, Edição (Preservação de Número) e Cancelamento de Recibo');
  const testDocId = `doc-audit-${Date.now()}`;
  const docRecibo = {
    id: testDocId,
    numero: '010/2026',
    numero_sequencial: 10,
    tipo: 'recibo',
    empresa_emissora_id: testEmpresaId,
    empresa_destinataria_id: syncRes.data.empresas[0]?.id || 'emp-dest',
    valor: 1500.50,
    valor_extenso: 'Um mil e quinhentos reais e cinquenta centavos',
    referente: 'Serviços de consultoria técnica e auditoria',
    competencia: 'Outubro / 2026',
    data_emissao: '2026-10-26',
    cidade_emissao: 'Brasília - DF',
    usuario_id: 'usr-admin',
    usuario_nome: 'Administrador',
    status: 'emitido',
    created_at: new Date().toISOString(),
  };

  // 4.1 Emissão
  const emitRes = await req('/api/documentos', {
    method: 'POST',
    body: JSON.stringify(docRecibo),
  });
  assert.strictEqual(emitRes.ok, true, 'Emissão de recibo deve responder 200');
  assert.strictEqual(emitRes.data.numero, '010/2026', 'Número formatado deve ser 010/2026');
  console.log(`✓ Recibo emitido com sucesso (Nº: ${emitRes.data.numero}, Valor: R$ ${emitRes.data.valor})`);

  // 4.2 Edição do documento (Muda o valor e referente, mas número DEVE ser estritamente preservado)
  docRecibo.valor = 1800.00;
  docRecibo.valor_extenso = 'Um mil e oitocentos reais';
  docRecibo.referente = 'Serviços de consultoria técnica revisados';
  docRecibo.historico_edicoes = [{
    data: new Date().toISOString(),
    usuario_nome: 'Administrador',
    detalhes: 'Revisão do valor dos serviços',
  }];

  const editRes = await req(`/api/documentos/${testDocId}`, {
    method: 'PUT',
    body: JSON.stringify(docRecibo),
  });
  assert.strictEqual(editRes.ok, true, 'Edição de documento deve responder 200');
  assert.strictEqual(editRes.data.numero, '010/2026', 'Número DEVE ser preservado sem alteração na edição');
  assert.strictEqual(editRes.data.numero_sequencial, 10, 'Sequencial DEVE ser preservado na edição');
  assert.strictEqual(editRes.data.valor, 1800.00, 'Novo valor deve ser salvo');
  assert.ok(editRes.data.historico_edicoes.length > 0, 'Histórico de edições deve conter registro');
  console.log('✓ Edição de documento preservou o número original e registrou histórico de auditoria');

  // 4.3 Cancelamento do Documento
  docRecibo.status = 'cancelado';
  docRecibo.data_cancelamento = new Date().toISOString();
  docRecibo.motivo_cancelamento = 'Cancelamento solicitado em teste de auditoria';
  const cancelRes = await req(`/api/documentos/${testDocId}`, {
    method: 'PUT',
    body: JSON.stringify(docRecibo),
  });
  assert.strictEqual(cancelRes.ok, true, 'Cancelamento via PUT deve responder 200');
  assert.strictEqual(cancelRes.data.status, 'cancelado', 'Status deve ser cancelado');
  console.log('✓ Cancelamento de documento registrado com justificativa e metadados');

  // 5. Teste de Prevenção de Concorrência e Duplicidade de Numeração
  console.log('\n[TESTE 5] Prevenção de Duplicidade em Emissão Concorrente');
  // Cria um documento ativo com sequencial 20
  const docA = {
    id: `doc-conc-A-${Date.now()}`,
    numero: '020/2026',
    numero_sequencial: 20,
    tipo: 'recibo',
    empresa_emissora_id: testEmpresaId,
    empresa_destinataria_id: syncRes.data.empresas[0]?.id || 'emp-dest',
    valor: 500,
    valor_extenso: 'Quinhentos reais',
    referente: 'Taxa operacional concorrente A',
    data_emissao: '2026-10-26',
    cidade_emissao: 'Brasília - DF',
    usuario_id: 'usr-admin',
    status: 'emitido',
    created_at: new Date().toISOString(),
  };
  await req('/api/documentos', { method: 'POST', body: JSON.stringify(docA) });

  // Outro usuário envia simultaneamente o mesmo sequencial 20 para o mesmo fornecedor
  const docB = {
    id: `doc-conc-B-${Date.now()}`,
    numero: '020/2026',
    numero_sequencial: 20,
    tipo: 'recibo',
    empresa_emissora_id: testEmpresaId,
    empresa_destinataria_id: syncRes.data.empresas[0]?.id || 'emp-dest',
    valor: 750,
    valor_extenso: 'Setecentos e cinquenta reais',
    referente: 'Taxa operacional concorrente B',
    data_emissao: '2026-10-26',
    cidade_emissao: 'Brasília - DF',
    usuario_id: 'usr-admin',
    status: 'emitido',
    created_at: new Date().toISOString(),
  };
  const resB = await req('/api/documentos', { method: 'POST', body: JSON.stringify(docB) });
  assert.strictEqual(resB.ok, true);
  assert.notStrictEqual(resB.data.numero, docA.numero, 'O servidor deve impedir duplicidade e avançar o sequencial');
  console.log(`✓ Concorrência resolvida automaticamente: Doc A=${docA.numero}, Doc B=${resB.data.numero} (Sem colisão)`);

  // 6. Teste de Sincronização Multi-Computador (Sem Ressurreição de Dados Excluídos)
  console.log('\n[TESTE 6] Simulação Multi-Computador: Pull Autorizativo e Ausência de Ressurreição');
  // Computador A exclui os documentos de teste
  await req(`/api/documentos/${testDocId}`, { method: 'DELETE' });
  await req(`/api/documentos/${docA.id}`, { method: 'DELETE' });
  await req(`/api/documentos/${docB.id}`, { method: 'DELETE' });
  await req(`/api/empresas/${testEmpresaId}`, { method: 'DELETE' });

  // Computador B consulta GET /api/sync
  const syncPosDelete = await req('/api/sync');
  const docDeletadoExiste = syncPosDelete.data.documentos.some((d) => d.id === testDocId);
  const empDeletadaExiste = syncPosDelete.data.empresas.some((e) => e.id === testEmpresaId);

  assert.strictEqual(docDeletadoExiste, false, 'Documento excluído não deve existir na sincronização');
  assert.strictEqual(empDeletadaExiste, false, 'Empresa excluída não deve existir na sincronização');
  console.log('✓ Sincronização multi-dispositivo perfeita: nenhum registro deletado foi ressuscitado');

  // 7. Confirmação Final de Integridade do Banco de Dados
  console.log('\n[TESTE 7] Verificação Final de Integridade dos Dados de Produção');
  const finalCheck = await req('/api/sync');
  assert.strictEqual(finalCheck.data.usuarios.length, initialUserCount, 'Número original de usuários mantido');
  assert.strictEqual(finalCheck.data.empresas.length, initialCompanyCount, 'Número original de empresas mantido');
  console.log(`✓ Dados de produção 100% preservados (${finalCheck.data.empresas.length} empresas, ${finalCheck.data.usuarios.length} usuários)`);

  console.log('\n=============================================================');
  console.log('TODOS OS 7 TESTES DE AUDITORIA E INTEGRIDADE PASSARAM COM SUCESSO!');
  console.log('=============================================================');
}

runAuditTests().catch((err) => {
  console.error('\n❌ FALHA NO TESTE DE AUDITORIA:', err);
  process.exit(1);
});
