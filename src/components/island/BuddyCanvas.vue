<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { BuddyRenderer, type PointerCoord } from '../../utils/buddy';
import type { AgentStatus } from '../../types/agent';

const props = withDefaults(
  defineProps<{
    size?: number;
    status: AgentStatus;
    pointer: PointerCoord;
    reducedMotion?: boolean;
  }>(),
  {
    size: 30,
    reducedMotion: false
  }
);

const canvasRef = ref<HTMLCanvasElement | null>(null);
let renderer: BuddyRenderer | null = null;
let animFrameId: number | null = null;
let lastStatus: AgentStatus = props.status;
let statusChangeTime = 0;

function loop(timestamp: number) {
  const t = timestamp / 1000;
  if (props.status !== lastStatus) {
    lastStatus = props.status;
    statusChangeTime = t;
  }
  const elapsed = t - statusChangeTime;

  if (renderer) {
    renderer.draw(t, props.status, elapsed, props.pointer, props.reducedMotion);
  }
  animFrameId = requestAnimationFrame(loop);
}

onMounted(() => {
  if (canvasRef.value) {
    renderer = new BuddyRenderer(canvasRef.value, props.size);
    statusChangeTime = performance.now() / 1000;
    animFrameId = requestAnimationFrame(loop);
  }
});

watch(
  () => props.size,
  (newSize) => {
    if (canvasRef.value) {
      renderer = new BuddyRenderer(canvasRef.value, newSize);
    }
  }
);

onUnmounted(() => {
  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId);
  }
});
</script>

<template>
  <canvas
    ref="canvasRef"
    aria-hidden="true"
    class="block flex-none"
    :style="{ width: `${size}px`, height: `${size}px` }"
  ></canvas>
</template>
