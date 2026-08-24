# Job Hunter OS — Checklist de Execução Autônoma

## Fase 16 - Calibracao e entrada em producao controlada

- [x] 16.1 Criar preflight que valide configuracao e prontidao dos dados sem revelar segredos.
- [x] 16.2 Centralizar os modos `OBSERVE`, `PREPARE` e `AUTO_EMAIL` com padrao fail-closed.
- [x] 16.3 Adicionar kill switch, limite diario, score minimo e allowlist para envio automatico.
- [x] 16.4 Auditar e reduzir a divergencia entre `Job` legado e `Opportunity`/`Application`.
- [x] 16.5 Atualizar fontes conhecidas e calibrar deduplicacao com dados reais controlados.
- [ ] 16.6 Validar SMTP/IMAP em sandbox, sem destinatarios externos.
- [x] 16.7 Executar canarios somente de leitura para cada conector habilitado.
- [x] 16.8 Proteger dashboard e servicos antes de exposicao em VPS.
- [x] 16.9 Publicar o codigo novo com `DRY_RUN=true` e observar ao menos um ciclo.
- [x] 16.10 Operar em `PREPARE`, exigindo revisao humana antes de qualquer submissao.
- [ ] 16.11 Liberar um envio real controlado somente apos aprovacao explicita do proprietario.
- [x] 16.12 Validar backup, rollback, alertas e runbook final.

**Gate:** nenhuma acao externa ocorre por configuracao implicita; cada liberacao e limitada, auditavel e reversivel.

## Regra de controle

Um item recebe `[x]` somente após implementação, validação objetiva e registro da evidência em `docs/PROGRESS.md`. Falha ou validação parcial mantém `[ ]`. Testes nunca enviam candidaturas, e-mails ou mensagens reais.

## V1 — Base operacional

- [x] Backend TypeScript, Prisma e PostgreSQL.
- [x] OpenRouter para análise e comunicação.
- [x] Currículo dinâmico em PDF.
- [x] Envio SMTP e leitura IMAP.
- [x] Scrapers públicos GitHub e LinkedIn.
- [x] Enriquecimento de descrição e contato.
- [x] Score e justificativa persistidos.
- [x] Fluxo por e-mail e fila `MANUAL`.
- [x] Dashboard Kanban com feed e badges.
- [x] Docker Compose completo.

## Fase 7 — Proteção e baseline

- [x] 7.1 Criar e validar backup do PostgreSQL.
- [x] 7.2 Documentar arquitetura, segurança, operação, testes e protocolo autônomo.
- [x] 7.3 Criar comando único de verificação do projeto.
- [x] 7.4 Adicionar testes unitários sem ações externas.
- [x] 7.5 Criar testes de integração do banco e deduplicação.
- [x] 7.6 Criar fixtures para testar scrapers sem depender da internet.
- [x] 7.7 Adicionar feature flags e modo seguro `DRY_RUN`.
- [x] 7.8 Validar variáveis de ambiente no startup.
- [x] 7.9 Corrigir divergência de `DATABASE_URL` local/Docker.
- [x] 7.10 Executar baseline: Prisma, builds, testes, Docker e HTTP 200.

**Gate:** backup restaurável, testes verdes, `DRY_RUN` ativo em testes e V1 saudável.

## Fase 8 — Career DNA pessoal

- [x] 8.1 Modelar experiências, projetos, skills, formação, certificações e idiomas.
- [x] 8.2 Modelar resultados e evidências verificáveis.
- [x] 8.3 Modelar cargos, stacks, senioridade, salário, contrato, local e modalidade desejados.
- [x] 8.4 Modelar empresas, condições e tecnologias bloqueadas.
- [x] 8.5 Modelar biblioteca de respostas aprovadas.
- [x] 8.6 Criar APIs validadas e fortemente tipadas.
- [x] 8.7 Criar interface de edição e revisão factual.
- [x] 8.8 Importar currículo sem aceitar fatos automaticamente.
- [x] 8.9 Limitar geração de IA a fatos aprovados.
- [x] 8.10 Testar prevenção de alucinações factuais.

**Gate:** toda informação usada em materiais possui origem aprovada.

**Gate concluído em 2026-08-23:** importação pendente de revisão e contexto de IA restrito a registros aprovados.

## Fase 9 — Opportunity e prevenção de duplicidade

- [x] 9.1 Criar `Company`.
- [x] 9.2 Criar `Opportunity` independente de plataforma.
- [x] 9.3 Criar `JobSource` com URL canônica e ID externo.
- [x] 9.4 Criar `Requirement` essencial/desejável.
- [x] 9.5 Criar `Application` e `ApplicationEvent`.
- [x] 9.6 Criar `GeneratedMaterial` versionado.
- [x] 9.7 Deduplicar por plataforma e ID externo.
- [x] 9.8 Deduplicar por empresa, título, local e descrição.
- [x] 9.9 Avaliar similaridade semântica e adiar enquanto a impressão digital determinística for suficiente.
- [x] 9.10 Criar trava transacional contra aplicação duplicada.
- [x] 9.11 Migrar o histórico atual sem perda.
- [x] 9.12 Exibir fontes agrupadas no dashboard.

**Gate:** a mesma oportunidade em várias fontes aparece uma vez e não pode ser aplicada duas vezes.

**Gate concluído em 2026-08-23:** dual-write ativo, histórico auditado e concorrência validada em PostgreSQL temporário.

## Fase 10 — Plataforma de conectores

- [x] 10.1 Definir contrato `JobSourceConnector`.
- [x] 10.2 Padronizar descoberta, enriquecimento, normalização, retry e health check.
- [x] 10.3 Criar fila PostgreSQL com concorrência controlada e backoff.
- [x] 10.4 Migrar GitHub para o contrato.
- [x] 10.5 Migrar LinkedIn público para o contrato.
- [x] 10.6 Criar conector público Gupy.
- [x] 10.7 Criar conector público Indeed.
- [x] 10.8 Criar conector Greenhouse.
- [x] 10.9 Criar conector Lever.
- [x] 10.10 Criar conectores Ashby, Workable e SmartRecruiters.
- [ ] 10.11 Adicionar páginas de carreira de empresas-alvo.
- [x] 10.12 Criar painel de saúde e métricas por conector.

**Gate:** falha em um conector não interrompe os demais; toda oportunidade mantém proveniência.

Gupy e Indeed usam alertas oficiais recebidos na caixa pertencente ao candidato. O sistema extrai somente URLs públicas presentes no e-mail, valida a saída da IA contra uma allowlist e não raspa busca, autenticação ou formulário das plataformas.

## Fase 11 — Decisão explicável

- [x] 11.1 Calcular score por stack, senioridade, responsabilidades, localização, idioma e restrições.
- [x] 11.2 Separar requisitos essenciais e desejáveis.
- [x] 11.3 Persistir forças, lacunas, riscos e estratégia.
- [x] 11.4 Criar decisões `APLICAR`, `REVISAR` e `IGNORAR`.
- [x] 11.5 Exigir descrição suficiente antes de decisão automática.
- [x] 11.6 Criar ranking diário por compatibilidade, recência e esforço.
- [x] 11.7 Registrar modelo, prompt, versão e decisão.
- [x] 11.8 Criar dataset local para avaliar o score.

**Gate:** decisões reproduzíveis, explicáveis e alinhadas às preferências pessoais.

**Gate concluído em 2026-08-23:** contrato de saída validado, trilha versionada e decisão automática bloqueada sem descrição suficiente.

## Fase 12 — Materiais personalizados

- [x] 12.1 Selecionar experiências e projetos relevantes.
- [x] 12.2 Gerar currículo ATS direcionado.
- [x] 12.3 Gerar currículo visual para contato direto.
- [x] 12.4 Gerar assunto e e-mail personalizados.
- [x] 12.5 Gerar cover letter quando agregar valor.
- [x] 12.6 Gerar mensagem curta para recrutador.
- [x] 12.7 Sugerir respostas para formulários.
- [x] 12.8 Validar tudo contra o Career DNA.
- [x] 12.9 Criar pré-visualização e edição.
- [x] 12.10 Armazenar a versão exata utilizada.

**Gate:** materiais factuais, específicos e auditáveis.

**Gate concluído em 2026-08-23:** seletores approved-only, materiais versionados por hash e edição sem sobrescrever versões anteriores.

## Fase 13 — Action Center e extensão assistida

- [x] 13.1 Criar fila de ações manuais priorizada.
- [x] 13.2 Criar detalhamento da oportunidade e materiais.
- [x] 13.3 Criar extensão Manifest V3 em `extension/`.
- [x] 13.4 Detectar LinkedIn, Gupy, Indeed e ATS suportados.
- [x] 13.5 Consultar score e duplicidade no Job Hunter local.
- [x] 13.6 Preencher somente dados aprovados na sessão local.
- [x] 13.7 Detectar CAPTCHA, MFA, upload complexo e perguntas inéditas.
- [x] 13.8 Exigir confirmação humana antes do envio final.
- [x] 13.9 Detectar confirmação e registrar o evento.
- [x] 13.10 Documentar instalação no Chrome/Edge.

**Gate:** formulários assistidos com poucos cliques, sem armazenar cookies ou senhas no backend.

**Gate concluído em 2026-08-23:** extensão compilada, sem APIs de cookies/clique automático e com bloqueio de submit até revisão explícita.

## Fase 14 — Respostas, follow-up e entrevistas

- [x] 14.1 Relacionar respostas à candidatura correta.
- [x] 14.2 Classificar confirmação, rejeição, teste, entrevista e ambiguidade.
- [x] 14.3 Criar follow-up com limite e aprovação.
- [x] 14.4 Criar Interview Room.
- [x] 14.5 Gerar perguntas prováveis e histórias STAR factuais.
- [x] 14.6 Registrar etapas, prazos, contatos e feedback.
- [x] 14.7 Detectar comunicações potencialmente fraudulentas.

**Gate:** todo processo ativo possui próxima ação e prazo claros.

**Gate concluído em 2026-08-23:** respostas auditáveis, follow-ups somente como rascunho aprovável e entrevistas ligadas à candidatura.

## Fase 15 — Produto e portfólio

- [x] 15.1 Criar páginas Today, Discover, Pipeline, Action Center, Materials, Inbox, Interviews e Career DNA.
- [x] 15.2 Consolidar design system acessível e responsivo.
- [x] 15.3 Medir descoberta → aplicação → resposta → teste → entrevista → oferta.
- [x] 15.4 Comparar conversão por fonte, cargo, stack e material.
- [x] 15.5 Criar recomendações baseadas em conversão real.
- [x] 15.6 Criar demonstração com dados fictícios.
- [x] 15.7 Adicionar logs estruturados, métricas e alertas locais.
- [x] 15.8 Criar CI, testes E2E e relatório de cobertura.
- [x] 15.9 Criar README profissional, screenshots e diagrama.
- [x] 15.10 Criar roteiro de vídeo e estudo de caso técnico.

**Gate:** aplicação estável, demonstrável sem dados privados e forte como portfólio Full Stack.

## Informações que dependem do proprietário

- [x] Currículo factual revisado.
- [x] Telefone, localização, formação, idiomas e links corretos.
- [x] Experiências, projetos e resultados mensuráveis.
- [x] Preferências de cargos, salário, contrato, local e modalidade.
- [x] Empresas e condições bloqueadas.
- [ ] Lista de empresas-alvo, URLs oficiais de carreira e prioridades.
- [x] Respostas pessoais aprovadas para perguntas recorrentes.
- [ ] Perfis atualizados em LinkedIn, Gupy e Indeed.
- [x] Chave Groq validada por canário real sem gravação.
- [ ] Conta dedicada e senha de aplicativo SMTP/IMAP.

## Ordem autônoma

1. Concluir o gate da Fase 7.
2. Implementar Fase 8 sem inventar dados ausentes.
3. Implementar Fase 9 e migrar o histórico.
4. Implementar conectores públicos da Fase 10.
5. Evoluir decisão e materiais nas Fases 11 e 12.
6. Criar Action Center e extensão na Fase 13.
7. Finalizar conversão e portfólio nas Fases 14 e 15.

Quando faltar informação factual do proprietário, registrar o bloqueio e continuar apenas em itens independentes.

## Fase 17 — Experiência em português e evolução profissional

- [x] 17.1 Simplificar a navegação principal e traduzir seus rótulos.
- [x] 17.2 Substituir o dashboard legado por uma Visão geral orientada a prioridades.
- [x] 17.3 Exibir claramente o modo seguro e os limites atuais da automação.
- [x] 17.4 Criar painel de competências usando stacks, projetos e certificações existentes.
- [x] 17.5 Calcular demanda estimada das stacks a partir das vagas ativas.
- [x] 17.6 Destacar competências sem evidência prática associada.
- [x] 17.7 Traduzir todas as telas secundárias, estados internos e mensagens restantes.
- [x] 17.8 Criar gerenciamento dedicado de competências e certificações dentro do novo painel.
- [x] 17.9 Criar página detalhada da vaga com matriz requisito × evidência.
- [x] 17.10 Criar revisão unificada de candidatura, currículo e mensagem.
- [x] 17.11 Criar área pública de portfólio sem dados pessoais ou operacionais.
- [x] 17.12 Validar experiência responsiva e E2E completo do novo fluxo.

**Gate:** experiência integralmente em português, orientada a decisões e capaz de demonstrar competências com evidências verificáveis.

**Gate concluído em 2026-08-24:** jornada pública e privada validada em desktop e celular, com autenticação, matriz de evidências, revisão segura e dados fictícios isolados na CI.

## Fase 18 — Endurecimento para produção

- [x] 18.1 Limitar tentativas de login e requisições de leitura/escrita nas APIs.
- [x] 18.2 Ignorar cabeçalhos de IP por padrão e confiar neles apenas atrás de proxy configurado.
- [x] 18.3 Adicionar proxy reverso com HTTPS e cabeçalhos de segurança para a VPS.
- [x] 18.4 Criar Compose de produção sem publicar PostgreSQL ou Adminer.
- [x] 18.5 Adicionar healthchecks e política de reinício aos serviços de produção.
- [ ] 18.6 Executar preflight final de credenciais, backup e restauração antes do go-live.

**Gate:** superfície pública protegida, serviços internos isolados e recuperação validada antes da exposição na internet.
