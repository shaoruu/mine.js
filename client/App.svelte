<script lang="ts">
  import { Engine } from './core';

  let domElement: HTMLDivElement;
  let canvas: HTMLCanvasElement;

  const engine = new Engine({
    world: { generator: 'sin-cos' },
    container: { canvas: canvas, domElement },
  });

  engine.start();
</script>

<main>
  <div bind:this={domElement}>
    <canvas bind:this={canvas} />
  </div>
</main>

<svelte:head>
  <title>MineJS - Game</title>
</svelte:head>

<style>
  main {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
