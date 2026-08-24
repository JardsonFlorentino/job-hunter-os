# Job Hunter OS

Sistema pessoal de inteligência de carreira para descobrir vagas, enriquecer dados, eliminar duplicatas, avaliar compatibilidade com IA, personalizar materiais e organizar candidaturas automáticas ou assistidas.

## Objetivos

1. Aumentar a conversão de oportunidades em entrevistas.
2. Reduzir trabalho repetitivo sem comprometer contas ou qualidade.
3. Servir como projeto de portfólio Full Stack profissional.

## Stack

- Backend: Node.js, TypeScript, Prisma, PostgreSQL, Playwright, Puppeteer, Nodemailer e ImapFlow.
- Frontend: Next.js App Router, React e Tailwind CSS.
- IA: OpenRouter.
- Infraestrutura: Docker Compose.
- Extensão assistida: Manifest V3 e TypeScript, sem acesso a cookies ou clique final.

## Documentação canônica

- [Checklist mestre](CHECKLIST.md)
- [Arquitetura](docs/ARCHITECTURE.md)
- [Execução autônoma](docs/AUTONOMOUS_EXECUTION.md)
- [Segurança](docs/SECURITY.md)
- [Runbook operacional](docs/RUNBOOK.md)
- [Estratégia de testes](docs/TESTING.md)
- [Acessos externos e responsabilidades](docs/EXTERNAL_ACCESS.md)
- [Handoff do proprietário](docs/OWNER_HANDOFF.md)
- [Diário de progresso](docs/PROGRESS.md)
- [Demonstração fictícia](docs/DEMO.md)
- [Estudo de caso técnico](docs/CASE_STUDY.md)

## Estado

A V1 permanece operacional para um único candidato. As fases de domínio, decisão, materiais, Action Center, respostas e portfólio foram implementadas e validadas fora do container operacional. O item técnico pendente é a aprovação da lista real de empresas-alvo; os demais campos abertos no checklist dependem de fatos ou credenciais do proprietário.

## Limites

- Candidaturas reais nunca são utilizadas como teste.
- Formulários autenticados exigem confirmação humana.
- Cookies e senhas de plataformas de vagas não são armazenados no backend.
- A IA não pode inventar fatos profissionais.
