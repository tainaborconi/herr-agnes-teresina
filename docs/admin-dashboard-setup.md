# HERR AGNES — painel administrativo e pedidos

## O que esta implementação prepara

- A rota privada `/admin` autentica com Supabase Auth e exige `profiles.role = 'admin'`.
- O painel consulta pedidos e itens usando as políticas RLS já criadas na migração inicial.
- A página pública `/pedidos` envia o pedido para a Edge Function `create-order` antes de abrir o WhatsApp.
- A Edge Function valida os produtos e preços no servidor e grava o pedido e os itens com a chave de serviço, sem expor essa chave no navegador.
- O número sequencial do banco é usado na mensagem do WhatsApp.

## Implantação da Edge Function

A função precisa ser implantada no projeto Supabase `efdgljkcrngtaztazxgb`. A configuração em `supabase/config.toml` marca a função como pública na camada de gateway; a própria função valida origem, método, campos, catálogo e quantidades.

A função usa as variáveis de ambiente gerenciadas pelo Supabase:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TURNSTILE_SECRET_KEY` (segredo do Cloudflare Turnstile)

**Nunca** coloque a chave `service_role` ou o segredo Turnstile em `.env` do frontend, em variáveis `VITE_*`, no GitHub ou no navegador.

A função foi implantada no Supabase, mas está em modo de bloqueio seguro: ela não registra pedidos enquanto o segredo Turnstile e a verificação no formulário não estiverem configurados. A validação de cabeçalho Origin, isoladamente, não é proteção antiabuso suficiente.

A migração `20261104000000_initial_orders.sql` e a criação do perfil administrador já foram aplicadas anteriormente no projeto Supabase. Não execute a migração novamente manualmente sem conferir o estado do banco.

## Antes de publicar

1. Criar um site Turnstile no Cloudflare e configurar o segredo como `TURNSTILE_SECRET_KEY` nos secrets do Supabase.
2. Adicionar a chave pública do Turnstile ao frontend e integrar o desafio à página `/pedidos`.
3. Confirmar que a URL pública do site é `https://www.herragnesteresina.com.br`.
4. Executar o build e corrigir eventuais erros.
5. Testar login, consulta de pedidos, alteração de status e envio de um pedido de teste.
6. Só então avaliar a publicação/merge para `lovable-sync`, com autorização explícita da proprietária.

## Limites atuais

- A confirmação de status ainda não envia o evento Purchase pela Meta Conversions API.
- O pedido é salvo no banco antes de abrir o WhatsApp; o WhatsApp continua sendo o canal de contato, sem garantia de entrega ou leitura.
- A implantação da Edge Function é separada do commit no GitHub.
