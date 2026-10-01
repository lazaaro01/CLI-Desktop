<script setup lang="ts">
import { computed } from 'vue';
import type { Session } from '../../types/agent';
import { STATUS_COLORS, STATUS_TEXTS } from '../../constants/projects';

const props = defineProps<{
  session: Session;
  isSelected?: boolean;
}>();

const emit = defineEmits<{
  (e: 'select', key: string): void;
}>();

const dotColor = computed(() => {
  const c = STATUS_COLORS[props.session.status];
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
});

const subtitle = computed(() => {
  if (props.session.status === 'working') {
    return props.session.detail || 'Trabalhando...';
  }
  if (props.session.detail && props.session.status !== 'idle') {
    return props.session.detail;
  }
  return STATUS_TEXTS[props.session.status] || 'Conectado';
});
</script>

<template>
  <li>
    <button
      type="button"
      @click="emit('select', session.key)"
      :class="[
        'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition',
        isSelected
          ? 'bg-white/15 text-white ring-1 ring-white/20'
          : 'bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white'
      ]"
    >
      <span
        class="h-2.5 w-2.5 flex-none rounded-full transition-transform group-hover:scale-125"
        :style="{ backgroundColor: dotColor }"
      ></span>
      <b class="flex-none text-xs font-semibold tracking-wide text-neutral-100">{{ session.projectName }}</b>
      <span class="min-w-0 flex-1 truncate text-xs text-neutral-400 group-hover:text-neutral-300">
        {{ subtitle }}
      </span>
    </button>
  </li>
</template>
