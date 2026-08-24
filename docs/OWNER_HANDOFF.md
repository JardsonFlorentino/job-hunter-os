# Handoff do proprietário

Este arquivo contém somente decisões que o sistema não pode tomar sem inventar fatos ou ampliar autoridade. Não cole senhas, cookies ou chaves em conversas, issues ou documentação.

## 1. Revisar o Career DNA

Abra `/career-dna` e revise cada fato importado. Aprove apenas informações verdadeiras e atuais: nome, telefone, localização, links, formação, idiomas, certificações, experiências, datas, resultados mensuráveis, projetos e tecnologias realmente utilizadas.

## 2. Definir preferências

Registre cargos desejados, senioridade, modalidade, localidades, contrato e faixa salarial. Cadastre também empresas, tecnologias ou condições bloqueadas.

## 3. Escolher empresas-alvo

Abra `/sources` e cadastre empresa, URL oficial, ATS e prioridade. Use o identificador público do board quando a plataforma for Greenhouse, Lever, Ashby, Workable ou SmartRecruiters. Todo alvo nasce desabilitado; revise antes de habilitar.

## 4. Ativar descoberta autorizada

- crie alertas nas contas pessoais de Gupy e Indeed;
- direcione os alertas à caixa IMAP dedicada;
- atualize os perfis nessas plataformas manualmente;
- não forneça cookies ou senha principal ao Job Hunter.

## 5. Credenciais privadas

Configure diretamente nos `.env` privados: OpenRouter com limite mensal, conta SMTP/IMAP dedicada com senha de aplicativo e senha PostgreSQL exclusiva.

Comece com `DRY_RUN=true` e todos os `ENABLE_*` em `false`. Habilite um recurso por vez, execute o runbook e confira logs e contagens antes do próximo.

## Critério para implantação do código novo

O container operacional só deve ser recriado depois que Career DNA, preferências, empresas-alvo e feature flags forem revisados. O primeiro deploy deve permanecer em `DRY_RUN=true`; nenhuma candidatura real deve ser usada como smoke test.
