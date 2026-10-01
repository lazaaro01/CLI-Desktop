<script setup lang="ts">
import { computed } from 'vue';
import BuddyCanvas from './BuddyCanvas.vue';
import SessionItem from '../sessions/SessionItem.vue';
import PermissionPrompt from '../permissions/PermissionPrompt.vue';
import type { Session, AgentStatus, PermissionRequest } from '../../types/agent';
import type { PointerCoord } from '../../utils/buddy';

const props = defineProps<{
  status: AgentStatus;
  pointer: PointerCoord;
  reducedMotion?: boolean;
  sessions: Session[];
  selectedKey: string;
  pendingPermission: PermissionRequest | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'selectSession', key: string): void;
  (e: 'respondPermission', approved: boolean): void;
}>();

const activeCount = computed(() => {
  return props.sessions.filter(
    (s) => s.status === 'working' || s.status === 'waiting'
  ).length;
});

const title = computed(() => {
  if (props.pendingPermission) return 'Precisa de você';
  if (activeCount.value > 0) {
    return activeCount.value === 1 ? '1 sessão rodando' : `${activeCount.value} sessões rodando`;
  }
  return props.sessions.length ? 'Tudo tranquilo' : 'Nenhuma sessão';
});
</script>

<template>
  <div class="w-full p-4 text-neutral-100">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <BuddyCanvas
        :size="50"
        :status="status"
        :pointer="pointer"
        :reduced-motion="reducedMotion"
      />
      <div class="flex min-w-0 flex-1 flex-col text-left">
        <strong class="text-sm font-semibold tracking-tight text-white">{{ title }}</strong>
        <span class="text-xs text-neutral-400">Gemini CLI</span>
      </div>
      <button
        type="button"
        @click="emit('close')"
        aria-label="Recolher a ilha"
        class="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-base leading-none text-neutral-300 transition hover:bg-white/20 hover:text-white"
      >
        &times;
      </button>
    </div>

    <!-- Active Sessions List -->
    <ul v-if="sessions.length > 0" class="mt-3 space-y-1.5">
      <SessionItem
        v-for="session in sessions"
        :key="session.key"
        :session="session"
        :is-selected="session.key === selectedKey"
        @select="(k) => emit('selectSession', k)"
      />
    </ul>

    <!-- Empty State -->
    <p v-else class="mt-3 text-center text-xs text-neutral-400">
      Nenhuma sessão do Gemini CLI conectada. Execute <code class="rounded bg-white/10 px-1 py-0.5 font-mono text-neutral-200">gemini</code> no terminal.
    </p>

    <!-- Permission Box -->
    <PermissionPrompt
      v-if="pendingPermission"
      :permission="pendingPermission"
      @respond="(ans) => emit('respondPermission', ans)"
    />
  </div>
</template>
