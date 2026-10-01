import type { ProjectConfig, AgentStatus } from '../types/agent';

export const PROJECTS: Record<string, ProjectConfig> = {
  loja: {
    key: 'loja',
    name: 'loja-online',
    cwd: 'C:\\dev\\loja-online',
    file: 'src/cart.ts',
    test: 'npm test',
    passed: '12 testes passaram',
    risky: 'npm install lodash',
    task: 'corrigir o total do carrinho',
    del: '-   const total = items.length * price;',
    add: '+   const total = items.reduce((s, i) => s + i.price * i.qty, 0);',
    err: "TypeError: Cannot read properties of undefined (reading 'price')"
  },
  api: {
    key: 'api',
    name: 'api-backend',
    cwd: 'C:\\dev\\api-backend',
    file: 'routes/users.py',
    test: 'pytest -q',
    passed: '31 passed in 2.4s',
    risky: 'pip install httpx',
    task: 'validar o e-mail no cadastro',
    del: '-     email = data["email"]',
    add: '+     email = validate_email(data["email"])',
    err: 'ConnectionRefusedError: 127.0.0.1:5432'
  }
};

export const STATUS_COLORS: Record<AgentStatus, [number, number, number]> = {
  idle: [185, 167, 255],     // Purple pastel
  working: [125, 180, 255],  // Blue pastel
  waiting: [255, 196, 102],  // Amber
  done: [134, 232, 176],     // Mint green
  error: [255, 125, 125]     // Red pastel
};

export const STATUS_TEXTS: Record<AgentStatus, string> = {
  idle: 'Conectado',
  working: 'Trabalhando...',
  waiting: 'Aguardando você',
  done: 'Turno concluído',
  error: 'Com erro'
};
