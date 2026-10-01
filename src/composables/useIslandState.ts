import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import type { IslandMode, AgentStatus } from '../types/agent';

export function useIslandState(
  effectiveStatus: () => AgentStatus,
  hasPendingPermission: () => boolean,
  activeCount: () => number
) {
  const mode = ref<IslandMode>('hidden');
  const isHovered = ref(false);
  const pointer = ref({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const reducedMotion = ref(false);

  let hoverTimeout: ReturnType<typeof setTimeout> | null = null;

  function setMode(m: IslandMode) {
    mode.value = m;
  }

  function openIsland() {
    setMode('open');
  }

  function collapseIsland() {
    if (mode.value === 'open') {
      const active = activeCount() > 0;
      const status = effectiveStatus();
      const hasActivity = active || status === 'working' || status === 'waiting';
      setMode(hasActivity || isHovered.value ? 'peek' : 'hidden');
    }
  }

  function handlePointerEnter() {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    isHovered.value = true;
    if (mode.value === 'hidden') {
      setMode('peek');
    }
  }

  function handlePointerLeave() {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    hoverTimeout = setTimeout(() => {
      isHovered.value = false;
      if (mode.value === 'peek') {
        const active = activeCount() > 0;
        const status = effectiveStatus();
        const hasActivity = active || status === 'working' || status === 'waiting';
        if (!hasActivity) {
          setMode('hidden');
        }
      }
    }, 450);
  }

  // Watch for state changes: automatically show Peek or Open when needed
  watch(
    [effectiveStatus, hasPendingPermission, activeCount],
    ([status, hasPending, count]) => {
      if (hasPending) {
        setMode('open');
        return;
      }
      if (mode.value === 'open') return;

      const hasActivity = count > 0 || status === 'working' || status === 'waiting' || status === 'done' || status === 'error';
      if (hasActivity || isHovered.value) {
        setMode('peek');
      } else {
        setMode('hidden');
      }
    }
  );

  function onPointerMove(e: PointerEvent) {
    pointer.value = { x: e.clientX, y: e.clientY };
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && mode.value === 'open') {
      collapseIsland();
    }
  }

  onMounted(() => {
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  onUnmounted(() => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('keydown', onKeyDown);
    if (hoverTimeout) clearTimeout(hoverTimeout);
  });

  return {
    mode,
    isHovered,
    pointer,
    reducedMotion,
    setMode,
    openIsland,
    collapseIsland,
    handlePointerEnter,
    handlePointerLeave
  };
}
