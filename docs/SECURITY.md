# Segurança e Privacidade

## Defaults seguros

Os arquivos `.env.example` mantêm IMAP, scrapers, ATS e processamento desabilitados. Um ambiente novo deve falhar fechado até receber credenciais privadas e habilitação consciente, uma feature por vez.

## Segredos

- `.env` nunca deve ser versionado.
- Exemplos usam somente placeholders.
- Logs não podem exibir chaves, senhas, tokens ou cookies.
- SMTP/IMAP devem usar conta dedicada e senha de aplicativo.
- Chaves devem ter limite de gastos e rotação periódica.

## Plataformas autenticadas

- Sessões de LinkedIn, Gupy e Indeed ficam no navegador do usuário.
- O backend não recebe `li_at`, cookies, senha ou MFA.
- A extensão futura solicita permissões apenas para hosts suportados.
- O envio final em formulários autenticados exige confirmação humana.

## Ações externas

- Toda candidatura consulta o ledger de duplicidade.
- Testes usam transportes simulados e páginas fixture.
- Existe botão de pausa e limites diários antes de ampliar automação.
- Toda ação real registra destino, horário, material e resultado.

## Dados profissionais

- A IA usa apenas fatos aprovados no Career DNA.
- Documentos gerados são tratados como dados privados.
- Backups não devem ser enviados para repositórios públicos.

## Publicacao e rede

- PostgreSQL, Adminer e dashboard usam `127.0.0.1` por padrao no Compose.
- Nao altere `BIND_ADDRESS` para uma interface publica sem proxy reverso, HTTPS e autenticacao.
- O dashboard e suas APIs privadas exigem sessao assinada; a area `/portfolio` permanece publica por decisao de produto.
- Login e APIs possuem limites por janela. Os valores podem ser ajustados por `AUTH_LOGIN_RATE_LIMIT`, `API_READ_RATE_LIMIT` e `API_WRITE_RATE_LIMIT`.
- `TRUST_PROXY` deve permanecer `false` quando o Next.js estiver acessivel diretamente. Habilite apenas atras de proxy reverso que remova e reescreva `X-Real-IP` e `X-Forwarded-For`.
- O limitador atual e local ao processo e adequado a uma unica instancia. Antes de escalar horizontalmente, substitua o armazenamento em memoria por Redis ou outro armazenamento compartilhado.
- Em producao, use somente `docker-compose.prod.yml`: apenas Caddy publica 80/443; PostgreSQL, frontend e worker nao publicam portas no host.
- O Caddy sobrescreve `X-Real-IP` e `X-Forwarded-For`, termina TLS automaticamente e encaminha apenas para o frontend interno.
- Nao publique Adminer em producao. Para manutencao, use tunel SSH temporario e restrito.
- O script local `backend/src/career-dna/apply-reviewed-resume.ts` contem dados pessoais, e ignorado pelo Git e nunca deve ser forçado para um repositorio publico.
- Antes do primeiro commit, execute o scanner de segredos e revise a lista completa de arquivos staged.
