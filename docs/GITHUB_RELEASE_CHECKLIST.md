# Checklist para publicar no GitHub

Use este checklist antes do primeiro commit e antes de cada release publica.

## Nunca versionar

- `.env`, `backend/.env` ou qualquer arquivo com credenciais reais.
- Chaves Groq/OpenRouter, senhas de aplicativo SMTP/IMAP e cookies de sessao.
- `backend/src/career-dna/apply-reviewed-resume.ts`, que e um seed pessoal local.
- Curriculos/PDFs pessoais, dumps do PostgreSQL, backups, logs e relatorios com dados reais.
- `node_modules/`, `dist/`, `.next/`, `coverage/` e artefatos temporarios.
- Capturas de tela contendo e-mail, telefone, salario, mensagens ou candidaturas reais.

Os unicos arquivos de ambiente publicaveis sao os exemplos sanitizados, como `.env.example` e `backend/.env.example`.

## Antes do primeiro push

1. Rotacionar todas as chaves e senhas que ja tenham aparecido em conversa, captura de tela ou arquivo compartilhado.
2. Inicializar o Git somente quando o conteudo estiver revisado.
3. Executar `git add --dry-run .` e depois inspecionar `git status --short`.
4. Executar `powershell -ExecutionPolicy Bypass -File scripts/verify.ps1`.
5. Confirmar que `docs/`, `README.md`, `DOCUMENTATION.md` e `.github/workflows/quality.yml` estao incluidos.
6. Confirmar que nenhum item da secao "Nunca versionar" aparece nos arquivos preparados.
7. Usar apenas o dataset ficticio nas screenshots e na demonstracao publica.

## Antes de publicar em uma VPS

- Adicionar autenticacao ao dashboard e as APIs.
- Colocar o frontend atras de HTTPS e reverse proxy; adicionar rate limiting e protecao CSRF onde aplicavel.
- Manter PostgreSQL e Adminer sem exposicao publica. Remover o Adminer do ambiente de producao ou restringi-lo por rede/VPN.
- Trocar a senha local do PostgreSQL por uma senha forte e exclusiva.
- Guardar segredos em mecanismo seguro do provedor, nunca no repositorio ou na imagem Docker.
- Manter `DRY_RUN=true`, `APPLICATION_MODE=OBSERVE` e o kill switch ativo ate os testes externos controlados serem aprovados.

## Gate para operacao real

- Validar SMTP/IMAP em conta dedicada e ambiente de teste.
- Validar o modo `PREPARE` sem envio.
- Revisar manualmente uma candidatura completa e realizar apenas um envio controlado.
- Definir limite diario, allowlist e criterio de parada antes de qualquer automacao externa.
- Ativar alertas oficiais de Gupy e Indeed e revisar as empresas-alvo.

