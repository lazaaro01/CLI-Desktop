<script setup lang="ts">
import type { PermissionRequest } from '../../types/agent';

const props = defineProps<{
  permission: PermissionRequest;
}>();

const emit = defineEmits<{
  (e: 'respond', approved: boolean): void;
}>();
</script>

<template>
  <div class="mt-2.5 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-3.5 text-left text-neutral-100 shadow-lg backdrop-blur-md">
    <p class="mb-2 text-xs font-medium text-amber-200/90">
      <strong class="font-semibold text-amber-300">{{ permission.projectName }}</strong> quer executar:
    </p>
    
    <div class="overflow-x-auto rounded-lg bg-black/60 p-2.5 font-mono text-xs text-neutral-200">
      <code>{{ permission.command }}</code>
    </div>

    <div class="mt-3 flex items-center justify-end gap-2">
      <button
        type="button"
        @click="emit('respond', false)"
        class="rounded-xl bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-neutral-200 transition hover:bg-white/20 active:scale-95"
      >
        Negar
      </button>
      <button
        type="button"
        @click="emit('respond', true)"
        class="rounded-xl bg-amber-400 px-4 py-1.5 text-xs font-bold text-neutral-950 transition hover:bg-amber-300 hover:shadow-md active:scale-95"
      >
        Permitir
      </button>
    </div>
  </div>
</template>
