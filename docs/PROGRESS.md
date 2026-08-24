# Diário de Progresso

## 2026-08-24 - E2E responsivo da experiência renovada

- Item: 17.12; gate da Fase 17.
- Mudanças: jornada Playwright atualizada para autenticação; cobertura do portfólio público, Visão geral, Vagas, detalhes, revisão e Competências; auditoria automática de overflow horizontal em 390 px; capturador de screenshots adaptado à sessão; Compose demo e GitHub Actions receberam credenciais exclusivamente fictícias; screenshot mobile adicionado.
- Validações: E2E passou no ambiente operacional local e novamente no PostgreSQL/frontend demo isolados; desktop 1440 × 1000 e celular 390 × 844; nenhuma ação externa; build backend aprovado; inspeção visual das capturas desktop e mobile; containers demo parados ao final, com volume fictício preservado.
- Resultado: a nova experiência em português possui regressão automatizada local/CI e se mantém legível sem overflow horizontal nos principais fluxos.
- Riscos/Pendências: o workflow ainda precisa da primeira execução em um repositório GitHub real; testes visuais são evidência, não comparação automática por pixel.

## 2026-08-24 - Portfólio público sanitizado

- Item: 17.11.
- Mudanças: rota estática `/portfolio` liberada pelo proxy sem liberar qualquer página/API operacional; fonte pública isolada em `frontend/src/content/portfolio.ts`; apresentação profissional, diferenciais de gestão, arquitetura, decisões de segurança, stack e demonstração marcada como fictícia; metadata própria; link separado para a área privada; screenshot público incorporado ao README.
- Validações: ESLint e build Next.js aprovados; imagem Docker reconstruída; acesso sem sessão retornou 200; `/today` sem sessão continuou redirecionando para login; conteúdo esperado foi confirmado; nenhum valor sensível encontrado nos `.env` apareceu no HTML; página não importa Prisma, perfil do candidato ou ambiente; screenshot desktop capturado e inspecionado visualmente.
- Resultado: o projeto agora possui uma vitrine profissional compartilhável sem expor o funcionamento ou os dados privados do Job Hunter OS.
- Riscos/Pendências: links e fatos públicos permanecem intencionais no arquivo sanitizado e devem ser revisados antes de publicação; falta concluir o E2E responsivo do fluxo renovado no item 17.12.

## 2026-08-24 - Revisão unificada e rascunho seguro

- Item: 17.10.
- Mudanças: rota `/revisao/[id]` reúne decisão, canal, candidatura e última versão de cada material; criação idempotente de rascunho interno; edição textual gera nova versão; currículos binários são visualizados sem sobrescrita; conclusão da revisão muda somente `DRAFT` para `MANUAL_ACTION`, cria evento auditável e informa explicitamente que nenhum envio ocorreu; mutações validam mesma origem.
- Validações: ESLint e build Next.js aprovados; imagem Docker reconstruída; cenário sintético isolado criou rascunho (201), abriu revisão (200), criou segunda versão de material (201), concluiu revisão (200), confirmou status `MANUAL_ACTION`, duas versões e dois eventos; candidatura, oportunidade e empresa temporárias foram removidas ao final.
- Resultado: análise, materiais e decisão humana agora ficam numa única tela, sem ampliar autorização para IA, SMTP ou plataformas externas.
- Riscos/Pendências: materiais precisam existir para serem revisados; geração por IA continua dependente do modo PREPARE e de autorização separada. A próxima etapa é a área pública de portfólio sanitizada.

## 2026-08-24 - Detalhamento da vaga e matriz de evidências

- Item: 17.9.
- Mudanças: nova rota autenticada `/discover/[id]`; cards de vagas ganharam acesso aos detalhes; página reúne fontes, descrição, localização, salário, decisão explicável, pontos fortes, lacunas, riscos, estratégia, candidatura existente e matriz de requisitos essenciais/desejáveis contra competências, projetos, certificações e resultados aprovados.
- Validações: ESLint e build Next.js aprovados; frontend Docker reconstruído; lista de vagas respondeu 200; uma oportunidade real existente foi aberta em modo somente leitura e respondeu 200; matriz, descrição e aviso de uso exclusivo de fatos aprovados foram confirmados no HTML.
- Resultado: cada recomendação pode ser auditada antes de preparar uma candidatura. Ausência de evidência é exibida como ausência de prova cadastrada, sem afirmar que o candidato não possui a habilidade.
- Riscos/Pendências: associação é determinística por tecnologia e palavras relevantes, portanto continua sujeita a revisão humana; a próxima etapa reunirá vaga, materiais e aprovação em uma revisão única.

## 2026-08-24 - Gestão de competências e tradução secundária

- Itens: 17.7 e 17.8.
- Mudanças: Pendências, Currículos e mensagens, Mensagens, Sala de entrevistas, Meu perfil e login receberam linguagem de produto em português; estados técnicos ganharam rótulos legíveis; o painel de Competências passou a cadastrar, editar, validar e remover stacks e certificações usando a API factual existente.
- Validações: ESLint e build Next.js aprovados; frontend Docker reconstruído; CRUD temporário de competência passou por criação 201, edição 200, aprovação 200 e remoção 204; certificação repetiu o mesmo fluxo; registros de teste foram removidos em bloco `finally`; painel autenticado respondeu 200.
- Resultado: futuras competências e certificações podem ser mantidas diretamente no painel sem editar código, e alterações voltam ao estado de revisão para impedir uso não aprovado pela IA.
- Riscos/Pendências: a próxima etapa é a página detalhada da vaga com matriz requisito × evidência; nomes técnicos internos e logs de desenvolvimento permanecem em inglês quando fazem parte de contratos de código, não da interface.

## 2026-08-24 - Visão geral e painel de competências

- Itens: 17.1 a 17.6.
- Mudanças: menu principal reduzido para seis áreas em português; rota raiz redirecionada para a Visão geral; dashboard reorganizado em modo seguro, prioridades, melhores oportunidades, atividade, entrevistas e evolução; painel de Competências ligado a skills, projetos aprovados, certificações e descrições reais das vagas; lacunas passam a significar ausência de evidência, não uma nota subjetiva inventada.
- Validações: ESLint e build Next.js aprovados; imagem Docker reconstruída; login local retornou 200; Visão geral autenticada retornou 200 e conteúdo em português; Competências retornou 200 e exibiu métricas do banco.
- Resultado: a jornada principal ficou mais simples e orientada ao objetivo de gerar entrevistas, e novas certificações continuam podendo ser cadastradas pelo Meu perfil sem alteração de código.
- Riscos/Pendências: telas secundárias ainda possuem alguns termos em inglês; o cadastro dedicado dentro de Competências, a matriz vaga × evidência, a revisão unificada e o portfólio público continuam nas próximas partes.

## 2026-08-24 - Autenticacao privada do Command Center

- Itens: avancado o gate 16.8; permanece aberto ate HTTPS/reverse proxy e protecoes de VPS.
- Mudancas: login de proprietario unico; sessao HMAC com expiracao de 12 horas; cookie `HttpOnly` e `SameSite=Strict`; proxy protegendo paginas e APIs; validacao de mesma origem em login/logout; atraso em senha invalida; logout na navegacao; credenciais obrigatorias e mantidas somente no `.env` privado.
- Validacoes: ESLint e build Next.js aprovados; imagem frontend reconstruida; acesso anonimo a pagina redireciona para login (307); API anonima retorna 401; senha incorreta retorna 401; login retorna 200; API autenticada retorna 200; logout invalida a sessao e a API volta a retornar 401.
- Resultado: dashboard e APIs nao ficam mais acessiveis anonimamente no ambiente local. A autenticacao nao altera os kill switches nem autoriza candidaturas.
- Riscos/Pendencias: senha temporaria local deve ser trocada; faltam rate limiting persistente, reverse proxy, HTTPS e politica de segredos para deploy publico.

## 2026-08-24 - Auditoria de seguranca, qualidade e publicacao

- Itens: auditoria transversal do workspace; nenhum gate externo ou dependente do proprietario foi marcado como concluido.
- Mudancas: documentacao voltou a ser versionavel; seed pessoal foi excluido do Git; exemplos de ambiente foram sanitizados e alinhados ao modo fail-closed; portas Docker foram limitadas a `127.0.0.1`; senha do PostgreSQL passou a ser obrigatoria; frontend recebeu cabecalhos de seguranca; CI passou a executar os testes PostgreSQL; scanner passou a detectar chaves Groq; retries e timeouts de transacao foram reforcados nos repositorios de candidaturas e materiais.
- Validacoes: quality gate completo aprovado; 76 testes offline aprovados; 6 testes PostgreSQL aprovados em tres execucoes consecutivas; backend, frontend e extensao compilados; ESLint aprovado; 12 migrations sincronizadas; auditoria npm de producao sem vulnerabilidades nos dois projetos; cobertura de `39,01%` de statements; imagens Docker reconstruidas; frontend respondeu HTTP 200; Postgres, Adminer e frontend confirmados somente em localhost; worker confirmado em `DRY_RUN=true`, `OBSERVE`, kill switch ativo, e-mail/IMAP/processamento desativados.
- Resultado: ambiente local esta consistente e seguro para descoberta/demonstracao. O ciclo encontrou e persistiu fontes GitHub e LinkedIn sem acionar IA, e-mail ou candidatura.
- Riscos/Pendencias: o diretorio ainda nao e um repositorio Git, portanto o workflow remoto nunca executou; dashboard/API ainda nao possuem autenticacao; senha local do PostgreSQL deve ser rotacionada antes de VPS; SMTP/IMAP, modo PREPARE e envio controlado continuam pendentes; alguns detalhes do LinkedIn ficam indisponiveis por timeout/bloqueio publico; cobertura deve crescer nos adapters e no worker.

## 2026-08-23 - Quality gate pre-go-live completo

- Item: 16.12 e verificacao transversal antes dos testes externos.
- Mudancas: retry serializavel de `saveOpportunity` recebeu backoff exponencial com jitter e limite ampliado; `backend/.env` passou a declarar explicitamente o modo fail-closed; imagens operacionais foram publicadas com override DISCOVERY.
- Validacoes: scanner de segredos; Prisma; 76 testes offline; seis integracoes PostgreSQL repetidas em tres rodadas; builds backend/frontend/extensao; ESLint; sete smokes HTTP; 12 migrations; auditoria 170/170; E2E ficticio Today/Discover/Sources/Pipeline; backup `job-hunter-pre-go-live-20260823.dump` restaurado e auditado em banco temporario; SHA-256 `5CA8291986FA10486A0F8B42CF70564E84BD0527885396FB07C382B73807B4B8`.
- Resultado: frontend e backend atuais estao operacionais; preflight local passa com DRY_RUN, OBSERVE, kill switch e limite zero; nenhum e-mail, IA em lote ou candidatura ocorreu.
- Riscos/Pendencias: LinkedIn deixou duas descricoes publicas indisponiveis; Bluelight retornou 816 anuncios e permanece desabilitada; SMTP/IMAP real, protecao para VPS e um envio controlado continuam gates separados.

## 2026-08-23 - Sugestoes de empresas-alvo

- Item: 10.11 permanece aberto ate revisao do proprietario.
- Mudancas: CI&T, Bluelight Consulting e Oowlish cadastradas de forma idempotente como fontes Lever, todas com `enabled=false`, prioridade e justificativa de aderencia.
- Validacoes: paginas oficiais publicas confirmadas; script compilado; tres registros persistidos desabilitados; 76 testes offline aprovados.
- Resultado: sugestoes aparecem em Sources sem gerar consultas automaticas ou ampliar o escopo operacional.
- Riscos/Pendencias: ativacao depende de aprovacao do proprietario; senioridade e disponibilidade variam e continuarao sujeitas ao ranking factual.

## 2026-08-23 - Respostas operacionais aprovadas

- Item: respostas pessoais aprovadas para perguntas recorrentes.
- Mudancas: disponibilidade imediata, autorizacao de trabalho no Brasil sem patrocinio, aceite de mudanca e disponibilidade de viagens conforme necessidade foram registradas com aliases em portugues e ingles.
- Validacoes: respostas persistidas como fatos aprovados; perguntas sensiveis permanecem ausentes e nao podem ser inferidas pela extensao ou IA.
- Resultado: biblioteca recorrente concluida para os campos operacionais comuns de candidatura.
- Riscos/Pendencias: PCD, raca, genero, orientacao e demais dados demograficos permanecem sempre manuais e opcionais.

## 2026-08-23 - Biblioteca factual de respostas recorrentes

- Item: fundacao das respostas pessoais aprovadas; dependencia permanece aberta para perguntas subjetivas.
- Mudancas: 12 respostas idempotentes aprovadas para telefone, localizacao, modalidade, pretensao, experiencia, headline e resumo profissional, incluindo aliases normalizados usados por formularios.
- Validacoes: todas as 12 chaves estao aprovadas no PostgreSQL; backend compilado e 76 testes offline aprovados.
- Resultado: materiais e preenchimento assistido podem reutilizar respostas factuais sem inferencia da IA.
- Riscos/Pendencias: disponibilidade de inicio, autorizacao de trabalho, mudanca, viagens, PCD, diversidade e outras respostas pessoais continuam sem resposta e exigirao decisao do proprietario.

## 2026-08-23 - Contato e localizacao no Career DNA

- Itens: curriculo factual e dados pessoais do proprietario.
- Mudancas: `CandidateProfile` recebeu telefone e localizacao; migration aditiva aplicada; Prisma Clients sincronizados; API de perfil passou a validar contato e URLs; Career DNA recebeu editor de identidade profissional; curriculos ATS e visual agora usam telefone/localizacao do candidato em vez da localizacao da vaga.
- Validacoes: telefone e localizacao confirmados foram persistidos sem replica-los na documentacao publica; 12 migrations sincronizadas; 76 testes offline; builds backend/frontend e ESLint aprovados.
- Resultado: perfil factual e canais profissionais podem ser revisados pela interface e entram corretamente nos materiais gerados.
- Riscos/Pendencias: containers operacionais ainda usam a imagem anterior ate o proximo deploy controlado; respostas recorrentes e empresas-alvo continuam pendentes.

## 2026-08-23 - Auditoria factual do Career DNA

- Item: dependencias factuais do proprietario; itens permanecem abertos ate confirmacao humana.
- Mudancas: nenhuma informacao pessoal foi alterada e nenhum dado foi enviado a provedor externo.
- Validacoes: 2 experiencias, 4 projetos, 15 skills, 2 formacoes, 3 idiomas e 3 evidencias estao aprovados; curriculo importado esta `REVIEWED`; preferencias registram Junior, CLT/PJ, remoto no Brasil e hibrido em Recife/Maceio.
- Resultado: base profissional suficiente para revisao, mas foram encontrados e-mail do perfil divergente do `.env`, LinkedIn ausente, zero respostas recorrentes, zero bloqueios, datas de formacao ausentes e tres metricas sem fonte associada.
- Riscos/Pendencias: correcao exige confirmacao do proprietario; certificacoes podem legitimamente permanecer vazias; `anos_experiencia=2` deve ser distinguido dos nove anos de gestao descritos na experiencia.

## 2026-08-23 - Confirmacao factual do proprietario

- Itens: experiencias, projetos, resultados e preferencias pessoais do checklist do proprietario.
- Mudancas: e-mail e LinkedIn corrigidos; inicio da experiencia Full Stack ajustado para junho de 2025; Engenharia de Software iniciada em janeiro de 2026; Formacao Full Stack DevClub concluida em outubro de 2025 e registrada tambem como certificacao; experiencia tecnica normalizada para um ano completo.
- Validacoes: o PDF fornecido confirmou quatro aplicacoes em producao, reducao de 30% no atendimento, reducao aproximada de 70% na publicacao e nove anos anteriores em gestao; persistencia conferida no PostgreSQL; backend compilado e 76 testes offline aprovados.
- Resultado: fatos profissionais e preferencias essenciais estao aprovados sem inferir dados ausentes.
- Riscos/Pendencias: telefone e localizacao existem no curriculo, mas ainda nao possuem campos no perfil; respostas recorrentes e empresas-alvo permanecem pendentes.

## 2026-08-23 - Convergencia completa do historico legado

- Item: 16.4.
- Mudancas: migracao legada restringida de forma idempotente a registros `Job` sem `Opportunity`; a unica vaga residual do canario estrangeiro do LinkedIn foi vinculada sem criar candidatura.
- Validacoes: backend compilado; migracao reportou 1 vaga vinculada e 0 candidaturas; auditoria confirmou 170/170 vagas vinculadas, 170 oportunidades, 170 fontes e zero grupos de candidaturas duplicadas; 76 testes offline aprovados.
- Resultado: nao existe mais divergencia estrutural entre o historico `Job` e o dominio `Opportunity`; a vaga residual permaneceu `IGNORADO`.
- Riscos/Pendencias: os campos legados continuam disponiveis durante a transicao, mas todo registro atual possui proveniencia e vinculo no dominio novo.

## 2026-08-23 - Inicio do go-live controlado

- Itens: 16.1, 16.2 e 16.3.
- Mudancas: preflight sem exposicao de segredos; modos OBSERVE/PREPARE/AUTO_EMAIL; kill switch; autorizacao externa explicita; limite diario; score minimo; allowlist; override Docker de observacao.
- Validacoes: 65 testes offline aprovados e backend compilado; preflight conectou ao PostgreSQL e confirmou as travas de envio.
- Resultado: envio automatico agora exige todas as autorizacoes simultaneamente e o padrao permanece fail-closed.
- Riscos/Pendencias: Career DNA possui zero skills aprovadas, nao ha preferencias nem empresas-alvo habilitadas; o `.env` privado tem DRY_RUN=false, portanto o deploy deve usar obrigatoriamente `docker-compose.observe.yml`.

## 2026-08-23 - Deploy operacional em observacao

- Item: 16.9.
- Mudancas: backend e frontend recriados com o codigo atual por meio de `docker-compose.observe.yml`.
- Validacoes: imagens construidas sem vulnerabilidades reportadas; PostgreSQL saudavel; backend iniciou com `dryRun=true`, concluiu ciclo de 0 ms sem etapas externas; `/today` respondeu HTTP 200.
- Resultado: o codigo novo esta operacional, mas IA, IMAP, scrapers, processamento e follow-ups permanecem desligados.
- Riscos/Pendencias: ativacao funcional depende da revisao factual do Career DNA, preferencias e fontes; nenhuma candidatura real foi executada.

## 2026-08-23 - Career DNA aplicado do curriculo

- Itens: dependencias factuais do proprietario parcialmente concluidas.
- Mudancas: 15 skills, 2 experiencias, 4 projetos, 2 formacoes, 3 idiomas e 3 evidencias aprovados a partir do curriculo importado; preferencias de cargo, stack, senioridade e contrato cadastradas; importacao marcada como revisada.
- Validacoes: script idempotente compilado; 65 testes offline aprovados; preflight operacional passou sem bloqueios.
- Resultado: a IA agora possui base factual aprovada e preferencias minimas para preparar materiais.
- Riscos/Pendencias: localidade, modalidade de trabalho, empresas-alvo, bloqueios e respostas pessoais continuam sem definicao; skills classificadas conservadoramente como nivel basico porque o curriculo nao declara nivel formal.

## 2026-08-23 - Primeiro ciclo PREPARE

- Itens: 16.7 para o conector habilitado e 16.10.
- Mudancas: preferencias regionais persistidas; backend iniciado com GitHub ativo, LinkedIn/ATS/IMAP desligados, DRY_RUN e kill switch ativos.
- Validacoes: GitHub descobriu e enriqueceu 24 referencias em 24,7 segundos; todas ja pertenciam ao historico IGNORADO, portanto zero vagas novas foram enviadas para IA; ciclo encerrou sem erro.
- Resultado: o worker permanece executando a cada tres horas e novas URLs do GitHub entrarao em PREPARE, sem envio externo.
- Riscos/Pendencias: a mensagem `persistidas` do conector representa referencias processadas, inclusive ja existentes; LinkedIn ainda requer canario separado.

## 2026-08-23 - Canary LinkedIn Brasil

- Itens: calibracao da fonte LinkedIn na Fase 16.5 e canario da Fase 16.7.
- Mudancas: geoId oficial do Brasil, filtro defensivo de localidade, janela de sete dias, limite de dez resultados, retry para navegacao e comando isolado de canario.
- Validacoes: primeira execucao estrangeira interrompida e 39 registros colocados em IGNORADO; segunda execucao descobriu 10 vagas brasileiras, enriqueceu/processou 10 e terminou sem erro; 73 testes offline aprovados.
- Resultado: LinkedIn pode entrar em PREPARE com volume limitado e sem submissao.
- Riscos/Pendencias: duas de dez descricoes nao ficaram publicamente acessiveis e devem permanecer para revisao manual.

## 2026-08-23 - Contrato de IA e circuit breaker

- Item: conclusao de 16.5 e hardening operacional.
- Mudancas: respostas JSON solicitadas ao OpenRouter, limite ampliado para analise explicavel, parser tolerante a fences/prosa, erro tipado para HTTP 402/429 e pausa imediata do lote; modo DISCOVERY criado.
- Validacoes: primeira vaga analisada com sucesso (score 68, REVISAR); provedor retornou 402 por limite de creditos em voo; backend pausado e republicado com processamento de IA desligado; 74 testes offline aprovados.
- Resultado: GitHub e LinkedIn continuam descobrindo vagas, mas nenhuma nova chamada de IA ou envio ocorre ate regularizacao do provedor.
- Riscos/Pendencias: proprietario precisa revisar creditos/limite do OpenRouter antes de retornar ao PREPARE; vagas pendentes foram preservadas.

## 2026-08-23 - Suporte multi-provider com Groq

- Mudancas: `AI_PROVIDER` seleciona Groq ou OpenRouter; cliente HTTP compartilhado; Groq usa Chat Completions oficial e JSON mode; modelo/provedor persistidos corretamente; validacao exige a chave do provedor selecionado.
- Validacoes: 76 testes offline e build aprovados; imagem publicada em DISCOVERY; preflight confirmou `ai-provider=groq` e chave ausente sem executar chamada externa.
- Resultado: sistema pronto para receber `GROQ_API_KEY` e usar `openai/gpt-oss-20b`; OpenRouter permanece como rollback.
- Riscos/Pendencias: Groq ainda nao foi chamada porque a chave privada nao esta configurada; processamento continua desligado.

## 2026-08-23 - Canary real Groq autorizado

- Mudancas: nenhuma alteracao de dados; execucao unica do contrato real de avaliacao.
- Validacoes: Groq analisou uma vaga com Career DNA aprovado, retornou JSON valido, decisao IGNORAR, score 20 e descricao suficiente; vaga permaneceu PENDENTE, sem score/justificativa persistidos e sem nova candidatura.
- Resultado: autenticacao, modelo, prompt completo, JSON mode e parser foram validados ponta a ponta.
- Riscos/Pendencias: processamento em lote permanece desligado e exige autorizacao operacional separada.

## Estado atual

- Produto: pessoal, não SaaS.
- V1: operacional em Docker.
- Próxima fase: proteção e testes da V1.
- Ações reais em testes: desativadas por política.

## Registro

### 2026-08-23 — Fundação documental

- Criado protocolo de execução autônoma.
- Documentada arquitetura atual e alvo.
- Documentadas segurança, operação e estratégia de testes.
- Identificada documentação antiga corrompida e inconsistente.
- Identificada ausência de repositório Git no workspace.
- Pendente: backup verificável, baseline automatizado e checklist pessoal revisado.

### 2026-08-23 — Backup da V1

- Item: 7.1.
- Mudanças: criado `backups/job-hunter-v1-20260823.dump`; diretório protegido pelo `.gitignore`.
- Validações: catálogo lido por `pg_restore --list`; formato custom PostgreSQL 15; 25 entradas.
- Resultado: backup válido, 126081 bytes, SHA-256 `F57F7D598FC3083AC332460BA5CCC9F2A610921FD206FA3C20DF3E866690D5C8`.
- Riscos/Pendências: restauração no banco principal exige autorização específica; o procedimento está no runbook.

### 2026-08-23 — Verificador do projeto

- Item: 7.3.
- Mudanças: criado `scripts/verify.ps1` e documentado no runbook.
- Validações: Compose config, Prisma validate, build TypeScript do backend, ESLint e build do frontend, HTTP 200.
- Resultado: todas as etapas passaram; o comando finalizou com `[VERIFY] OK`.
- Riscos/Pendências: testes automatizados e modo `DRY_RUN` ainda não existem; gate da Fase 7 permanece aberto.

### 2026-08-23 — Testes seguros e configuração tipada

- Itens: 7.4, 7.6 e 7.8.
- Mudanças: Zod para ambiente, Vitest, parser puro de análise, fixtures GitHub/LinkedIn e testes DOM com Chromium.
- Validações: backend TypeScript aprovado; 3 arquivos de teste e 12 testes aprovados.
- Resultado: testes não acessam fontes externas nem executam SMTP, IMAP, IA ou candidaturas.
- Riscos/Pendências: integração do banco, validação Docker de `DRY_RUN` e divergência da URL local ainda pendentes.

### 2026-08-23 — DRY_RUN e feature flags

- Item: 7.7.
- Mudanças: `DRY_RUN`, flags de IMAP, GitHub, LinkedIn e processamento; bloqueio SMTP no início da função.
- Validações: container efêmero com todas as flags desativadas; tentativa para domínio inválido retornou `false` e registrou bloqueio local sem conexão.
- Resultado: ações externas podem ser desabilitadas de forma determinística em testes.
- Riscos/Pendências: o ambiente operacional mantém ações reais habilitadas; mudanças futuras devem executar testes com `DRY_RUN=true`.

### 2026-08-23 — Deduplicação concorrente

- Item: 7.5.
- Mudanças: repositório central `saveDiscoveredJob`, tratamento de `P2002`, backfill atômico e script de banco temporário.
- Validações: schema aplicado em `jobhunter_integration_test`; 8 gravações concorrentes resultaram em 1 registro; backfill preservou `IGNORADO`; banco temporário removido.
- Resultado: 2 testes de integração aprovados.
- Riscos/Pendências: a V2 ainda precisará deduplicar a mesma oportunidade publicada em URLs diferentes.

### 2026-08-23 — Banco local sincronizado

- Item: 7.9.
- Mudanças: corrigida somente a `DATABASE_URL` do `backend/.env` para corresponder ao Postgres local do Compose.
- Validações: `prisma migrate status` encontrou 3 migrations e informou schema atualizado.
- Resultado: comandos Prisma locais não exigem mais override temporário.
- Riscos/Pendências: credenciais de desenvolvimento devem ser trocadas antes de qualquer deploy público.

### 2026-08-23 — Gate da Fase 7 aprovado

- Item: 7.10 e gate da Fase 7.
- Validações: verificador completo aprovado; 12 testes unitários/offline; 2 testes PostgreSQL isolados; Postgres healthy; frontend HTTP 200.
- Restauração: backup restaurado em `jobhunter_restore_test`; contagens `109 jobs`, `1 candidate_profile`, `0 email_logs`, `3 migrations`; banco temporário removido.
- Resultado: V1 protegida, verificável e recuperável. Fase 8 liberada.
- Riscos/Pendências: a nova imagem do backend não foi aplicada ao worker operacional porque reiniciá-lo habilitaria ações reais; desenvolvimento seguirá validado fora do serviço ativo até autorização de deploy.

### 2026-08-23 — Modelagem do Career DNA

- Itens: 8.1, 8.3, 8.4 e 8.5.
- Mudanças: 8 novas entidades factuais, 3 enums, relações em `CandidateProfile` e migration `20260823060743_add_career_dna`.
- Validações: schemas backend/frontend válidos; migration aplicada; clients gerados; backend build/test e frontend build aprovados.
- Resultado: base vazia e aditiva; nenhum fato profissional foi inventado ou aprovado automaticamente.
- Riscos/Pendências: resultados ainda precisam de evidência estruturada; APIs e interface ainda pendentes.

### 2026-08-23 — Career DNA factual e barreira anti-alucinação

- Itens: 8.2, 8.6, 8.9 e 8.10.
- Mudanças: entidade `CareerEvidence`; migration `20260823061359_add_career_evidence`; API Zod para fatos, evidências, bloqueios, respostas e preferências; contexto de IA consultando somente registros `approved=true`; prompts sem alegações biográficas fixas.
- Validações: migration aplicada; Prisma Clients regenerados; backend compilado; 14 testes aprovados; frontend ESLint e build de produção aprovados.
- Resultado: fatos novos entram pendentes e dados não aprovados não são enviados ao OpenRouter; contexto vazio permanece vazio nos testes.
- Riscos/Pendências: a interface permite criar, revisar, aprovar e remover, mas edição completa de todos os fatos ainda precisa ser concluída antes do item 8.7; importação do currículo depende de extração e revisão humana.

### 2026-08-23 — Interface de revisão do Career DNA

- Item: 8.7.
- Mudanças: página `/career-dna`, editor de preferências, criação, edição, aprovação, retirada de aprovação e remoção de fatos; edições invalidam a aprovação anterior.
- Validações: ESLint sem alertas e build Next.js de produção aprovado, incluindo rota dinâmica `/api/career-dna` e página estática `/career-dna`.
- Resultado: o proprietário possui um fluxo visual explícito para revisar a base factual antes do uso pela IA.
- Riscos/Pendências: a imagem Docker operacional não foi recriada, pois o worker atual possui ações reais habilitadas; o código foi validado sem reiniciar serviços.

### 2026-08-23 — Importação segura do currículo e gate da Fase 8

- Item: 8.8 e gate da Fase 8.
- Mudanças: `ResumeImport`, hash SHA-256 idempotente, extração local por PDF, separação de seções e estado obrigatório `PENDING_REVIEW`; currículo atual importado no banco.
- Validações: migration `20260823062333_add_resume_imports`; 15 testes aprovados; backend compilado; frontend ESLint e build de produção aprovados.
- Resultado: o PDF do proprietario foi armazenado como importacao pendente no banco privado; nenhum fato foi criado ou aprovado automaticamente.
- Riscos/Pendências: o proprietário deverá converter e aprovar os fatos pela tela Career DNA; até isso ocorrer, a IA omite alegações não aprovadas.

### 2026-08-23 — Domínio Opportunity e gate da Fase 9

- Itens: 9.1 a 9.12.
- Mudanças: `Company`, `Opportunity`, `JobSource`, `Requirement`, `Application`, `ApplicationEvent` e `GeneratedMaterial`; normalização, URL canônica, fingerprint SHA-256, dual-write dos scrapers e agrupamento visual de fontes.
- Validações: migration `20260823062617_add_opportunity_domain`; 4 testes PostgreSQL; duas fontes convergiram em uma oportunidade; 8 operações concorrentes produziram uma candidatura e um evento; backend e frontend compilados; ESLint aprovado.
- Resultado: 109/109 vagas históricas vinculadas de forma idempotente, 109 oportunidades, 109 fontes, 87 empresas, zero grupos de candidaturas duplicadas.
- Riscos/Pendências: similaridade semântica foi deliberadamente adiada até existir evidência de falsos negativos; o modelo determinístico é auditável e suficiente para o conjunto atual.

### 2026-08-23 — Fundação da plataforma de conectores

- Itens: 10.1, 10.2 e 10.3.
- Mudanças: contrato `JobSourceConnector`, executor padronizado com health check e retry exponencial, métricas persistidas em `ConnectorRun` e fila PostgreSQL com lease, backoff e dead-letter (`DEAD`).
- Validações: migration `20260823063323_add_connector_queue`; 18 testes locais; 5 testes PostgreSQL, incluindo 8 workers concorrendo pelo mesmo item e somente um claim bem-sucedido.
- Resultado: novas fontes podem compartilhar descoberta, enriquecimento, normalização, observabilidade e processamento resiliente.
- Riscos/Pendências: GitHub e LinkedIn ainda usam seus entrypoints legados e serão adaptados ao contrato antes de adicionar Gupy/Indeed.

### 2026-08-23 — GitHub e LinkedIn no contrato comum

- Itens: 10.4 e 10.5.
- Mudanças: `GithubConnector` e `LinkedinConnector`, ciclo de vida explícito do navegador, health check, discovery/enrich separados, executor com dual-write para preservar o dashboard V1.
- Validações: backend compilado e 18 testes offline aprovados; parsers continuam cobertos por fixtures locais.
- Resultado: o runner usa a plataforma comum para GitHub e LinkedIn, mantendo flags e isolamento por fonte.
- Riscos/Pendências: o novo runner não foi implantado no container operacional; isso evita iniciar scraping e candidaturas reais durante desenvolvimento.

### 2026-08-23 — Baseline após Fases 9 e 10 parcial

- Mudanças: documentação de acessos externos e responsabilidades do proprietário.
- Validações: verificador completo aprovado após as migrations; Prisma válido, backend compilado, 18 testes offline, frontend ESLint/build e HTTP local aprovados. Testes de integração separados: 5/5 aprovados.
- Resultado: o workspace permanece saudável com o container operacional antigo intacto.
- Riscos/Pendências: Gupy/Indeed exigem conectores públicos conservadores; a API oficial Gupy para Jobs requer credencial administrativa de cliente e não será tratada como API de candidato.

### 2026-08-23 — Conectores ATS por APIs públicas

- Itens: 10.8, 10.9 e parte de 10.10.
- Mudanças: conectores Greenhouse, Lever, Ashby e SmartRecruiters; configuração por identificador de empresa; descrições completas normalizadas; todos desabilitados por padrão.
- Validações: schemas Zod e fixtures HTTP simuladas para os quatro formatos; 23 testes locais aprovados; backend compilado.
- Resultado: descoberta direta em páginas oficiais de empresas, sem credenciais e sem automação de candidatura.
- Riscos/Pendências: Workable ainda não possui implementação validada; Gupy proíbe agregação em seus termos e Indeed restringe robôs. Esses itens permanecem abertos enquanto é desenhada uma fonte permitida (API licenciada, alerta do usuário ou extensão assistida).

### 2026-08-23 — Gate de decisão explicável

- Itens: 11.1 a 11.8.
- Mudanças: `OpportunityAssessment`, breakdown em seis dimensões, requisitos essenciais/desejáveis, forças, lacunas, riscos, estratégia, três decisões, versão de prompt/modelo/hash de entrada e ranking diário.
- Validações: migration `20260823064520_add_explainable_assessments`; parser Zod com invariantes; dataset local com cenários APLICAR/REVISAR/IGNORAR; 30 testes locais e 5 testes PostgreSQL aprovados; builds backend/frontend e ESLint aprovados.
- Resultado: descrição insuficiente nunca produz APLICAR; a avaliação fica reproduzível e o dashboard mostra decisão, suficiência, primeira força e primeira lacuna.
- Riscos/Pendências: avaliações antigas permanecem apenas nos campos legados; serão recalculadas somente em execução futura autorizada para evitar consumo de IA durante testes.

### 2026-08-23 — Gate de materiais personalizados

- Itens: 12.1 a 12.10.
- Mudanças: seleção determinística por relevância, CV ATS, CV visual sem alegações fixas, e-mail/cover letter/mensagem com contexto aprovado-only, respostas de formulário sem inferência, armazenamento binário/textual versionado e página Materials.
- Validações: 35 testes locais; 6 testes PostgreSQL, incluindo quatro gravações concorrentes preservadas como versões 1–4 com hashes distintos; backend/frontend compilados e ESLint aprovado.
- Resultado: materiais antigos nunca são sobrescritos; PDFs podem ser visualizados e textos editados como nova versão. O worker bloqueia CV quando o Career DNA aprovado é insuficiente.
- Riscos/Pendências: nenhum material foi gerado com IA durante testes e nenhuma candidatura foi enviada; a tela operacional usa o container anterior até deploy autorizado.

### 2026-08-23 — Gate do Action Center e extensão assistida

- Itens: 13.1 a 13.10.
- Mudanças: Action Center priorizado por score; API local de contexto/duplicidade; extensão Manifest V3; preenchimento approved-only; detecção de CAPTCHA, MFA, upload, fluxo externo e campos desconhecidos; registro de confirmação.
- Validações: TypeScript da extensão compilado; manifest parseado; auditoria estática confirmou ausência de `document.cookie`, `chrome.cookies` e `.click()` programático; frontend ESLint/build aprovados.
- Resultado: a extensão reduz digitação, mas bloqueia `submit` sem confirmação humana e nunca executa o clique final.
- Riscos/Pendências: testes em páginas reais não foram executados para evitar candidaturas acidentais; cada plataforma deverá ser validada manualmente em formulário de teste ou até a etapa anterior ao envio.

### 2026-08-23 — Gate de respostas, follow-up e entrevistas

- Itens: 14.1 a 14.7.
- Mudanças: Inbox persistente vinculada, cinco classificações mais fraude, sinais determinísticos de golpe, follow-up limitado e aprovável, Interview Room e scaffolds STAR baseados em evidências aprovadas.
- Validações: migration `20260823070407_add_inbox_followups_interviews`; 41 testes locais; builds backend/frontend e ESLint aprovados.
- Resultado: respostas atualizam candidatura e próxima ação; convite cria sala de entrevista; follow-up nunca é enviado sem aprovação; mensagens suspeitas recebem alerta visível.
- Riscos/Pendências: IMAP real não foi consultado e follow-up real não foi enviado durante testes.

## Modelo de evidência

```text
Item:
Mudanças:
Validações:
Resultado:
Riscos/Pendências:
```

### 2026-08-23 — Command Center e base de portfólio

- Itens: 10.12, 15.1, 15.3 e 15.10.
- Mudanças: páginas `Today`, `Discover` e `Pipeline`; navegação principal; funil descoberta → oferta; conversão por fonte; saúde dos conectores e estados da fila; README com diagrama; estudo de caso, demonstração segura e roteiro de vídeo; workflow de CI.
- Validações: frontend ESLint e build de produção aprovados; 43 testes backend aprovados (6 integrações opt-in ignoradas); 2 testes específicos para funil/conversão; extensão compilada.
- Resultado: todas as áreas funcionais previstas possuem rota e o Command Center mostra resultados e saúde operacional sem acessar serviços externos.
- Riscos/Pendências: CI ainda não foi executada em um repositório remoto; E2E, cobertura, screenshots e dataset fictício isolado continuam abertos. O container operacional não foi recriado.

### 2026-08-23 — Demonstração isolada e fictícia

- Item: 15.6.
- Mudanças: PostgreSQL demo em volume e porta próprios; seed idempotente com perfil, oportunidades, assessments e aplicações fictícias; guarda obrigatória de protocolo, host local e nome de banco contendo `demo`; runbook de demonstração.
- Validações: 5 testes negativos/positivos da guarda; migrations aplicadas no banco `job_hunter_demo`; seed executado duas vezes; contagem permaneceu em 1 perfil, 4 oportunidades, 4 avaliações e 4 aplicações.
- Resultado: a história principal do produto pode ser demonstrada sem copiar dados pessoais e sem configurar IA, IMAP, SMTP ou plataformas de vagas.
- Riscos/Pendências: faltam screenshots automatizados e E2E visual; o PostgreSQL demo permanece local na porta 5433 e não interfere na V1.

### 2026-08-23 — Evidências visuais, E2E e cobertura

- Itens: 15.8 e 15.9.
- Mudanças: capturador Playwright restrito a localhost; screenshots Today/Discover/Pipeline; jornada E2E segura; workflow GitHub Actions com quality gate e banco demo; cobertura V8; README profissional com screenshots e diagrama Mermaid.
- Validações: E2E navegou por Today, Discover e Pipeline e confirmou quatro oportunidades fictícias; três PNGs foram gerados e inspecionados; 48 testes aprovados; cobertura produzida em texto e JSON (`36,5%` statements, baseline inicial); frontend/extension previamente compilados.
- Resultado: o projeto possui demonstração visual reproduzível e pipeline automatizado sem credenciais ou chamadas externas.
- Riscos/Pendências: o workflow ainda depende de execução futura em GitHub; cobertura é baseline, não meta de qualidade, e deve crescer especialmente nos adapters com browser. O servidor demo temporário foi encerrado; apenas o PostgreSQL isolado segue ativo.

### 2026-08-23 — Gate de produto e portfólio

- Itens: 15.2, 15.4, 15.5 e 15.7; gate da Fase 15.
- Mudanças: tokens visuais globais, foco visível, preferência de movimento reduzido, skip link, metadata Job Hunter OS e cabeçalho/navegação compartilhados; conversão por fonte, cargo, stack e material; recomendações com amostra mínima; logger Pino com redaction, eventos, duração e alertas estruturados.
- Validações: 51 testes offline aprovados; testes confirmam exclusão de rascunhos e impedem recomendações com amostra pequena; backend e frontend compilados; ESLint aprovado.
- Resultado: a interface é responsiva, navegável por teclado e orientada a conversão; o worker emite JSON pesquisável sem expor campos sensíveis conhecidos.
- Riscos/Pendências: recomendações só se tornam acionáveis após três candidaturas submetidas por grupo; o baseline de cobertura deve evoluir. Nenhuma ação real foi executada e o container operacional não foi atualizado.

### 2026-08-23 — Conector público Workable

- Item: conclusão de 10.10.
- Mudanças: conector Workable no contrato comum, endpoint público de careers page com `details=true`, validação Zod, descrição HTML normalizada e configuração por subdomínio/empresa.
- Validações: documentação oficial Workable revisada; fixture HTTP offline aprovada; seis testes de ATS públicos aprovados; backend compilado.
- Resultado: Ashby, Workable e SmartRecruiters estão cobertos sem token de empregador e permanecem desabilitados por padrão.
- Riscos/Pendências: nenhuma conta Workable real foi consultada durante testes; rate limits e disponibilidade serão observados em execução futura autorizada.

### 2026-08-23 — Descoberta autorizada Gupy e Indeed

- Itens: 10.6 e 10.7.
- Mudanças: ingestão de alertas oficiais recebidos pelo candidato; allowlist de domínios e URLs; preservação do identificador `jk` do Indeed; contrato Zod; saída da IA limitada a links já presentes na mensagem; dual-write com proveniência GUPY/INDEED.
- Validações: fixtures offline para tracking, domínio hostil, URL inventada e JSON inválido; 61 testes offline aprovados; backend compilado.
- Resultado: novas vagas podem entrar autonomamente pelos alertas das próprias plataformas sem scraping de busca, cookie, login ou submissão.
- Riscos/Pendências: alertas reais não foram consultados durante testes; o proprietário precisa ativá-los na Gupy/Indeed. E-mails sem dados suficientes permanecem não lidos e não geram vaga inventada.

### 2026-08-23 — Catálogo de empresas-alvo

- Item: fundação de 10.11; item permanece aberto até o proprietário cadastrar e revisar alvos reais.
- Mudanças: tabela `CareerPageTarget`, migration aditiva, API CRUD, página Sources, prioridade, habilitação explícita e registry para cinco ATS públicos.
- Validações: migration `20260823073526_add_career_page_targets`; sete cenários de registry/ATS; Prisma clients sincronizados; backend/frontend compilados e ESLint aprovado.
- Resultado: nenhuma empresa é inventada; alvos aprovados podem ser habilitados sem editar código ou `.env`.
- Riscos/Pendências: a lista factual de empresas e prioridades depende do proprietário.

### 2026-08-23 — Auditoria técnica completa

- Itens: verificação transversal; nenhum item dependente do proprietário foi marcado.
- Mudanças: scanner local de padrões de segredo no verificador, build obrigatório da extensão e documentação operacional alinhada ao estado atual.
- Validações: 11 migrations sincronizadas; schemas Prisma backend/frontend válidos; 61 testes offline e 6 testes PostgreSQL aprovados; backend/frontend/extension compilados; ESLint aprovado; Docker Compose válido; frontend operacional respondeu HTTP 200; scanner de segredos aprovado.
- Resultado: V1 preservada e workspace consistente. O banco temporário de integração foi removido; nenhum scraper, IMAP, SMTP, OpenRouter ou candidatura foi executado.
- Riscos/Pendências: o container operacional continua em uma imagem anterior por decisão de segurança; a lista real de empresas-alvo e os fatos pessoais exigem aprovação do proprietário.

### 2026-08-23 — E2E do catálogo Sources

- Item: validação adicional da fundação 10.11.
- Mudanças: fonte-alvo fictícia no seed, captura visual de Sources e espera assíncrona robusta no E2E.
- Validações: migration aplicada ao banco demo; E2E passou por Today → Discover → Sources → Pipeline; screenshot Sources inspecionado; servidor e PostgreSQL demo encerrados após o teste.
- Resultado: cadastro, leitura e comunicação visual entre fonte autônoma/assistida foram comprovados sem empresa real.
- Riscos/Pendências: o item 10.11 continua aberto corretamente até existir uma lista real revisada pelo proprietário.

### 2026-08-23 — Handoff e configuração fail-closed

- Itens: preparação das dependências do proprietário.
- Mudanças: `.env.example` raiz sanitizado; exemplo backend com todas as ações desabilitadas; guia único para Career DNA, preferências, empresas-alvo, alertas e credenciais.
- Validações: exemplos não contêm segredo e o parser de ambiente aceita as flags seguras quando `DATABASE_URL` é fornecida.
- Resultado: copiar a configuração de exemplo não inicia IA, IMAP, scrapers ou processamento.
- Riscos/Pendências: os `.env` privados existentes não foram lidos nem alterados; cabe ao proprietário comparar suas feature flags antes de qualquer deploy.

### 2026-08-23 — Smoke das imagens de produção em isolamento

- Itens: auditoria de deploy e hardening do worker.
- Mudanças: `ENABLE_FOLLOWUP_DRAFTS` fail-closed; serviços `backend_demo` e `frontend_demo` ligados somente ao banco fictício; healthcheck HTTP do frontend.
- Validações: Dockerfiles backend/frontend construídos do zero; `npm ci` sem vulnerabilidades reportadas; frontend demo saudável; `/today` e `/api/company-targets` responderam HTTP 200; log JSON do worker confirmou `dryRun=true`, ciclo de 0 ms e nenhuma etapa externa.
- Resultado: o código novo funciona nas imagens de produção sem substituir ou reiniciar a V1. Todos os containers demo foram parados após o teste; imagens e volume fictício foram preservados.
- Riscos/Pendências: o deploy operacional permanece deliberadamente pendente até revisão das flags e dados pelo proprietário.
## 2026-08-24 — Fase 18: endurecimento para produção

- Proteção de login e APIs com limites configuráveis e confiança de proxy desabilitada por padrão.
- Compose de produção independente, sem PostgreSQL/Adminer publicados, com migration one-shot, healthchecks e reinício automático.
- Caddy como única entrada pública, HTTPS automático, cabeçalhos de segurança e sobrescrita dos cabeçalhos de IP encaminhados.
- Endpoint público mínimo `/api/health` verifica a conectividade do frontend com o banco sem expor dados internos.
- Pendência: executar o preflight com domínio e credenciais reais, além de validar backup/restauração antes do go-live.

## 2026-08-24 - Validacao real da VPS e auditoria visual

- Itens comprovados: deploy isolado, HTTPS, healthchecks, Groq, SMTP, IMAP, checkpoint por data/UID, retry 429, Chrome e PDF em memoria.
- Validacoes: endpoint /api/health HTTP 200; containers saudaveis; 24 vagas GitHub e 10 LinkedIn por ciclo; SMTP verify e IMAP connect/logout sem acao externa; PDF canary com assinatura %PDF.
- Seguranca: APPLICATION_MODE=PREPARE, kill switch ativo, envio externo desabilitado e limite diario zero; banco confirmou zero e-mails enviados.
- Auditoria visual: Visao geral, Vagas, Pendencias, Competencias, Mensagens, Perfil e Materiais foram inspecionados com dados reais.
- Bloqueadores: preview do PDF quebrado, Action Center sem acoes decisorias completas, materiais ausentes para canais manuais e metricas ambiguas.
- Pendencias adicionais: fallback de JSON da Groq, elegibilidade/senioridade, LinkedIn profundo, extensao conectada a VPS, canario de envio e resposta, HSTS e E2E final.
### 2026-08-24 - Preview autenticado e download de PDF

- Causa raiz confirmada: o PDF protegido era carregado diretamente em `iframe`, mas `X-Frame-Options: DENY` bloqueava a renderização.
- Correção segura: o frontend busca o PDF com a sessão da mesma origem e cria uma URL temporária em memória, preservando `DENY` global contra clickjacking.
- A rota binária agora diferencia visualização e download (`?download=1`), informa tamanho, força MIME PDF e mantém cache privado desabilitado.
- As telas de Materiais e Revisão receberam ações de download e abertura em nova aba, além de estados de carregamento e erro.
- Validação local: lint aprovado, 4 testes aprovados e build Next.js de produção aprovado.
- Pendente para concluir 19.7: publicar as alterações e confirmar visualmente preview e download autenticados na VPS.
### 2026-08-24 - Decisões, materiais manuais e modo operacional

- Action Center recebeu decisões auditáveis para aprovar, ignorar, adiar, solicitar regeneração, encaminhar para ação manual e confirmar candidatura manual já realizada.
- Regeneração cria item interno deduplicado; o worker gera uma nova versão preservando o histórico.
- Vagas REVISAR/APLICAR sem e-mail agora recebem CV visual, CV ATS e mensagem ao recrutador antes de chegar à fila humana.
- A Visão geral diferencia vagas ativas, candidaturas preparadas e enviadas, além de refletir OBSERVE/PREPARE/AUTO_EMAIL, kill switch e permissão de e-mail reais.
- Segurança preservada: nenhuma ação externa foi habilitada e decisões mutáveis exigem mesma origem e sessão autenticada.
- Validação local: backend compilado e 78 testes aprovados; frontend com lint, 4 testes e build de produção aprovados.
- Pendência: publicar e validar 19.7–19.10 no ambiente autenticado da VPS antes de marcar os itens como concluídos.
### 2026-08-24 - IA, fontes públicas, extensão e operações

- IA: regras estruturais impedem APLICAR com requisito essencial ausente, senioridade incompatível ou restrição/elegibilidade não confirmada; JSON inválido recebe no máximo uma tentativa de reparo.
- LinkedIn: parser aceita JSON-LD aninhado, múltiplas seções, entidades HTML, seletores adicionais e metadados públicos como último fallback.
- Fontes: Gupy e Indeed ganharam conector controlado para páginas públicas específicas com JobPosting JSON-LD; Greenhouse, Lever, Ashby, SmartRecruiters e Workable permanecem via endpoints públicos oficiais.
- Extensão: API localhost fixa removida; service worker usa HTTPS e token revogável separado, com opções locais, CORS para origem chrome-extension e rate limit dedicado.
- Operações: template Nginx recebeu HSTS e cabeçalhos; scripts isolados de healthcheck, backup e restore drill temporário foram adicionados.
- Validações: backend 87 testes aprovados e 48,33% de statements; frontend 6 testes, lint e build aprovados; extensão check/build aprovados; E2E fictício desktop/mobile aprovado; npm audit sem vulnerabilidades nos três projetos.
- Segurança: nenhuma assinatura sensível em arquivos rastreados; `.env`, `backend/.env` e `deploy/.env.production` continuam ignorados.
- Pendências exclusivas da VPS: gerar/configurar token da extensão, validar fontes reais aprovadas, instalar extensão, aplicar/testar HSTS, executar backup/restore drill e realizar canário de comunicação após 2026-08-28.
### 2026-08-24 - Retry de regeneração e testes críticos

- A regeneração passou a reutilizar a fila transacional: reivindicação por tipo com `FOR UPDATE SKIP LOCKED`, retomada de itens `FAILED`, backoff exponencial, limite de tentativas e estado terminal `DEAD`.
- O worker processa no máximo cinco regenerações por ciclo e registra tentativa e limite nos logs de falha.
- A política do Action Center foi extraída e testada para aprovar, ignorar, adiar 24 horas, regenerar, encaminhar manualmente e confirmar submissão.
- A proteção de mesma origem agora valida host e protocolo; CORS da extensão foi isolado e testado sem permitir credenciais de navegador.
- Validação: backend com 89 testes unitários aprovados e teste PostgreSQL isolado com 2 cenários aprovado; frontend com 20 testes, lint sem avisos e build de produção aprovado.
- Segurança: nenhum envio externo foi habilitado e os bancos temporários de teste foram removidos após a execução.
### 2026-08-24 - Revisão final pré-commit

- Corrigido o adiamento do Action Center: itens com \`due_at\` futuro deixam a fila até o vencimento.
- Regenerações em processamento não podem ser reiniciadas; novos pedidos limpam locks antigos apenas quando o item não está \`PROCESSING\`.
- A confirmação da extensão tornou-se idempotente e não regride \`TEST\`, \`INTERVIEW\` ou \`OFFER\` para \`SUBMITTED\`; estados encerrados bloqueiam nova confirmação.
- Dados externos de título e empresa são escapados antes de entrar no HTML da extensão, e URLs não HTTP/HTTPS de JSON-LD são descartadas.
- O backup deixou de depender de pipeline sem \`pipefail\`: \`pg_dump\` precisa concluir e produzir SQL não vazio antes da compactação.
- Validação final: backend com 90 testes aprovados; fila com 2 testes PostgreSQL isolados; frontend com 28 testes, lint e build; extensão com type-check/build; scripts shell e Compose válidos.
- Varredura pré-commit encontrou apenas placeholders nos arquivos de exemplo; ambientes reais e \`.tmp/\` permanecem ignorados.
