<script setup lang="ts">
import type { AgentEvent } from '../../types/agent';
import { PROJECTS } from '../../constants/projects';

defineProps<{
  targetKey: string;
  lastPayload: AgentEvent | null;
}>();

const emit = defineEmits<{
  (e: 'selectTarget', key: string): void;
  (e: 'start'): void;
  (e: 'read'): void;
  (e: 'edit'): void;
  (e: 'run'): void;
  (e: 'ask'): void;
  (e: 'end'): void;
  (e: 'fail'): void;
  (e: 'runScript'): void;
  (e: 'reset'): void;
}>();
</script>

<template>
  <aside class="flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-[#14171f] dark:text-neutral-100">
    <div class="mb-4">
      <h1 class="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
        Painel da Ilha (Vue 3)
      </h1>
      <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
        Dispare eventos de hooks do Gemini CLI para visualizar os estados dinâmicos da Island.
      </p>
    </div>

    <!-- Target Session Segmented Control -->
    <div class="mb-5">
      <h2 class="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        Sessão Alvo
      </h2>
      <div class="grid grid-cols-2 rounded-xl border border-neutral-200 p-1 dark:border-neutral-800 dark:bg-black/30">
        <button
          v-for="proj in Object.values(PROJECTS)"
          :key="proj.key"
          type="button"
          @click="emit('selectTarget', proj.key)"
          :class="[
            'rounded-lg py-1.5 text-xs font-medium transition',
            targetKey === proj.key
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
          ]"
        >
          {{ proj.name }}
        </button>
      </div>
    </div>

    <!-- Hook Action Buttons -->
    <div class="mb-5">
      <h2 class="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        Eventos do Hook
      </h2>
      <div class="flex flex-col gap-1.5">
        <button
          type="button"
          @click="emit('start')"
          class="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs font-medium text-neutral-800 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-[#1a1e28] dark:text-neutral-200 dark:hover:bg-[#222735]"
        >
          <span>Iniciar sessão</span>
          <span class="font-mono text-[10.5px] text-neutral-400">SessionStart</span>
        </button>
        <button
          type="button"
          @click="emit('read')"
          class="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs font-medium text-neutral-800 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-[#1a1e28] dark:text-neutral-200 dark:hover:bg-[#222735]"
        >
          <span>Ler arquivo</span>
          <span class="font-mono text-[10.5px] text-neutral-400">BeforeTool</span>
        </button>
        <button
          type="button"
          @click="emit('edit')"
          class="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs font-medium text-neutral-800 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-[#1a1e28] dark:text-neutral-200 dark:hover:bg-[#222735]"
        >
          <span>Editar arquivo</span>
          <span class="font-mono text-[10.5px] text-neutral-400">BeforeTool</span>
        </button>
        <button
          type="button"
          @click="emit('run')"
          class="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs font-medium text-neutral-800 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-[#1a1e28] dark:text-neutral-200 dark:hover:bg-[#222735]"
        >
          <span>Rodar comando</span>
          <span class="font-mono text-[10.5px] text-neutral-400">BeforeTool</span>
        </button>
        <button
          type="button"
          @click="emit('ask')"
          class="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs font-medium text-neutral-800 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-[#1a1e28] dark:text-neutral-200 dark:hover:bg-[#222735]"
        >
          <span>Pedir permissão</span>
          <span class="font-mono text-[10.5px] text-amber-500">Notification</span>
        </button>
        <button
          type="button"
          @click="emit('end')"
          class="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs font-medium text-neutral-800 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-[#1a1e28] dark:text-neutral-200 dark:hover:bg-[#222735]"
        >
          <span>Terminar turno</span>
          <span class="font-mono text-[10.5px] text-emerald-500">AfterAgent</span>
        </button>
        <button
          type="button"
          @click="emit('fail')"
          class="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs font-medium text-neutral-800 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-[#1a1e28] dark:text-neutral-200 dark:hover:bg-[#222735]"
        >
          <span>Simular erro</span>
          <span class="font-mono text-[10.5px] text-red-500">AfterTool</span>
        </button>
      </div>

      <button
        type="button"
        @click="emit('runScript')"
        class="mt-3 w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow transition hover:bg-indigo-500 active:scale-98"
      >
        Rodar roteiro completo
      </button>

      <button
        type="button"
        @click="emit('reset')"
        class="mt-1.5 w-full rounded-xl py-2 text-xs font-medium text-neutral-500 transition hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-white/5"
      >
        Reiniciar estado
      </button>
    </div>

    <!-- Payload Inspector -->
    <div class="mt-auto">
      <h2 class="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        Último payload do hook
      </h2>
      <pre class="max-h-48 overflow-auto rounded-xl bg-neutral-100 p-3 font-mono text-[11px] leading-relaxed text-neutral-700 dark:bg-[#0d1017] dark:text-neutral-300">{{ lastPayload ? JSON.stringify(lastPayload, null, 2) : '—' }}</pre>
      <p class="mt-2 text-[11px] text-neutral-400">
        Passe o mouse no topo da tela, clique na Island ou use a tecla <kbd class="rounded border border-neutral-300 px-1 py-0.5 font-mono text-[10px] dark:border-neutral-700">Esc</kbd> para fechar.
      </p>
    </div>
  </aside>
</template>
