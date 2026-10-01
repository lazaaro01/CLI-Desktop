# Gemini CLI Island

> Uma interface desktop para acompanhar, visualizar e interagir com agentes de desenvolvimento executados via CLI.

**Gemini CLI Island** é um projeto experimental que transforma eventos de agentes de programação executados no terminal em uma interface visual compacta e contextual.

A proposta é permitir que desenvolvedores acompanhem múltiplas sessões de agentes de IA sem precisar alternar constantemente entre diferentes terminais.

A interface utiliza o conceito de uma **Dynamic Island**, permanecendo discreta quando não existe nenhuma atividade relevante e expandindo quando uma sessão precisa da atenção do usuário.

---

## ✨ Visão geral

Agentes de programação podem executar tarefas por vários minutos, utilizar ferramentas, modificar arquivos, executar comandos e solicitar permissões.

Durante esse processo, o desenvolvedor normalmente precisa acompanhar o terminal para descobrir o que está acontecendo.

O Gemini CLI Island propõe uma camada visual entre o agente e o desenvolvedor:

```text
┌─────────────────────┐
│     Gemini CLI      │
│                     │
│  Agent → Tools      │
│         ↓           │
│       Hooks         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Gemini CLI Island  │
│                     │
│ 🟣 Idle             │
│ 🔵 Working          │
│ 🟡 Waiting          │
│ 🟢 Done             │
│ 🔴 Error            │
└─────────────────────┘
```

O objetivo não é substituir o terminal.

A aplicação funciona como uma **camada de observabilidade e interação para agentes de desenvolvimento**.

---

## 🎯 Problema

O uso de agentes através de CLI apresenta alguns problemas de experiência:

* dificuldade para acompanhar agentes executando tarefas demoradas;
* necessidade de alternar entre múltiplos terminais;
* pouca visibilidade sobre o estado atual de cada sessão;
* solicitações de permissão podem passar despercebidas;
* erros ficam restritos ao terminal;
* múltiplos projetos podem possuir agentes executando simultaneamente.

Imagine:

```text
Terminal 1
└── loja-online
    └── Agent trabalhando

Terminal 2
└── api-backend
    └── Agent esperando permissão

Terminal 3
└── dashboard
    └── Agent terminou

Terminal 4
└── mobile-app
    └── Agent apresentou erro
```

O desenvolvedor precisa visitar cada terminal individualmente.

O Gemini CLI Island busca transformar esse cenário em:

```text
              ┌─────────────────────────────┐
              │      Gemini CLI Island      │
              │                             │
              │ 🔵 loja-online              │
              │ 🟡 api-backend              │
              │ 🟢 dashboard                │
              │ 🔴 mobile-app               │
              └─────────────────────────────┘
```

---

# 🚀 Proposta

A aplicação acompanha sessões de agentes e apresenta seus estados através de uma interface compacta.

O comportamento principal é:

```text
           Sem atividade
                │
                ▼
          ┌───────────┐
          │   Hidden  │
          └─────┬─────┘
                │
          atividade detectada
                │
                ▼
          ┌───────────┐
          │   Peek    │
          └─────┬─────┘
                │
             usuário
              clica
                │
                ▼
          ┌───────────┐
          │   Open    │
          └───────────┘
```

A implementação do protótipo utiliza exatamente os estados `hidden`, `peek` e `open`.

---

# 🧠 Conceito

O produto possui quatro conceitos principais:

### Sessions

Cada execução de um agente representa uma sessão.

### Events

As sessões produzem eventos como:

* `SessionStart`
* `BeforeTool`
* `Notification`
* `AfterTool`
* `AfterAgent`

### Status

Os eventos são transformados em estados visuais:

* `idle`
* `working`
* `waiting`
* `done`
* `error`

### Permissions

Quando um agente precisa executar uma operação que exige autorização, a Island apresenta uma solicitação ao usuário.

---

# 🎨 Interface

## Hidden

Quando nenhuma sessão precisa de atenção, a interface permanece praticamente invisível.

```text
              ━━━━━
```

---

## Peek

Quando existe atividade:

```text
┌───────────────────────────────────────┐
│ 🔵 api-backend · Rodando pytest -q   │
└───────────────────────────────────────┘
```

Quando uma sessão precisa da atenção do usuário:

```text
┌───────────────────────────────────────┐
│ 🟡 api-backend precisa de você       │
└───────────────────────────────────────┘
```

---

## Open

Ao clicar na Island:

```text
┌──────────────────────────────────────────┐
│ 🟡 Precisa de você                   ×  │
│                                          │
│ 🟣 loja-online                           │
│    Lendo src/cart.ts                     │
│                                          │
│ 🟡 api-backend                           │
│    Quer rodar: pip install httpx         │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ api-backend quer executar:           │ │
│ │                                      │ │
│ │ pip install httpx                    │ │
│ │                                      │ │
│ │       [ Negar ]  [ Permitir ]       │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

O protótipo já implementa a representação de múltiplas sessões e solicitações de permissão.

---

# 🔄 Estados

Cada sessão pode possuir um dos seguintes estados:

| Estado    | Descrição                       |
| --------- | ------------------------------- |
| `idle`    | Sessão conectada, sem atividade |
| `working` | Agente executando uma tarefa    |
| `waiting` | Agente aguardando interação     |
| `done`    | Tarefa concluída                |
| `error`   | Execução apresentou erro        |

O protótipo utiliza esses estados para determinar tanto a aparência do personagem quanto o comportamento da Island.

---

# 🤖 Personagem

A Island possui um pequeno personagem visual que representa o estado atual do agente.

O personagem é renderizado utilizando Canvas e possui diferentes comportamentos para cada estado.

```text
idle
 ↓
movimento sutil

working
 ↓
animação contínua

waiting
 ↓
movimento de atenção

done
 ↓
animação de conclusão

error
 ↓
animação de erro
```

Além do movimento, o personagem altera:

* cor;
* expressão;
* olhos;
* escala;
* posição;
* animação.

A implementação atual utiliza Canvas para realizar essa renderização.

---

# 🧩 Arquitetura

A arquitetura proposta para a versão real é:

```text
┌─────────────────────────────┐
│         Gemini CLI          │
│                             │
│ Agent → Tools → Commands    │
└──────────────┬──────────────┘
               │
               │ Hooks / Events
               ▼
┌─────────────────────────────┐
│      Event Collector        │
│                             │
│ SessionStart                │
│ BeforeTool                  │
│ Notification                │
│ AfterTool                   │
│ AfterAgent                  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│      Local Agent Service    │
│                             │
│ Session Manager             │
│ Event Processor             │
│ Permission Manager          │
│ State Manager               │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│       Desktop Interface     │
│                             │
│       Gemini CLI Island     │
└─────────────────────────────┘
```

---

# 🏗️ Stack proposta

A versão desktop poderá utilizar:

* **Electron**
* **React**
* **TypeScript**
* **Tailwind CSS**
* **Node.js**
* **IPC**
* **SQLite** ou armazenamento local

A escolha de Electron é voltada principalmente para facilitar a integração com:

* processos;
* terminal;
* filesystem;
* hooks;
* comunicação entre processos.

Uma alternativa futura é avaliar **Tauri** caso o consumo de recursos seja uma prioridade.

---

# 📁 Estrutura do projeto

Uma estrutura inicial proposta:

```text
gemini-cli-island/
│
├── apps/
│   ├── desktop/
│   │   ├── electron/
│   │   │   ├── main.ts
│   │   │   ├── preload.ts
│   │   │   └── ipc/
│   │   │
│   │   └── renderer/
│   │       ├── components/
│   │       │   ├── Island/
│   │       │   ├── SessionList/
│   │       │   ├── Permission/
│   │       │   └── AgentStatus/
│   │       │
│   │       ├── hooks/
│   │       ├── stores/
│   │       └── App.tsx
│   │
│   └── agent-service/
│       ├── hooks/
│       ├── sessions/
│       ├── permissions/
│       └── processes/
│
├── packages/
│   ├── domain/
│   ├── shared/
│   └── agent-adapters/
│       ├── gemini/
│       ├── claude/
│       └── codex/
│
├── docs/
│   ├── architecture.md
│   ├── events.md
│   ├── security.md
│   └── permissions.md
│
├── package.json
└── README.md
```

---

# 🧱 Domain Model

## Session

```typescript
interface Session {
  id: string;
  projectName: string;
  cwd: string;

  status:
    | 'idle'
    | 'working'
    | 'waiting'
    | 'done'
    | 'error';

  currentTask?: string;

  startedAt: string;
  updatedAt: string;

  processId?: number;
}
```

---

## AgentEvent

```typescript
interface AgentEvent {
  id: string;
  sessionId: string;

  type:
    | 'SessionStart'
    | 'BeforeTool'
    | 'Notification'
    | 'AfterTool'
    | 'AfterAgent';

  timestamp: string;

  payload: Record<string, unknown>;
}
```

---

## PermissionRequest

```typescript
interface PermissionRequest {
  id: string;
  sessionId: string;

  command: string;

  riskLevel:
    | 'low'
    | 'medium'
    | 'high';

  status:
    | 'pending'
    | 'approved'
    | 'denied';

  createdAt: string;
}
```

---

# 🔌 Hooks

Os hooks são responsáveis por conectar os agentes à aplicação.

Um evento pode ser representado como:

```json
{
  "event": "BeforeTool",
  "sessionId": "ses_123",
  "timestamp": "2026-10-01T12:10:20Z",
  "payload": {
    "toolName": "run_shell_command",
    "toolInput": {
      "command": "npm test"
    }
  }
}
```

O protótipo atualmente simula o payload e apresenta o último evento recebido no painel lateral.

Na versão real, esses eventos deverão ser provenientes dos hooks reais do agente.

---

# 🔐 Sistema de permissões

Uma das funcionalidades centrais é permitir que o usuário controle operações executadas pelo agente.

Exemplo:

```text
Agent
 │
 │ solicita comando
 ▼
Permission Manager
 │
 ▼
Risk Analysis
 │
 ├── Safe
 │
 └── Requires approval
          │
          ▼
       User
       /   \
    Allow  Deny
```

### Exemplos

Operações potencialmente de baixo risco:

```bash
npm test
npm run lint
git status
git diff
```

Operações que podem exigir confirmação:

```bash
npm install package
npm uninstall package
docker compose up
```

Operações potencialmente destrutivas:

```bash
rm -rf
git reset --hard
DROP DATABASE
chmod
```

A classificação definitiva de risco ainda faz parte da implementação futura.

---

# 🛡️ Segurança

A aplicação deverá seguir uma abordagem **local-first**.

Por padrão:

* código não deve ser enviado para servidores externos;
* prompts não devem ser armazenados remotamente;
* comandos devem permanecer locais;
* logs devem permanecer locais;
* operações sensíveis devem exigir autorização.

A comunicação entre o processo principal e a interface deverá utilizar IPC controlado.

```text
React
  │
  │ IPC
  ▼
Preload
  │
  ▼
Electron Main
  │
  ├── Process Manager
  ├── Hook Manager
  └── Permission Manager
```

---

# 🖥️ Sessões

Cada sessão representa uma execução independente de um agente.

Exemplo:

```json
{
  "id": "ses_123",
  "projectName": "loja-online",
  "cwd": "C:\\dev\\loja-online",
  "status": "working",
  "currentTask": "corrigir o total do carrinho"
}
```

O projeto deve ser identificado principalmente através do diretório de trabalho (`cwd`).

No protótipo, os projetos são simulados e possuem informações específicas de tarefa, arquivo, testes e comandos.

---

# 🔁 Fluxo de execução

Um fluxo completo pode ser:

```text
gemini
   │
   ▼
SessionStart
   │
   ▼
Session created
   │
   ▼
Agent starts task
   │
   ▼
BeforeTool
   │
   ▼
working
   │
   ▼
Tool execution
   │
   ├──────────────┐
   │              │
   ▼              ▼
Success        Permission
   │              │
   │          ┌───┴───┐
   │          ▼       ▼
   │        Allow   Deny
   │          │       │
   └────┬─────┘       │
        ▼             ▼
      Agent         Agent
     continues      adapts
        │
        ▼
   AfterAgent
        │
        ▼
       done
```

---

# 📊 Futuro: Observabilidade

Embora o MVP seja focado em UX, o projeto pode evoluir para uma ferramenta de observabilidade de agentes.

Possíveis métricas:

```text
Sessions
├── total
├── active
├── completed
└── failed

Tools
├── read_file
├── replace
├── run_shell_command
└── ...

Permissions
├── requested
├── approved
└── denied
```

Também seria possível apresentar:

```text
Tempo trabalhando
Tempo aguardando
Tempo ocioso
Quantidade de ferramentas executadas
Quantidade de permissões solicitadas
Quantidade de erros
```

---

# 🔌 Multi-Agent

Apesar de o projeto inicialmente ser direcionado ao Gemini CLI, a arquitetura pode evoluir para suportar diferentes agentes.

```text
                 ┌── Gemini CLI
                 │
                 ├── Claude Code
Agent Adapters ──┼── Codex CLI
                 │
                 └── Outros agentes
                         │
                         ▼
                Unified Event Model
                         │
                         ▼
                       Island
```

A ideia seria criar uma abstração:

```typescript
interface AgentAdapter {
  name: string;

  detect(): Promise<boolean>;

  getSessions(): Promise<Session[]>;

  subscribe(
    callback: (event: AgentEvent) => void
  ): Unsubscribe;

  respondToPermission(
    requestId: string,
    decision: PermissionDecision
  ): Promise<void>;
}
```

Assim, a interface não precisaria conhecer detalhes específicos de cada agente.

---

# ♿ Acessibilidade

O protótipo já considera alguns recursos de acessibilidade:

* `aria-label`;
* `aria-expanded`;
* `aria-selected`;
* `aria-pressed`;
* `aria-live`;
* navegação por teclado;
* `prefers-reduced-motion`.

A versão final deverá manter essas características.

Atalhos planejados:

| Tecla   | Ação          |
| ------- | ------------- |
| `Enter` | Abrir Island  |
| `Space` | Abrir Island  |
| `Esc`   | Fechar Island |

---

# 📌 Requisitos funcionais

* [ ] Detectar sessões de agentes.
* [ ] Associar sessão ao projeto.
* [ ] Receber eventos dos agentes.
* [ ] Processar eventos.
* [ ] Atualizar estado da sessão.
* [ ] Exibir estado visual.
* [ ] Suportar múltiplas sessões.
* [ ] Selecionar uma sessão.
* [ ] Exibir solicitações de permissão.
* [ ] Aprovar solicitações.
* [ ] Negar solicitações.
* [ ] Exibir erros.
* [ ] Exibir conclusão de tarefas.
* [ ] Registrar histórico de eventos.

---

# ⚙️ Requisitos não funcionais

### Performance

A aplicação deve consumir poucos recursos quando não houver atividade.

### Latência

Eventos devem aparecer na interface praticamente em tempo real.

### Segurança

Operações sensíveis não devem ser executadas sem autorização.

### Privacidade

Os dados devem permanecer localmente por padrão.

### Acessibilidade

A interface deve funcionar com teclado e tecnologias assistivas.

### Disponibilidade

A interface deve continuar disponível independentemente do terminal que iniciou o agente.

---

# 🗺️ Roadmap

## Fase 1 — Protótipo

* [x] Interface da Island
* [x] Estados visuais
* [x] Múltiplas sessões simuladas
* [x] Animações
* [x] Sistema de permissões simulado
* [x] Eventos simulados
* [x] Visualização de payload
* [x] Interface de terminal simulada

O protótipo atual deixa explícito que não existe Gemini CLI, hook ou servidor real por trás da experiência.

---

## Fase 2 — Desktop MVP

* [ ] Electron
* [ ] React
* [ ] TypeScript
* [ ] IPC
* [ ] Hook Manager
* [ ] Session Manager
* [ ] Process detection
* [ ] Gemini CLI integration
* [ ] Eventos reais
* [ ] Permissões reais

### Objetivo

Chegar ao fluxo:

```text
Gemini CLI
    ↓
Hook real
    ↓
Local service
    ↓
Electron
    ↓
Island
```

---

## Fase 3 — Segurança

* [ ] Classificação de comandos
* [ ] Permission policies
* [ ] Allowlist
* [ ] Denylist
* [ ] Confirmações
* [ ] Timeout de permissões
* [ ] Auditoria de comandos

---

## Fase 4 — Observabilidade

* [ ] Histórico de sessões
* [ ] Histórico de eventos
* [ ] Métricas
* [ ] Tempo de execução
* [ ] Estatísticas de ferramentas
* [ ] Estatísticas de permissões
* [ ] Histórico de erros

---

## Fase 5 — Multi-Agent

* [ ] Gemini CLI adapter
* [ ] Claude Code adapter
* [ ] Codex CLI adapter
* [ ] Unified Event Model
* [ ] Agent registry

---

# 🧪 Cenário de exemplo

Imagine que o desenvolvedor esteja trabalhando em:

```text
~/projects/loja-online
```

e execute:

```bash
gemini
```

O agente começa a trabalhar:

```text
🔵 loja-online · Lendo src/cart.ts
```

Depois executa:

```bash
npm test
```

A Island mostra:

```text
🔵 loja-online · Rodando npm test
```

O agente então solicita:

```bash
npm install lodash
```

A Island muda para:

```text
🟡 loja-online precisa de você
```

O usuário abre a interface:

```text
┌─────────────────────────────────────┐
│ 🟡 Precisa de você              ×  │
│                                     │
│ loja-online                         │
│                                     │
│ npm install lodash                  │
│                                     │
│ [ Negar ]             [ Permitir ] │
└─────────────────────────────────────┘
```

Após a aprovação:

```text
🔵 loja-online · Instalando dependência
```

Quando terminar:

```text
🟢 loja-online terminou
```

Depois de alguns segundos:

```text
━━━━━
```

---

# 💡 Visão de longo prazo

O objetivo final não precisa ser apenas uma “Dynamic Island para Gemini”.

A visão pode evoluir para:

> **Uma camada de controle e observabilidade para agentes de desenvolvimento.**

Em vez de acompanhar agentes individualmente:

```text
Terminal
Terminal
Terminal
Terminal
```

o desenvolvedor possui uma única camada:

```text
                Developer
                    │
                    ▼
          ┌──────────────────┐
          │  Agent Interface │
          └────────┬─────────┘
                   │
       ┌───────────┼───────────┐
       ▼           ▼           ▼
    Gemini       Claude       Codex
       │           │           │
       ▼           ▼           ▼
    Project A    Project B    Project C
```

A interface passa a funcionar como um **centro de controle local para agentes de desenvolvimento**.

---

# 📄 Documentação adicional

Documentação futura:

```text
docs/
├── architecture.md
├── events.md
├── security.md
├── permissions.md
├── agent-adapters.md
└── contributing.md
```

---

# 🤝 Contribuição

O projeto ainda está em fase experimental.

Contribuições podem envolver:

* UX/UI;
* integração com agentes;
* arquitetura desktop;
* processamento de eventos;
* segurança;
* animações;
* acessibilidade;
* novos adapters de agentes.

---

# ⚠️ Status

> 🚧 **Experimental / In Development**

O projeto atualmente possui um protótipo funcional de interface que simula sessões, eventos e permissões.

A integração real com agentes de desenvolvimento e execução de comandos ainda faz parte das próximas etapas.

---

# 📜 Licença

A licença ainda não foi definida.