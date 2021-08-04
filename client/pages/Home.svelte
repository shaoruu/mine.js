<script lang="ts">
  import { push } from 'svelte-spa-router';
  import { onMount } from 'svelte';
  import QS from 'query-string';

  import { Helper } from '../utils';

  let selected: string;
  let wrapper: HTMLDivElement;

  let loading = false;

  const { world } = QS.parse(window.location.search);

  const BACKGROUNDS = ['#02475e', '#0a1931', '#5b6d5b', '#374045'];

  const goToGame = (world: string | string[]) => {
    push('/game/' + world);
  };

  const fetchWorlds = (async () => {
    if (world) {
      goToGame(world);
      return [];
    }

    const response = await fetch(Helper.getServerURL({ path: '/worlds' }).toString(), {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    return await response.json();
  })();

  fetchWorlds.then((worlds) => {
    if (Array.isArray(worlds) && worlds.length) {
      selected = worlds[0].name;
    }
  });

  onMount(async () => {
    if (wrapper) {
      wrapper.style.background = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
    }
  });
</script>

<main>
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
            on:dblclick={() => goToGame(name)}
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
</main>

<style>
  main {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
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
    padding: 3rem 5rem;
    border-radius: 5px;
  }

  #world-list-item {
    cursor: pointer;
    width: 400px;
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

  .selected {
    border-color: rgba(173, 173, 173, 0.74) !important;
  }
</style>
