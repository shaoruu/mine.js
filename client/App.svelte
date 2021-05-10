<script lang="ts">
  import { Engine } from './core';
  import QS from 'query-string';
  import { WORLD_LIST } from '../shared';

  let domElement: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let worldListWrapper: HTMLUListElement;

  let worldNames: [string, { generation: string; description: string }][];
  let selected: string;

  const { world } = QS.parse(window.location.search);

  if (world) {
    const worldName = typeof world === 'string' ? world : world.join('');
    const engine = new Engine(worldName, {
      container: { canvas: canvas, domElement },
    });

    engine.start();
  } else {
    worldNames = Object.entries(WORLD_LIST);
  }
</script>

<main>
  {#if !!world}
    <div bind:this={domElement}>
      <img src="https://i.imgur.com/ro6oLCL.png" id="crosshair" alt="+" />
    </div>
  {:else}
    <div id="world-list-wrapper">
      <h1 id="world-list-title">Select a world</h1>
      <ul id="world-list" bind:this={worldListWrapper}>
        {#each worldNames as [name, { generation, description }]}
          <li
            id="world-list-item"
            on:click={() => (selected = name)}
            on:dblclick={() => (window.location.href = window.location.href + '/?world=' + name)}
            class={selected === name ? 'selected' : ''}
          >
            <!-- <a href="/?world={name}"> -->
            <h1>{name}</h1>
            <p>{generation} . {description}</p>
            <!-- </a> -->
          </li>
        {/each}
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
    width: 10px;
    height: 10px;
    line-height: 20px;
    margin: -10px 0 0 -10px;
    z-index: 99;
    color: white;
    filter: grayscale(100);
    text-shadow: 1px 1px 0px black;
    text-align: center;
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
    width: 40%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-shadow: inset 0px 0px 15px 0px #000000a4;
    list-style: none;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 5px 0;
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
