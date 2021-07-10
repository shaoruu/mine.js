<script lang="ts">
  import QS from 'query-string';
  import { Helper } from './utils';

  import Button from './components/button.svelte';
  import Input from './components/input.svelte';
  import { Engine } from './core';
  import { onMount } from 'svelte';

  let engine: Engine;
  let selected: string;
  let wrapper: HTMLDivElement;

  let locked = false;
  let chatEnabled = false;
  let loading = false;

  const { world } = QS.parse(window.location.search);

  const BACKGROUNDS = ['#02475e', '#0a1931', '#5b6d5b', '#374045'];
  const COMMON_HEADERS = {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };

  const fetchWorlds = (async () => {
    if (world) return {};

    const response = await fetch(Helper.getServerURL({ path: '/worlds' }).toString(), COMMON_HEADERS);

    return await response.json();
  })();

  fetchWorlds.then((worlds) => {
    if (Array.isArray(worlds)) {
      selected = worlds[0].name;
    }
  });

  onMount(async () => {
    if (wrapper) {
      document.body.style.background =
        document.documentElement.style.background =
        wrapper.style.background =
          BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
    }

    if (world) {
      loading = true;

      const response = await fetch(
        Helper.getServerURL({
          path: '/world',
          params: {
            world,
          },
        }).toString(),
        COMMON_HEADERS,
      );
      const worldData = await response.json();

      engine = new Engine(worldData);
      engine.start();

      engine.on('lock', () => (locked = true));
      engine.on('unlock', () => (locked = false));
      engine.on('chat-enabled', () => (chatEnabled = true));
      engine.on('chat-disabled', () => (chatEnabled = false));
      engine.on('focus-loaded', () => (loading = false));
    }
  });

  const onNameChange = (e: InputEvent) => {
    if (engine) {
      // @ts-ignore
      engine.player.setName(e.target.value);
    }
  };
</script>

{#if loading}
  <div id="loading">
    <p>loading...</p>
    <div><div /></div>
  </div>
{/if}

<main>
  {#if world}
    <div>
      <img src="https://i.imgur.com/ro6oLCL.png" id="crosshair" alt="+" />
      {#if !locked && !chatEnabled}
        <div id="pause-menu">
          <div />
          <h2>Game menu</h2>
          <Input
            placeholder="Username"
            value={engine ? engine.player.name : ''}
            on:input={onNameChange}
            maxLength="16"
          />
          <Button on:click={() => engine.lock()}>Back to Game</Button>
          <Button on:click={() => (window.location.href = window.location.href.split('?')[0])}>Quit to Title</Button>
        </div>
      {/if}
    </div>
  {:else}
    <div id="world-list-wrapper" bind:this={wrapper}>
      <h1 id="world-list-title">Select a world</h1>
      <ul id="world-list">
        {#await fetchWorlds}
          <p>...waiting</p>
        {:then data}
          {#each data as { name, generation, description, players }}
            <li
              id="world-list-item"
              on:click={() => (selected = name)}
              on:dblclick={() => (window.location.href = window.location.href + '?world=' + name)}
              class={selected === name ? 'selected' : ''}
            >
              <div>
                <h1>{name}</h1>
                <h3>{players} / 10</h3>
              </div>
              <div>
                <p>{generation} · {description}</p>
                <ul>
                  <li />
                  <li />
                  <li />
                </ul>
              </div>
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
    background: rgba(1, 1, 1, 0.1);
    z-index: -1;
  }

  #pause-menu > h2 {
    color: #ccc;
    margin-bottom: 1em;
  }
  #world-list-wrapper {
    width: 100%;
    height: 100%;
    background: #222;
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

  #world-list-item > div {
    color: white;
    width: 380px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    overflow: hidden;
    margin: 4px 0;
  }

  #world-list-item > div > h1,
  #world-list-item > div > h3 {
    font-size: 20px;
    font-weight: 100;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  #world-list-item > div > h3 {
    font-size: 16px;
  }

  #world-list-item > div > p {
    color: gray;
    font-size: 20px;
  }

  #world-list-item > div > ul {
    list-style: none;
    display: flex;
    align-items: flex-end;
  }

  #world-list-item > div > ul > li {
    content: '';
    height: 16px;
    width: 3px;
    margin: 2px;
    background: green;
  }

  #world-list-item > div > ul > li:nth-child(1) {
    height: 8px;
  }

  #world-list-item > div > ul > li:nth-child(2) {
    height: 12px;
  }

  #world-list-item > div > ul > li:nth-child(3) {
    /* background: linear-gradient(0deg, green 0%, green 80%, gray 81%, gray 100%); */
    background: green;
  }

  #loading {
    width: 100vw;
    height: 100vh;
    position: fixed;
    z-index: 10000000000000000;
    background: #334257;
    top: 0;
    left: 0;
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  #loading > div {
    margin: 20px;
    width: 200px;
    height: 5px;
    background: gray;
  }

  #loading > div > div {
    height: 100%;
    background: green;
    animation: test 0.8s forwards;
  }

  @keyframes test {
    0% {
      width: 20%;
    }

    20% {
      width: 30%;
    }

    40% {
      width: 60%;
    }

    70% {
      width: 70%;
    }

    90% {
      width: 95%;
    }
  }

  .selected {
    border-color: rgba(173, 173, 173, 0.74) !important;
  }
</style>
