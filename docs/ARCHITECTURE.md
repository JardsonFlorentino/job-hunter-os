# Arquitetura do Job Hunter OS

## Descoberta permitida em plataformas fechadas

Alertas oficiais Gupy/Indeed chegam à caixa dedicada do usuário. O prefilter local encontra apenas links desses domínios; a IA extrai título e empresa; uma allowlist exige que cada URL retornada já exista no e-mail. Só então `Opportunity` e `JobSource` são persistidos. Essa rota nunca abre login, contorna anti-bot ou submete formulário.

## Objetivo

Produto pessoal, executado localmente ou em VPS privada, para descobrir, qualificar, personalizar e acompanhar oportunidades de emprego. O foco é gerar entrevistas e demonstrar engenharia de software profissional no portfólio.

## Contextos

- `backend/`: worker, conectores, IA, PDF, SMTP, IMAP e Prisma.
- `frontend/`: dashboard Next.js e APIs locais.
- `extension/`: futura extensão assistida para formulários autenticados.
- PostgreSQL: fonte de verdade do pipeline.

## Fluxo atual

1. IMAP classifica respostas.
2. Conectores descobrem e enriquecem vagas públicas.
3. O banco grava a compatibilidade legada em `Job` e simultaneamente normaliza `Company`, `Opportunity` e `JobSource`.
4. A IA calcula score e justificativa.
5. Score abaixo de 70 vai para `IGNORADO`.
6. Score a partir de 70 com e-mail válido gera CV e envio SMTP.
7. Sem e-mail, a oportunidade vai para `MANUAL`.
8. O dashboard mostra o estado e as ações necessárias.

## Domínio de oportunidades implementado

Separar a vaga lógica de suas fontes e da candidatura:

```text
Company ── Opportunity ── JobSource
                    └──── Application ── ApplicationEvent
                                      └─ GeneratedMaterial

CandidateProfile ── Experience / Project / Skill / Preference
```

`Opportunity` representa uma vaga única. `JobSource` representa cada publicação em LinkedIn, Gupy, Indeed, GitHub ou ATS. `Application` possui unicidade por oportunidade e perfil, enquanto `ApplicationEvent` forma a trilha auditável. `GeneratedMaterial` preserva tipo, versão, hash, modelo e versão do prompt.

A V1 continua lendo `Job`, mas todo novo resultado dos scrapers realiza dual-write. Os 109 registros históricos foram vinculados de modo idempotente; essa ponte permite migração gradual sem interromper o worker operacional.

## Decisões

- Monólito modular TypeScript, sem microserviços prematuros.
- PostgreSQL como banco e fila inicial.
- Conectores implementam contrato comum e falham isoladamente.
- IA fornece decisão explicável; regras determinísticas controlam ações externas.
- Formulários autenticados permanecem na sessão local do navegador.
- Nenhum cookie de plataforma de vagas é armazenado no backend.
