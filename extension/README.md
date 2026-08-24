# Job Hunter OS Assistant

Extensão Manifest V3 para Chrome e Edge. Ela consulta o Job Hunter OS, preenche somente fatos aprovados e nunca clica no botão final de envio.

## Compilar

```powershell
cd extension
npm install
npm run build
```

## Instalar no Chrome

1. Abra `chrome://extensions`.
2. Ative **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação**.
4. Selecione a pasta `extension/` — não a pasta `dist/`.
5. Abra **Detalhes > Opções da extensão**.
6. Use `https://jobhunter.jardsonflorentino.com.br/api/assistant` como API.
7. Informe um token exclusivo gerado com `openssl rand -hex 32` e configurado na VPS como `EXTENSION_API_TOKEN`.

No Edge, use `edge://extensions` e o mesmo procedimento.

## Garantias de segurança

- O token é separado da senha do painel e pode ser revogado trocando `EXTENSION_API_TOKEN` na VPS.
- O token fica no armazenamento local da extensão; nunca é incluído no repositório ou enviado às plataformas de vagas.
- Requisições passam pelo service worker, HTTPS, CORS restrito e rate limit dedicado.
- Não lê nem armazena cookies, senhas ou tokens de LinkedIn, Gupy, Indeed ou ATS.
- Não preenche senha, checkbox, radio, upload ou resposta desconhecida.
- CAPTCHA, MFA, upload e fluxo externo aparecem como bloqueios.
- Todo evento `submit` é bloqueado até a confirmação explícita no painel.
- Mesmo após confirmar, o clique final continua sendo feito pelo usuário.
- A confirmação pós-envio só registra o evento se a página mostrar mensagem reconhecível de candidatura recebida.

## Desenvolvimento local

Nas opções, use `http://localhost:3000/api/assistant` e o mesmo token configurado no `.env` local do frontend.