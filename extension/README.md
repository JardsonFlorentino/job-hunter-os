# Job Hunter OS Assistant

Extensão Manifest V3 para Chrome e Edge. Ela consulta apenas o Job Hunter local, preenche fatos já aprovados e nunca clica no botão final de envio.

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

No Edge, use `edge://extensions` e o mesmo procedimento.

## Garantias de segurança

- Não lê nem armazena cookies, senhas ou tokens das plataformas.
- Não preenche senha, checkbox, radio, upload ou resposta desconhecida.
- CAPTCHA, MFA, upload e fluxo externo aparecem como bloqueios.
- Todo evento `submit` é bloqueado até a confirmação explícita no painel.
- Mesmo após confirmar, o clique final continua sendo feito pelo usuário.
- A confirmação pós-envio só registra o evento se a página mostrar mensagem reconhecível de candidatura recebida.

## Pré-requisitos

- Dashboard disponível em `http://localhost:3000`.
- Vaga previamente descoberta pelo Job Hunter.
- Career DNA revisado e respostas recorrentes aprovadas.
