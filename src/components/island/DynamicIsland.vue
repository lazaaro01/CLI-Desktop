<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import PeekBar from './PeekBar.vue';
import OpenPanel from './OpenPanel.vue';
import type { IslandMode, AgentStatus, Session, PermissionRequest } from '../../types/agent';
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

const openElRef = ref<HTMLElement | null>(null);
const islandHeight = ref(5);

function updateHeight() {
  if (props.mode === 'hidden') {
    islandHeight.value = 5;
  } else if (props.mode === 'peek') {
    islandHeight.value = 44;
  } else if (props.mode === 'open') {
    nextTick(() => {
      if (openElRef.value) {
        islandHeight.value = openElRef.value.offsetHeight;
      }
    });
  }

  nextTick(() => {
    if (window.electronAPI?.setIslandBounds) {
      const targetW = props.mode === 'hidden' ? 140 : props.mode === 'peek' ? 370 : 440;
      const targetH = props.mode === 'hidden' ? 24 : props.mode === 'peek' ? 60 : (islandHeight.value + 16);
      window.electronAPI.setIslandBounds({ width: targetW, height: targetH });
    }
  });
}

watch(
  () => [props.mode, props.sessions, props.pendingPermission],
  () => {
    updateHeight();
  },
  { deep: true }
);

onMounted(() => {
  updateHeight();
});

// Peek text logic
const peekInfo = computed(() => {
  const l = props.sessions;
  const waiting = l.filter((s) => s.status === 'waiting');
  const working = l.filter((s) => s.status === 'working');
  const activeCount = l.filter((s) => s.status === 'waiting' || s.status === 'working').length;

  if (waiting.length > 0) {
    return {
      text: `${waiting[0].projectName} precisa de você`,
      badge: activeCount - 1
    };
  }
  if (working.length > 0) {
    return {
      text: `${working[0].projectName} · ${working[0].detail || 'Executando tarefa'}`,
      badge: working.length - 1
    };
  }
  if (performance.now() < props.flashUntil) {
    const flashSession = l.find((s) => s.key === props.flashKey);
    const projName = flashSession ? flashSession.projectName : props.flashKey;
    const msg =
      props.flashKind === 'done'
        ? ' terminou'
        : props.flashKind === 'error'
        ? ' deu erro'
        : ' conectou';
    return {
      text: `${projName}${msg}`,
      badge: 0
    };
  }
  return {
    text: l.length > 0 ? 'Tudo quieto por aqui' : 'Nenhuma sessão conectada',
    badge: 0
  };
});

function handleIslandClick() {
  if (props.mode !== 'open') {
    emit('open');
  }
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.key === 'Enter' || e.key === ' ') && props.mode !== 'open') {
    e.preventDefault();
    emit('open');
  }
}
</script>

<template>
  <div class="relative w-full">
    <!-- Hover hotspot on the very top edge -->
    <div
      class="absolute top-0 left-1/2 z-20 h-8 w-64 -translate-x-1/2 cursor-pointer"
      @mouseenter="emit('pointerEnter')"
      @mouseleave="emit('pointerLeave')"
      @click="handleIslandClick"
    ></div>

    <!-- Island capsule -->
    <div
      tabindex="0"
      aria-label="Ilha do Gemini CLI"
      :aria-expanded="mode === 'open'"
      @keydown="handleKeydown"
      @mouseenter="emit('pointerEnter')"
      @mouseleave="emit('pointerLeave')"
      @click="handleIslandClick"
      :class="[
        'absolute top-0 left-1/2 z-30 -translate-x-1/2 overflow-hidden bg-black text-white shadow-2xl transition-all duration-500',
        reducedMotion ? 'transition-none' : '',
        mode === 'hidden'
          ? 'w-[110px] rounded-b-[22px] cursor-pointer'
          : mode === 'peek'
          ? 'w-[min(340px,calc(100vw-48px))] rounded-b-[24px] cursor-pointer hover:shadow-black/60'
          : 'w-[min(410px,calc(100vw-48px))] rounded-b-[30px] cursor-default'
      ]"
      :style="{
        height: `${islandHeight}px`,
        transitionTimingFunction: 'cubic-bezier(0.2, 0.85, 0.25, 1.08)'
      }"
    >
      <!-- Peek content view -->
      <div
        :class="[
          'absolute top-0 left-1/2 w-[min(340px,calc(100vw-48px))] -translate-x-1/2 transition-opacity duration-200',
          mode === 'peek'
            ? 'visible opacity-100 delay-100'
            : 'invisible opacity-0 pointer-events-none'
        ]"
      >
        <PeekBar
          :status="status"
          :pointer="pointer"
          :reduced-motion="reducedMotion"
          :title="peekInfo.text"
          :badge-count="peekInfo.badge"
        />
      </div>

      <!-- Open content view -->
      <div
        ref="openElRef"
        :class="[
          'absolute top-0 left-1/2 w-[min(410px,calc(100vw-48px))] -translate-x-1/2 transition-opacity duration-200',
          mode === 'open'
            ? 'visible opacity-100 delay-100'
            : 'invisible opacity-0 pointer-events-none'
        ]"
      >
        <OpenPanel
          :status="status"
          :pointer="pointer"
          :reduced-motion="reducedMotion"
          :sessions="sessions"
          :selected-key="selectedKey"
          :pending-permission="pendingPermission"
          @close="emit('close')"
          @select-session="(k) => emit('selectSession', k)"
          @respond-permission="(approved) => emit('respondPermission', approved)"
        />
      </div>
    </div>
  </div>
</template>
