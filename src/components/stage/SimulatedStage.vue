<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import DynamicIsland from '../island/DynamicIsland.vue';
import type { IslandMode, AgentStatus, Session, PermissionRequest, TerminalLog } from '../../types/agent';
import { PROJECTS, STATUS_COLORS } from '../../constants/projects';
import type { PointerCoord } from '../../utils/buddy';

const props = defineProps<{
  mode: IslandMode;
  status: AgentStatus;
  pointer: PointerCoord;
  reducedMotion?: boolean;
  sessions: Session[];
  selectedKey: string;
  pendingPermission: PermissionRequest | null;
  flashUntil: number;
  flashKind: string;
  flashKey: string;
  logs: TerminalLog[];
}>();

const emit = defineEmits<{
  (e: 'setMode', mode: IslandMode): void;
  (e: 'open'): void;
  (e: 'close'): void;
  (e: 'selectSession', key: string): void;
  (e: 'respondPermission', approved: boolean): void;
  (e: 'pointerEnter'): void;
  (e: 'pointerLeave'): void;
}>();

const termRef = ref<HTMLElement | null>(null);

watch(
  () => props.logs.length,
  () => {
    nextTick(() => {
      if (termRef.value) {
        termRef.value.scrollTop = termRef.value.scrollHeight;
      }
    });
  }
);

function getTabDotColor(key: string): string {
  const session = props.sessions.find((s) => s.key === key);
  if (!session) return '#555b6e';
  const c = STATUS_COLORS[session.status];
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}
</script>

<template>
  <section
    class="relative isolate flex h-[clamp(540px,76vh,720px)] flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
    style="background: radial-gradient(120% 90% at 18% 0%, #2a3578 0%, #161c3f 42%, #0a0d1c 100%)"
    aria-label="Área de trabalho simulada"
  >
    <!-- Dynamic Island pinned at the very top -->
    <DynamicIsland
      :mode="mode"
      :status="status"
      :pointer="pointer"
      :reduced-motion="reducedMotion"
      :sessions="sessions"
      :selected-key="selectedKey"
      :pending-permission="pendingPermission"
      :flash-until="flashUntil"
      :flash-kind="flashKind"
      :flash-key="flashKey"
      @open="emit('open')"
      @close="emit('close')"
      @set-mode="(m) => emit('setMode', m)"
      @select-session="(k) => emit('selectSession', k)"
      @respond-permission="(ans) => emit('respondPermission', ans)"
      @pointer-enter="emit('pointerEnter')"
      @pointer-leave="emit('pointerLeave')"
    />

    <!-- Simulated Windows Terminal Window -->
    <div class="absolute inset-x-4 top-16 bottom-16 sm:inset-x-12 md:inset-x-16 flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#12141a] shadow-2xl">
      <!-- Window Tabs Bar -->
      <div class="flex min-h-[36px] items-end gap-1 overflow-x-auto bg-[#0b0d12] px-2 pt-1.5" role="tablist">
        <button
          v-for="proj in Object.values(PROJECTS)"
          :key="proj.key"
          type="button"
          role="tab"
          :aria-selected="proj.key === selectedKey"
          @click="emit('selectSession', proj.key)"
          :class="[
            'flex items-center gap-2 rounded-t-lg px-3 py-1.5 text-xs font-medium transition',
            proj.key === selectedKey
              ? 'bg-[#12141a] text-neutral-100 shadow'
              : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
          ]"
        >
          <span
            class="h-2 w-2 rounded-full transition-colors"
            :style="{ backgroundColor: getTabDotColor(proj.key) }"
          ></span>
          <span>{{ proj.name }}</span>
        </button>
      </div>

      <!-- Terminal Output Screen -->
      <div
        ref="termRef"
        class="flex-1 overflow-y-auto p-4 font-mono text-[12.5px] leading-relaxed text-[#d9dce6]"
      >
        <div
          v-for="(line, idx) in logs"
          :key="idx"
          :class="[
            'whitespace-pre-wrap break-words',
            line.kind === 'sys' && 'text-[#7d8397]',
            line.kind === 'prompt' && 'mt-1.5 font-medium text-[#f2f4fb]',
            line.kind === 'tool' && 'text-[#7fd6ff]',
            line.kind === 'gem' && 'text-[#b7a8ff]',
            line.kind === 'ok' && 'text-[#86e8b0]',
            line.kind === 'err' && 'text-[#ff8f8f]',
            line.kind === 'warn' && 'text-[#ffc466]',
            line.kind === 'add' && 'bg-[#86e8b0]/10 text-[#86e8b0]',
            line.kind === 'del' && 'bg-[#ff7d7d]/10 text-[#ff8f8f]'
          ]"
        >
          {{ line.text }}
        </div>
      </div>
    </div>

    <!-- Simulated Windows Taskbar -->
    <div
      class="absolute inset-x-0 bottom-0 flex h-11 items-center justify-center gap-2.5 border-t border-white/5 bg-[#080a12]/75 backdrop-blur-md"
      aria-hidden="true"
    >
      <i class="h-6 w-6 rounded-lg bg-white/15"></i>
      <i class="h-6 w-6 rounded-lg bg-[#7fd6ff]/40"></i>
      <i class="h-6 w-6 rounded-lg bg-white/15"></i>
      <i class="h-6 w-6 rounded-lg bg-[#b7a8ff]/40"></i>
      <i class="h-6 w-6 rounded-lg bg-white/15"></i>
    </div>
  </section>
</template>
