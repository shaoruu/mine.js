<script lang="ts">
  console.log('hi2');
</script>

<main>
  <canvas id="mine-container" />
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

  #mine-container {
    background: black;
    width: 100%;
    height: 100%;
  }
</style>
