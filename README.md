# WhatsApp Bot Template 🚀

Um template robusto e moderno para criação de bots de WhatsApp utilizando **TypeScript**, **Baileys** e as melhores práticas de desenvolvimento.

## ✨ Funcionalidades

- 🛡️ **TypeScript**: Desenvolvimento totalmente tipado para evitar erros em runtime.
- 💬 **Baileys v7**: Conexão com o WhatsApp Web via multi-device, com reconexão automática e sessão persistida em `auth/`.
- 📂 **Auto-loading**: Sistema automático para carregar comandos e eventos.
- 📝 **Winston Logging**: Logs profissionais com escopos, cores no console e salvamento em arquivos (`logs/`).
- 🎨 **Qualidade de Código**: Configuração rigorosa de **ESLint 9** e **Prettier**.
    - Ordenação de imports por tamanho de linha.
    - Remoção automática de imports não utilizados.
    - Estilo consistente (4 espaços, sem ponto e vírgula, aspas duplas).
- 🧩 **Argumentos tipados**: Validação posicional de argumentos com [`@marcuth/argus`](https://www.npmjs.com/package/@marcuth/argus) e **Zod**.
- ⚙️ **Gestão de Variáveis**: Integração com `@marcuth/env` para um gerenciamento seguro do `.env`.

## 🛠️ Pré-requisitos

- [Node.js](https://nodejs.org/) (v22.12 ou superior)
- [NPM](https://www.npmjs.com/) ou [Yarn](https://yarnpkg.com/)
- Um número de WhatsApp para vincular ao bot

## 🚀 Instalação e Início

1.  **Clone o repositório:**

    ```bash
    git clone https://github.com/seu-usuario/whatsapp-bot-template.git
    cd whatsapp-bot-template
    ```

2.  **Instale as dependências:**

    ```bash
    npm install
    ```

3.  **Configure o ambiente:**
    Renomeie o arquivo `.env.example` para `.env` e preencha as variáveis:

    ```env
    # Número do dono, com código do país e sem símbolos
    WHATSAPP_ADMIN_NUMBER=5511999999999
    # Opcional: se definido, o bot gera um código de pareamento em vez de QR code
    WHATSAPP_PAIRING_NUMBER=
    ```

4.  **Inicie o bot:**

    ```bash
    # Modo desenvolvimento
    npm run dev

    # Modo desenvolvimento com auto-reload (nodemon)
    npm run dev:reload

    # Build para produção
    npm run build
    npm start
    ```

5.  **Vincule o WhatsApp:** na primeira execução, escaneie o QR code exibido no terminal em _Aparelhos conectados_ (ou digite o código de pareamento). A sessão fica salva em `auth/`; apague a pasta para vincular outro número.

## 💡 Comandos de exemplo

O prefixo padrão é `!` (veja `src/helpers/config.helper.ts`).

| Comando                | Descrição                    |
| ---------------------- | ---------------------------- |
| `!ping`                | Mostra o ping do bot.        |
| `!help`                | Lista os comandos.           |
| `!sum <a> <b> [label]` | Soma dois números (exemplo). |

## 📜 Scripts Disponíveis

| Comando              | Descrição                                             |
| -------------------- | ----------------------------------------------------- |
| `npm run dev`        | Executa o bot em modo de desenvolvimento.             |
| `npm run dev:reload` | Executa o bot com Nodemon para reiniciar ao salvar.   |
| `npm run build`      | Compila o TypeScript para JavaScript (pasta `dist/`). |
| `npm start`          | Inicia o bot compilado.                               |
| `npm run lint`       | Verifica erros de linting.                            |
| `npm run lint:fix`   | Corrige erros de linting e formata o código.          |

## 📁 Estrutura de Pastas

```text
src/
├── client.ts        # Criação, conexão e ciclo de vida do cliente
├── commands/        # Comandos
├── enums/           # Enums globais
├── events/          # Handlers de eventos do Baileys
├── handlers/        # Carregadores automáticos
├── helpers/         # Auxiliares (config, logger, argus)
├── interfaces/      # Definições de tipos e interfaces
└── utils/           # Utilitários
```

## ⚠️ Aviso

O Baileys não é uma API oficial do WhatsApp. O uso para spam ou automação abusiva pode resultar em banimento do número. Use com responsabilidade.

## ⚖️ Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

Feito com ❤️ por [Marcuth](https://github.com/marcuth)
