# Estratégia de Testes

## Pirâmide

- Unitários: parsers, normalização, score, URLs, e-mails e deduplicação.
- Contrato: conectores usando fixtures HTML versionadas.
- Integração: Prisma em banco de teste, ledger e transações.
- E2E: dashboard e Action Center com dados fictícios.
- Smoke: containers, APIs, worker e migrações.

## Regras

- Nenhum teste envia e-mail real.
- Nenhum teste submete candidatura real.
- Nenhum teste depende de conta autenticada em plataforma de vagas.
- Testes de scraper público devem ter fixtures para não depender apenas da internet.
- Falhas externas devem ser simuladas: timeout, bloqueio, HTML alterado e resposta inválida da IA.

## Gate por mudança

- Backend: TypeScript + testes relevantes.
- Frontend: ESLint + TypeScript/build + E2E relevante.
- Prisma: validate + migration em banco de teste + client generate.
- Docker: build + health + HTTP smoke.

## Smoke Docker isolado

`docker-compose.demo.yml` constrói as imagens reais de backend/frontend contra o banco fictício. O worker recebe `DRY_RUN=true` e todas as flags `ENABLE_*` em `false`; os logs devem mostrar um ciclo com duração mínima e nenhuma etapa externa. O frontend demo responde em `127.0.0.1:3002`.

## Integração PostgreSQL

```powershell
powershell -ExecutionPolicy Bypass -File scripts/test-integration.ps1
```

O script cria um banco temporário, aplica o schema, testa concorrência/deduplicação e remove o banco ao final.
