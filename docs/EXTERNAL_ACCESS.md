# Acessos externos e responsabilidades

## Necessários para o uso pessoal

| Integração | Dado necessário | Onde fica | Observação |
|---|---|---|---|
| OpenRouter | `OPENROUTER_API_KEY` | `.env` privado | Configurar limite mensal e rotacionar se houver exposição. |
| Gmail SMTP | usuário e senha de aplicativo | `.env` privado | Usar senha de aplicativo, nunca a senha principal. |
| Gmail IMAP | usuário e senha de aplicativo | `.env` privado | Pode reutilizar a conta dedicada, com IMAP habilitado. |
| PostgreSQL | `DATABASE_URL` | `.env` privado | Credenciais locais não devem ser reutilizadas em VPS pública. |

## Plataformas de vagas

- GitHub: descoberta de issues públicas, sem credencial.
- LinkedIn: descoberta somente em páginas públicas. Cookies, senha e token de sessão não são armazenados no backend. A futura extensão trabalhará na sessão local e exigirá confirmação antes do envio.
- Gupy: descoberta segura ocorre por alertas oficiais enviados à caixa do candidato. A API oficial de Jobs exige Bearer Token de cliente Premium/Enterprise e perfil administrativo; ela não é uma API geral para candidatos. Referências: [autenticação oficial](https://developers.gupy.io/v2.0/reference/authentication) e [listagem de vagas](https://developers.gupy.io/reference/findjobs).
- Indeed: como não foi identificada uma API oficial geral de busca para candidatos, a descoberta ocorre por alertas pertencentes ao usuário. Não há scraping de resultados, login ou formulário.
- Greenhouse, Lever, Ashby, Workable e SmartRecruiters: priorizar endpoints públicos dos job boards das empresas-alvo; normalmente será necessário cadastrar os identificadores das empresas, não credenciais pessoais.
- Workable usa apenas o endpoint público documentado `https://www.workable.com/api/accounts/<subdomain>?details=true`. Configure `WORKABLE_ACCOUNTS=subdominio|Nome da empresa`; tokens SPI de empregadores não são necessários. [Documentação oficial consultada em 2026-08-23](https://help.workable.com/hc/en-us/articles/115012771647-Using-the-Workable-API-to-create-a-careers-page).

## Informações que somente o proprietário pode aprovar

- Ativar alertas de vagas desejados nas contas pessoais de Gupy e Indeed e direcioná-los à caixa IMAP dedicada.
- Revisar no painel Sources as empresas e páginas oficiais antes de habilitá-las.

- telefone, localização e disponibilidade;
- pretensão CLT/PJ;
- autorização de trabalho e disponibilidade para mudança;
- formação, idiomas e certificações;
- resultados mensuráveis e respectivas evidências;
- respostas para perguntas eliminatórias;
- empresas, tecnologias e condições bloqueadas;
- confirmação final de candidaturas feitas em formulários autenticados.

## Dados proibidos no repositório

- cookies `li_at` ou equivalentes;
- senha principal de e-mail ou plataforma;
- tokens reais em `.env.example`;
- currículo, dumps, PDFs personalizados ou logs contendo dados pessoais;
- respostas inventadas ou aprovadas automaticamente por IA.
