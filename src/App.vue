<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import SimulatedStage from './components/stage/SimulatedStage.vue';
import DynamicIsland from './components/island/DynamicIsland.vue';
import ControlPanel from './components/dev-panel/ControlPanel.vue';
import { useAgentSessions } from './composables/useAgentSessions';
import { useIslandState } from './composables/useIslandState';
import type { Session, PermissionRequest, AgentEvent } from './types/agent';

// Determine view mode: 'island' (floating transparent widget), 'controller' (debug panel), or 'full' (both)
const params = new URLSearchParams(window.location.search);
const viewParam = params.get('view');
const currentView = ref<'island' | 'controller' | 'full'>(
  viewParam === 'island' ? 'island' : viewParam === 'controller' ? 'controller' : 'full'
);

const {
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
} = useAgentSessions();

const {
  mode,
  pointer,
  reducedMotion,
  setMode,
  openIsland,
  collapseIsland,
  handlePointerEnter,
  handlePointerLeave
} = useIslandState(
  () => effectiveStatus.value,
  () => !!pendingPermission.value,
  () => activeSessionsCount.value
);

const sessionList = computed(() => Object.values(sessions.value));
const currentLogs = computed(() => logs.value[selectedKey.value] || []);

function selectSessionKey(k: string) {
  selectedKey.value = k;
  syncToElectron();
}

function handleRespondPermission(approved: boolean) {
  answerPermission(approved);
  if (window.electronAPI?.respondPermission) {
    window.electronAPI.respondPermission(approved);
  }
}

// State synchronization for Electron multi-window setup
function syncToElectron() {
  if (currentView.value === 'controller' && window.electronAPI?.syncState) {
    window.electronAPI.syncState({
      sessions: sessions.value,
      selectedKey: selectedKey.value,
      pendingPermission: pendingPermission.value,
      lastPayload: lastPayload.value,
      flashUntil: flashUntil.value,
      flashKind: flashKind.value,
      flashKey: flashKey.value
    });
  }
}

watch(
  [sessions, pendingPermission, lastPayload, flashUntil],
  () => {
    syncToElectron();
  },
  { deep: true }
);

onMounted(() => {
  if (currentView.value === 'island') {
    document.documentElement.classList.add('bg-transparent');
    document.body.classList.add('bg-transparent');

    // Island listens to state from Controller
    if (window.electronAPI?.onSyncState) {
      window.electronAPI.onSyncState((state: any) => {
        if (state) {
          if (state.sessions) sessions.value = state.sessions;
          if (state.selectedKey) selectedKey.value = state.selectedKey;
          if (state.pendingPermission !== undefined) pendingPermission.value = state.pendingPermission;
          if (state.lastPayload !== undefined) lastPayload.value = state.lastPayload;
          if (state.flashUntil !== undefined) flashUntil.value = state.flashUntil;
          if (state.flashKind !== undefined) flashKind.value = state.flashKind;
          if (state.flashKey !== undefined) flashKey.value = state.flashKey;
        }
      });
    }
  }

  if (currentView.value === 'controller') {
    // Controller listens for permission approval/denial from the Island
    if (window.electronAPI?.onPermissionResponse) {
      window.electronAPI.onPermissionResponse((approved: boolean) => {
        answerPermission(approved);
      });
    }
    syncToElectron();
  }
});
</script>

<template>
  <!-- VIEW 1: Native Floating Island (Desktop Overlay Window) -->
  <div
    v-if="currentView === 'island'"
    class="relative w-screen overflow-hidden bg-transparent select-none pt-0"
  >
    <DynamicIsland
      :mode="mode"
      :status="effectiveStatus"
      :pointer="pointer"
      :reduced-motion="reducedMotion"
      :sessions="sessionList"
      :selected-key="selectedKey"
      :pending-permission="pendingPermission"
      :flash-until="flashUntil"
      :flash-kind="flashKind"
      :flash-key="flashKey"
      @open="openIsland"
      @close="collapseIsland"
      @set-mode="setMode"
      @select-session="selectSessionKey"
      @respond-permission="handleRespondPermission"
      @pointer-enter="handlePointerEnter"
      @pointer-leave="handlePointerLeave"
    />
  </div>

  <!-- VIEW 2: Native Companion Controller Window -->
  <div
    v-else-if="currentView === 'controller'"
    class="min-h-screen bg-[#0b0d12] p-3 text-neutral-100"
  >
    <ControlPanel
      :target-key="selectedKey"
      :last-payload="lastPayload"
      @select-target="selectSessionKey"
      @start="() => { startSession(selectedKey); syncToElectron(); }"
      @read="() => { readFile(selectedKey); syncToElectron(); }"
      @edit="() => { editFile(selectedKey); syncToElectron(); }"
      @run="() => { runCommand(selectedKey); syncToElectron(); }"
      @ask="() => { requestPermission(selectedKey); syncToElectron(); }"
      @end="() => { endSession(selectedKey); syncToElectron(); }"
      @fail="() => { failSession(selectedKey); syncToElectron(); }"
      @run-script="() => runFullScript(selectedKey)"
      @reset="() => { resetAll(); syncToElectron(); }"
    />
  </div>

  <!-- VIEW 3: Full In-Browser Simulator Stage (Web Preview) -->
  <div
    v-else
    class="min-h-screen bg-[#eceef3] text-neutral-900 transition-colors dark:bg-[#0b0d12] dark:text-neutral-100"
  >
    <main class="mx-auto grid max-w-7xl grid-cols-1 gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_340px] xl:p-6">
      <SimulatedStage
        :mode="mode"
        :status="effectiveStatus"
        :pointer="pointer"
        :reduced-motion="reducedMotion"
        :sessions="sessionList"
        :selected-key="selectedKey"
        :pending-permission="pendingPermission"
        :flash-until="flashUntil"
        :flash-kind="flashKind"
        :flash-key="flashKey"
        :logs="currentLogs"
        @open="openIsland"
        @close="collapseIsland"
        @set-mode="setMode"
        @select-session="selectSessionKey"
        @respond-permission="handleRespondPermission"
        @pointer-enter="handlePointerEnter"
        @pointer-leave="handlePointerLeave"
      />

      <ControlPanel
        :target-key="selectedKey"
        :last-payload="lastPayload"
        @select-target="selectSessionKey"
        @start="() => startSession(selectedKey)"
        @read="() => readFile(selectedKey)"
        @edit="() => editFile(selectedKey)"
        @run="() => runCommand(selectedKey)"
        @ask="() => requestPermission(selectedKey)"
        @end="() => endSession(selectedKey)"
        @fail="() => failSession(selectedKey)"
        @run-script="() => runFullScript(selectedKey)"
        @reset="() => { resetAll(); collapseIsland(); }"
      />
    </main>
  </div>
</template>
