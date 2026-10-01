import { ref, computed } from 'vue';
import type {
  Session,
  AgentStatus,
  PermissionRequest,
  TerminalLog,
  AgentEvent,
  HookEventType
} from '../types/agent';
import { PROJECTS } from '../constants/projects';

export function useAgentSessions() {
  const sessions = ref<Record<string, Session>>({});
  const logs = ref<Record<string, TerminalLog[]>>({});
  const selectedKey = ref<string>('loja');
  const pendingPermission = ref<PermissionRequest | null>(null);
  const lastPayload = ref<AgentEvent | null>(null);

  const flashUntil = ref<number>(0);
  const flashKind = ref<string>('');
  const flashKey = ref<string>('');

  const scriptRunning = ref<Record<string, boolean>>({});
  let scriptGeneration = 0;

  // Initialize terminal logs
  function seedLogs() {
    Object.keys(PROJECTS).forEach((k) => {
      logs.value[k] = [
        { kind: 'prompt', text: `PS ${PROJECTS[k].cwd}> gemini` },
        { kind: 'sys', text: '(aguardando eventos: use o painel ao lado)' }
      ];
    });
  }
  seedLogs();

  function ensureSession(key: string): Session {
    if (!sessions.value[key]) {
      const proj = PROJECTS[key];
      sessions.value[key] = {
        id: `ses_${key}_01`,
        key,
        projectName: proj ? proj.name : key,
        cwd: proj ? proj.cwd : '',
        status: 'idle',
        detail: '',
        started: false
      };
    }
    return sessions.value[key];
  }

  function addLog(key: string, kind: TerminalLog['kind'], text: string) {
    if (!logs.value[key]) logs.value[key] = [];
    logs.value[key].push({ kind, text });
    if (logs.value[key].length > 200) {
      logs.value[key].shift();
    }
  }

  function emitHook(key: string, eventName: HookEventType, extra: Record<string, unknown> = {}) {
    const proj = PROJECTS[key];
    const event: AgentEvent = {
      session_id: `ses_${key}_01`,
      transcript_path: `C:\\Users\\voce\\.gemini\\tmp\\a1f3\\chats\\session.json`,
      cwd: proj ? proj.cwd : '',
      hook_event_name: eventName,
      timestamp: new Date().toISOString(),
      ...extra
    };
    lastPayload.value = event;
  }

  function flash(key: string, kind: string) {
    flashUntil.value = performance.now() + 3600;
    flashKind.value = kind;
    flashKey.value = key;
  }

  const effectiveStatus = computed<AgentStatus>(() => {
    const sessionList = Object.values(sessions.value);
    if (pendingPermission.value || sessionList.some((s) => s.status === 'waiting')) {
      return 'waiting';
    }
    if (sessionList.some((s) => s.status === 'working')) {
      return 'working';
    }
    if (performance.now() < flashUntil.value) {
      if (flashKind.value === 'done') return 'done';
      if (flashKind.value === 'error') return 'error';
    }
    return 'idle';
  });

  const activeSessionsCount = computed(() => {
    return Object.values(sessions.value).filter(
      (s) => s.status === 'working' || s.status === 'waiting'
    ).length;
  });

  // Action methods
  function startSession(key: string) {
    const proj = PROJECTS[key];
    const s = ensureSession(key);
    s.started = true;
    s.status = 'idle';
    s.detail = '';
    s.currentTask = proj.task;

    addLog(key, 'sys', 'Gemini CLI conectado · hooks ativos');
    addLog(key, 'prompt', `> ${proj.task}`);
    emitHook(key, 'SessionStart');
    flash(key, 'hello');
  }

  function readFile(key: string) {
    const proj = PROJECTS[key];
    const s = ensureSession(key);
    if (!s.started) startSession(key);

    s.status = 'working';
    s.detail = `Lendo ${proj.file}`;
    addLog(key, 'tool', `● read_file  ${proj.file}`);
    emitHook(key, 'BeforeTool', {
      tool_name: 'read_file',
      tool_input: { absolute_path: `${proj.cwd}\\${proj.file.replace(/\//g, '\\')}` }
    });
  }

  function editFile(key: string) {
    const proj = PROJECTS[key];
    const s = ensureSession(key);
    if (!s.started) startSession(key);

    s.status = 'working';
    s.detail = `Editando ${proj.file}`;
    addLog(key, 'tool', `● replace  ${proj.file}`);
    addLog(key, 'del', proj.del);
    addLog(key, 'add', proj.add);
    emitHook(key, 'BeforeTool', {
      tool_name: 'replace',
      tool_input: {
        file_path: `${proj.cwd}\\${proj.file.replace(/\//g, '\\')}`,
        old_string: proj.del.slice(1).trim(),
        new_string: proj.add.slice(1).trim()
      }
    });
  }

  function runCommand(key: string, cmd?: string) {
    const proj = PROJECTS[key];
    const command = cmd || proj.test;
    const s = ensureSession(key);
    if (!s.started) startSession(key);

    s.status = 'working';
    s.detail = `Rodando ${command}`;
    addLog(key, 'tool', `● run_shell_command  ${command}`);
    emitHook(key, 'BeforeTool', {
      tool_name: 'run_shell_command',
      tool_input: { command }
    });
  }

  function requestPermission(key: string, cmd?: string): Promise<boolean> {
    const proj = PROJECTS[key];
    const command = cmd || proj.risky;
    const s = ensureSession(key);
    if (!s.started) startSession(key);

    s.status = 'waiting';
    s.detail = `Quer rodar: ${command}`;
    addLog(key, 'warn', `⚠ Permissão pedida: ${command}`);

    emitHook(key, 'Notification', {
      notification_type: 'ToolPermission',
      message: `Gemini quer executar: ${command}`
    });

    return new Promise((resolve) => {
      pendingPermission.value = {
        id: `perm_${Date.now()}`,
        sessionId: s.id,
        projectName: proj.name,
        command,
        status: 'pending',
        createdAt: new Date().toISOString(),
        resolve
      };
    });
  }

  function answerPermission(approved: boolean) {
    const perm = pendingPermission.value;
    if (!perm) return;

    pendingPermission.value = null;
    const s = sessions.value[selectedKey.value] || Object.values(sessions.value)[0];
    if (s) {
      s.status = scriptRunning.value[s.key] ? 'working' : 'idle';
      s.detail = approved ? 'Comando aprovado' : 'Comando negado';
      addLog(s.key, approved ? 'ok' : 'err', approved ? '✔ Aprovado pela ilha' : '✖ Negado pela ilha');
    }

    if (perm.resolve) {
      perm.resolve(approved);
    }
  }

  function endSession(key: string) {
    const proj = PROJECTS[key];
    const s = ensureSession(key);
    if (!s.started) startSession(key);

    s.status = 'done';
    s.detail = 'Turno concluído';
    addLog(key, 'gem', `✦ Pronto: ${proj.task}. Quer que eu rode os testes de novo?`);
    emitHook(key, 'AfterAgent', { prompt: proj.task });
    flash(key, 'done');
  }

  function failSession(key: string) {
    const proj = PROJECTS[key];
    const s = ensureSession(key);
    if (!s.started) startSession(key);

    s.status = 'error';
    s.detail = 'Falha ao executar';
    addLog(key, 'err', `✖ ${proj.err}`);
    emitHook(key, 'AfterTool', {
      tool_name: 'run_shell_command',
      tool_input: { command: proj.test },
      tool_response: { error: proj.err }
    });
    flash(key, 'error');
  }

  async function runFullScript(key: string) {
    if (scriptRunning.value[key]) return;
    scriptRunning.value[key] = true;
    const currentGen = ++scriptGeneration;
    const proj = PROJECTS[key];

    const wait = (ms: number) =>
      new Promise<boolean>((resolve) =>
        setTimeout(() => resolve(currentGen === scriptGeneration), ms)
      );

    try {
      if (!sessions.value[key]?.started) {
        startSession(key);
        if (!(await wait(1500))) return;
      }
      readFile(key);
      if (!(await wait(1500))) return;

      editFile(key);
      if (!(await wait(1700))) return;

      runCommand(key, proj.test);
      if (!(await wait(1600))) return;

      addLog(key, 'ok', `✔ ${proj.passed}`);
      if (!(await wait(700))) return;

      const approved = await requestPermission(key, proj.risky);
      if (currentGen !== scriptGeneration) return;

      if (approved) {
        runCommand(key, proj.risky);
        if (!(await wait(1500))) return;
        addLog(key, 'ok', '✔ dependência instalada');
      } else {
        addLog(key, 'warn', 'Gemini seguiu por outro caminho, sem a dependência.');
        if (!(await wait(900))) return;
      }

      endSession(key);
    } finally {
      if (currentGen === scriptGeneration) {
        scriptRunning.value[key] = false;
      }
    }
  }

  function resetAll() {
    scriptGeneration++;
    if (pendingPermission.value?.resolve) {
      pendingPermission.value.resolve(false);
      pendingPermission.value = null;
    }
    sessions.value = {};
    scriptRunning.value = {};
    flashUntil.value = 0;
    lastPayload.value = null;
    seedLogs();
  }

  return {
    sessions,
    logs,
    selectedKey,
    pendingPermission,
    lastPayload,
    flashUntil,
    flashKind,
    flashKey,
    effectiveStatus,
    activeSessionsCount,
    startSession,
    readFile,
    editFile,
    runCommand,
    requestPermission,
    answerPermission,
    endSession,
    failSession,
    runFullScript,
    resetAll
  };
}

export type AgentSessionsStore = ReturnType<typeof useAgentSessions>;
