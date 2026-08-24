# Runbook Operacional

## Subir o ambiente

```powershell
docker compose up -d --build
docker compose ps
```

## Produção com HTTPS

1. Aponte o DNS do domínio para o IP público da VPS e libere somente TCP 22, 80 e 443 e UDP 443 no firewall.
2. Copie `deploy/.env.example` para `deploy/.env.production`, complete os segredos e mantenha esse arquivo fora do Git.
3. Preserve os bloqueios de ação externa no primeiro deploy (`DRY_RUN=true`, `APPLICATION_MODE=OBSERVE` e kill switch ativo).
4. Valide e suba a composição isolada:

```bash
docker compose --env-file deploy/.env.production -f docker-compose.prod.yml config --quiet
docker compose --env-file deploy/.env.production -f docker-compose.prod.yml up -d --build
docker compose --env-file deploy/.env.production -f docker-compose.prod.yml ps
```

O serviço `migrate` aplica migrations pendentes e precisa terminar com código zero antes de backend e frontend iniciarem. Apenas o Caddy publica portas; banco, worker e Next.js permanecem na rede Docker privada.

Para observar a inicialização sem revelar variáveis:

```bash
docker compose --env-file deploy/.env.production -f docker-compose.prod.yml logs --tail 100 migrate frontend backend caddy
curl --fail https://SEU_DOMINIO/api/health
```

## Verificar saúde

```powershell
docker compose ps
docker compose logs --since 10m backend
docker compose logs --since 10m frontend
```

O Postgres deve estar `healthy`; backend e frontend devem estar `Up`; `http://localhost:3000` deve responder HTTP 200.

## Build local

```powershell
cd backend
npm.cmd run build

cd ../frontend
npm.cmd run lint
npm.cmd run build
```

## Verificação completa

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify.ps1
```

Esse comando não executa scrapers, IA, SMTP ou candidaturas.

## Alertas Gupy e Indeed

1. Ative alertas oficiais de busca nas contas do candidato.
2. Direcione-os à caixa IMAP dedicada já configurada.
3. O worker aceita somente URLs Gupy/Indeed literalmente presentes no e-mail.
4. Confirme as novas oportunidades em `Discover`; nenhuma candidatura é disparada pelo processo de ingestão.

## Empresas-alvo

Use `/sources` para cadastrar página oficial, ATS, identificador e prioridade. Novos registros nascem desabilitados. Somente Greenhouse, Lever, Ashby, Workable e SmartRecruiters podem ser habilitados para descoberta autônoma; Gupy, Indeed e sites genéricos aparecem como assistidos.

## Demonstração

Siga `docs/DEMO.md`. O banco deve estar em uma porta própria, ter `demo` no nome e nunca reutilizar os arquivos `.env` pessoais.

## Prisma

```powershell
cd backend
npx.cmd prisma validate --schema=src/prisma/schema.prisma
npx.cmd prisma migrate status --schema=src/prisma/schema.prisma
```

O `DATABASE_URL` local deve corresponder às credenciais usadas na criação do volume PostgreSQL.

## Backup

O backup deve ser criado em `backups/`, validado com `pg_restore --list` e nunca versionado.

## Recuperação

1. Parar o backend para evitar escrita concorrente.
2. Confirmar o arquivo e sua integridade.
3. Restaurar primeiro em banco temporário.
4. Executar smoke tests.
5. Somente então restaurar no banco principal, com autorização explícita.

## Incidente

- Pausar o backend.
- Preservar logs e estado do banco.
- Não apagar containers ou volumes.
- Documentar horário, sintoma, impacto e correção.
