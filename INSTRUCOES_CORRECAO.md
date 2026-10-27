# Correção focada em persistência — Recibos e RDC

## O que mudou

- A API de leitura e gravação usa somente o Supabase. Se ele estiver indisponível, devolve erro em vez de fingir persistência em memória da Vercel.
- O carregamento não cria automaticamente usuários, senhas ou empresas iniciais no banco.
- O cliente coloca gravações em fila e espera sua conclusão antes de aceitar uma sincronização do servidor.
- Se a API rejeitar uma gravação, há aviso explícito e a sincronização não substitui os dados locais naquela sessão.
- A sincronização periódica passou a usar GET de leitura, sem reenviar dados antigos do navegador.
- O filtro automático que descartava documentos anteriores a 22/10/2026 foi retirado do carregamento local.

## Implantação

1. Faça cópia de segurança dos dados reais no Supabase e do código publicado. Não execute seeds nem substitua tabelas pelos JSONs de exemplo do pacote.
2. Em Vercel > Project > Settings > Environment Variables, confirme `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` do projeto Supabase que contém os dados reais. Não cole os valores aqui. Configure para Production e demais ambientes usados.
3. Publique esta versão em uma implantação de teste antes de promover para Production.
4. Visite `/api/health`: `database_type` precisa ser `supabase`; se houver erro, verifique variáveis, tabelas, permissões e logs.
5. Em ambiente de teste, altere cadastro e configuração, espere mais de 20 segundos, atualize, saia e entre novamente. Confira os mesmos registros no painel Table Editor do Supabase.
6. Caso apareça aviso de falha, não recarregue o navegador antes de copiar os dados alterados e revisar os logs.

## Limitações

Não foi possível executar testes integrados contra o Supabase real nem compilar com dependências instaladas nesta execução. A solução pressupõe que o banco Supabase e tabelas do schema já existem. O aplicativo ainda usa gravações otimistas em localStorage e o projeto mantém outras questões de segurança fora deste escopo. Uma falha antes da confirmação não equivale a salvamento.
