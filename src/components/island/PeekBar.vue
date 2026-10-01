<script setup lang="ts">
import BuddyCanvas from './BuddyCanvas.vue';
import type { AgentStatus } from '../../types/agent';
import type { PointerCoord } from '../../utils/buddy';

defineProps<{
  status: AgentStatus;
  pointer: PointerCoord;
  reducedMotion?: boolean;
  title: string;
  badgeCount?: number;
}>();
</script>

<template>
  <div class="flex h-11 w-full items-center gap-2.5 px-4 text-neutral-100">
    <BuddyCanvas
      :size="28"
      :status="status"
      :pointer="pointer"
      :reduced-motion="reducedMotion"
    />
    <span
      class="min-w-0 flex-1 truncate text-xs font-medium tracking-tight text-neutral-200"
      aria-live="polite"
    >
      {{ title }}
    </span>
    <span
      v-if="badgeCount && badgeCount > 0"
      class="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-neutral-300"
    >
      +{{ badgeCount }}
    </span>
  </div>
</template>
