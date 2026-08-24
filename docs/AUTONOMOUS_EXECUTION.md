# Protocolo de Execução Autônoma

## Autorização permanente deste projeto

O agente pode ler, editar, compilar, testar, migrar e reconstruir os serviços locais necessários para cumprir o `CHECKLIST.md`, desde que preserve dados e respeite os limites abaixo.

## Ações permitidas sem nova confirmação

- alterações reversíveis no workspace;
- instalação de dependências necessárias ao item atual;
- lint, build, testes e validação Prisma;
- migrations aditivas após backup verificável;
- reconstrução de containers de teste ou demonstração;
- scraping de páginas públicas com limites responsáveis;
- uso de dados fictícios em testes;
- atualização do checklist e relatório de progresso.

## Ações proibidas durante execução autônoma

- enviar candidaturas reais como teste;
- enviar mensagens ou follow-ups reais como teste;
- excluir vagas, candidaturas, e-mails ou documentos materiais;
- executar migration destrutiva sem autorização específica;
- armazenar senhas ou cookies no código, documentação ou logs;
- contornar CAPTCHA, MFA, rate limits ou proteção anti-bot;
- criar contas, contratar serviços ou gerar custos não autorizados;
- inventar informações profissionais.
- recriar o worker operacional com ações reais habilitadas sem autorização explícita;

O container operacional só pode ser reconstruído autonomamente quando `DRY_RUN=true` e todas as saídas externas estiverem desabilitadas. Caso contrário, build local e containers isolados devem ser usados para validação.

## Procedimento por item

1. Ler requisitos e dependências.
2. Registrar o item como em andamento em `docs/PROGRESS.md`.
3. Criar backup quando houver risco para dados.
4. Implementar a menor mudança completa.
5. Executar validações proporcionais ao risco.
6. Registrar evidências objetivas.
7. Marcar `[x]` somente se o critério de aceite passou.
8. Se falhar, manter `[ ]`, documentar o bloqueio e continuar apenas em tarefas independentes.

## Definição de concluído

Código gravado, tipado, sem `any`, lint/build aprovados, migrations sincronizadas quando aplicável, teste relevante aprovado, documentação atualizada e V1 saudável.
