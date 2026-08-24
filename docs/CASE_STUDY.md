# Job Hunter OS — estudo de caso tecnico

## Problema

Buscar vagas em varias fontes gera repeticao, materiais genericos e perda de contexto. Automatizar o clique final tambem introduz risco de duplicidade, respostas incorretas e bloqueio de contas.

## Decisao de produto

O Job Hunter OS separa trabalho autonomo de decisoes irreversiveis. Descoberta, enriquecimento, deduplicacao, ranking e preparacao podem rodar em segundo plano. Submissoes em formularios exigem revisao humana; e-mail respeita `DRY_RUN` e uma trilha auditavel.

## Arquitetura

- conectores independentes produzem oportunidades normalizadas;
- PostgreSQL mantem proveniencia, fila com lease e idempotencia;
- Career DNA fornece somente fatos aprovados;
- avaliacoes guardam score, breakdown, riscos, prompt e hash;
- materiais sao imutaveis e versionados;
- Next.js concentra Today, Discover, Pipeline e Action Center;
- extensao local preenche dados aprovados sem ler cookies nem clicar em enviar.

## Garantias importantes

- uma oportunidade pode ter varias fontes, mas uma candidatura por perfil;
- descricoes insuficientes nunca geram decisao automatica de aplicar;
- falha de um conector nao encerra os demais;
- testes nao acessam IA, e-mail, caixa de entrada ou paginas reais;
- follow-up e candidatura assistida dependem de aprovacao explicita.

## Evidencias de engenharia

O projeto possui migrations aditivas, contratos Zod, testes de concorrencia PostgreSQL, fixtures offline de ATS, builds tipados, CI e documentacao operacional. O historico completo de validacoes fica em `docs/PROGRESS.md`.
