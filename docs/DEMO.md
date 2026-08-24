# Demonstracao segura

O modo de demonstracao deve provar o produto sem expor o curriculo, e-mail, historico ou credenciais do proprietario.

## Regra de isolamento

- use um banco separado chamado `job_hunter_demo`;
- nunca copie `.env`, dumps ou registros do ambiente pessoal;
- use empresas, pessoas, mensagens e URLs ficticias;
- mantenha `DRY_RUN=true`, conectores externos desabilitados e SMTP/IMAP ausentes;
- a extensao pode ser mostrada apenas em uma pagina HTML local de teste, sem envio final.

## Historia da demonstracao

1. `Discover`: oportunidades ficticias chegam de fontes diferentes e sao deduplicadas.
2. `Career DNA`: somente fatos marcados como aprovados alimentam a IA.
3. `Today`: o funil e as proximas acoes ficam visiveis.
4. `Action Center`: a pessoa revisa dados e confirma a candidatura assistida.
5. `Materials`: cada curriculo e mensagem possui versao e hash.
6. `Inbox` e `Interviews`: uma resposta ficticia avanca o processo e prepara evidencias STAR.

## Preparacao reproduzivel

```powershell
docker compose -f docker-compose.demo.yml up -d postgres_demo
$env:DATABASE_URL="postgresql://demo:demo_local_only@localhost:5433/job_hunter_demo?schema=public"
npm.cmd --prefix backend exec prisma migrate deploy -- --schema=src/prisma/schema.prisma
$env:DEMO_DATABASE_URL=$env:DATABASE_URL
npm.cmd --prefix backend run demo:seed
```

O seed e idempotente e recusa bancos remotos ou bancos cujo nome nao contenha `demo`. Para visualizar a demonstracao, inicie o frontend com essa `DATABASE_URL` em um processo separado. Nao altere os `.env` pessoais.

Com o frontend demo em `http://localhost:3001`, capture as telas públicas com `npm.cmd --prefix backend run demo:screenshots`. O capturador também recusa hosts não locais.

Para validar as imagens de produção sem substituir a V1, use `docker compose -f docker-compose.demo.yml up -d --build backend_demo frontend_demo`. O dashboard ficará em `http://localhost:3002`; todas as flags externas do worker demo são fixadas em `false` pelo Compose.

## Checklist antes de gravar ou apresentar

- confirme visualmente que nenhum e-mail, telefone ou URL real aparece;
- procure por formatos de segredo com `scripts/verify.ps1`;
- execute builds e testes offline;
- abra a demonstracao em janela anonima;
- nao conecte Gmail, LinkedIn, Gupy, Indeed ou OpenRouter.
