# HERR AGNES — painel administrativo e pedidos

## O que esta implementação prepara

- A rota privada `/admin` autentica com Supabase Auth e exige `profiles.role = 'admin'`.
- O painel consulta pedidos e itens usando as políticas RLS já criadas na migração inicial.
- A página pública `/pedidos` envia o pedido para a Edge Function `create-order` antes de abrir o WhatsApp.
- A Edge Function valida os produtos e preços no servidor e grava o pedido e os itens com a chave de serviço, sem expor essa chave no navegador.
- O número sequencial do banco é usado na mensagem do WhatsApp.

## Implantação da Edge Function

A Edge Function `create-order` já está implantada e ativa no projeto Supabase `efdgljkcrngtaztazxgb` (versão 4). A configuração em `supabase/config.toml` marca a função como pública na camada de gateway; a própria função valida origem, método, campos, catálogo, quantidades e o token Turnstile.

A função usa as variáveis de ambiente gerenciadas pelo Supabase:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TURNSTILE_SECRET_KEY` (segredo do Cloudflare Turnstile)

**Nunca** coloque a chave `service_role` ou o segredo Turnstile em `.env` do frontend, em variáveis `VITE_*`, no GitHub ou no navegador.

A função permanece em modo de bloqueio seguro até que o segredo Turnstile seja configurado. Sem ele, a função responde com erro e não grava pedidos. A validação de cabeçalho Origin, isoladamente, não é proteção antiabuso suficiente.

As tabelas `profiles`, `orders` e `order_items`, as políticas RLS e o perfil administrador já existem no projeto. Atenção: o histórico remoto de migrações registra a migração de endurecimento, mas não registra `20261104000000_initial_orders.sql`. A estrutura existe, porém há divergência entre o schema e o histórico. A migração inicial foi tornada idempotente para reduzir risco, mas não execute `db push` nem reaplique migrações até reconciliar o histórico com o schema existente.

## Antes de publicar

1. Criar um site Turnstile no Cloudflare para o hostname `www.herragnesteresina.com.br`.
2. Configurar o segredo como `TURNSTILE_SECRET_KEY` nos secrets do Supabase.
3. Configurar a chave pública como `VITE_TURNSTILE_SITE_KEY` nas variáveis de ambiente de build/deploy do site e reconstruir o frontend.
4. Confirmar que a URL pública do site é `https://www.herragnesteresina.com.br`.
5. Testar login, consulta de pedidos, alteração de status e envio de um pedido de teste.
6. Só então avaliar a publicação/merge para `lovable-sync`, com autorização explícita da proprietária.

## Limites atuais

- A confirmação de status ainda não envia o evento Purchase pela Meta Conversions API.
- O pedido é salvo no banco antes de abrir o WhatsApp; o WhatsApp continua sendo o canal de contato, sem garantia de entrega ou leitura.
- A implantação da Edge Function é separada do commit no GitHub.
