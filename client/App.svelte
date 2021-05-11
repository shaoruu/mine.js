<script lang="ts">
  import QS from 'query-string';

  import { WORLD_LIST } from '../shared';

  import Button from './components/button.svelte';
  import { Engine } from './core';
  import { Helper } from './utils';

  let domElement: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let worldListWrapper: HTMLUListElement;

  let locked: boolean;
  let engine: Engine;
  let selected: string;
  let fetchWorlds: Promise<any>;

  const { world } = QS.parse(window.location.search);

  if (world) {
    const worldName = typeof world === 'string' ? world : world.join('');
    engine = new Engine(worldName, {
      container: { canvas: canvas, domElement },
    });

    engine.start();

    engine.on('lock', () => (locked = true));
    engine.on('unlock', () => (locked = false));
  } else {
    fetchWorlds = (async () => {
      const response = await fetch(Helper.getServerURL().toString() + 'worlds');
      return await response.json();
    })();
  }
</script>

<main>
  {#if !!world}
    <div bind:this={domElement}>
      <img src="https://i.imgur.com/ro6oLCL.png" id="crosshair" alt="+" />
      {#if !locked}
        <div id="pause-menu">
          <div on:click={() => engine.lock()} />
          <h2>Game menu</h2>
          <Button on:click={() => engine.lock()}>Back to Game</Button>
          <Button on:click={() => (window.location.href = window.location.href.split('?')[0])}>Quit to Title</Button>
        </div>
      {/if}
    </div>
  {:else}
    <div id="world-list-wrapper">
      <h1 id="world-list-title">Select a world</h1>
      <ul id="world-list" bind:this={worldListWrapper}>
        {#await fetchWorlds}
          <p>...waiting</p>
        {:then data}
          {#each data.worlds as { name, generation, description }}
            <li
              id="world-list-item"
              on:click={() => (selected = name)}
              on:dblclick={() => (window.location.href = window.location.href + '?world=' + name)}
              class={selected === name ? 'selected' : ''}
            >
              <h1>{name}</h1>
              <p>{generation} · {description}</p>
            </li>
          {/each}
        {:catch error}
          <p>An error occurred! {error}</p>
        {/await}
      </ul>
    </div>
  {/if}
</main>

<style>
  main {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  #crosshair {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 10px;
    height: 10px;
    line-height: 20px;
    z-index: 99;
    color: white;
    filter: grayscale(100);
    text-shadow: 1px 1px 0px black;
    text-align: center;
  }

  #pause-menu {
    z-index: 10000000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  #pause-menu,
  #pause-menu > div {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
  }

  #pause-menu > div {
    background: rgba(1, 1, 1, 0.222);
    z-index: -1;
  }

  #pause-menu > h2 {
    color: #ccc;
    margin-bottom: 1.6em;
  }

  #world-list-wrapper {
    width: 100%;
    height: 100%;
    background: #02475e;
    background-size: 48px 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  #world-list-title {
    font-weight: 400;
    font-size: 24px;
    text-align: center;
    color: white;
    margin-bottom: 20px;
  }

  #world-list {
    background-color: rgba(1, 1, 1, 0.247);
    min-height: 30vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-shadow: inset 0px 0px 15px 0px #000000a4;
    list-style: none;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 5px 5rem;
    border-radius: 5px;
  }

  #world-list-item {
    cursor: pointer;
    width: 400px;
    height: 72px;
    border: 2px solid transparent;
    border-radius: 5px;
    display: flex;
    flex-direction: column;
    padding: 8px;
    transition: border-color 0.1s;
  }

  #world-list-item::selection {
    background: transparent;
  }

  #world-list-item > h1 {
    color: white;
    font-size: 20px;
    font-weight: 100;
    width: 380px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  #world-list-item > p {
    color: gray;
    font-size: 20px;
  }

  .selected {
    border-color: rgba(173, 173, 173, 0.74) !important;
  }
</style>
