<script lang="ts">
  export let params: { [key: string]: string } = {};

  import { push } from 'svelte-spa-router';
  import { onMount, onDestroy } from 'svelte';

  import Input from '../components/input.svelte';
  import Button from '../components/button.svelte';

  import { Engine } from '../core';
  import { Helper } from '../utils';

  let engine: Engine;
  let domElement: HTMLDivElement;

  let locked = false;
  let chatEnabled = false;
  let loading = false;

  const { world } = params;

  if (!world) {
    push('/');
  }

  onMount(async () => {
    if (!world) {
      return;
    }

    loading = true;

    const response = await fetch(
      Helper.getServerURL({
        path: '/world',
        params: {
          world,
        },
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );
    const worldData = await response.json();

    engine = new Engine(worldData, { container: { domElement } });
    engine.start();

    engine.on('lock', () => (locked = true));
    engine.on('unlock', () => (locked = false));
    engine.on('chat-enabled', () => (chatEnabled = true));
    engine.on('chat-disabled', () => (chatEnabled = false));
    engine.on('focus-loaded', () => (loading = false));
  });

  onDestroy(() => {
    if (engine) {
      engine.stop();
      engine = null;
    }
  });

  const onNameChange = (e: InputEvent) => {
    if (engine) {
      // @ts-ignore
      engine.player.setName(e.target.value);
    }
  };
</script>

<main>
  <div bind:this={domElement} />
  <div>
    <img src="https://i.imgur.com/ro6oLCL.png" id="crosshair" alt="+" />
    {#if !locked && !chatEnabled}
      <div id="pause-menu">
        <div />
        <h2>Game Menu</h2>
        <Input placeholder="Username" value={engine ? engine.player.name : ''} on:input={onNameChange} maxLength="16" />
        <Button on:click={() => engine.lock()}>Back to Game</Button>
        <Button on:click={() => push('/')}>Quit to Title</Button>
      </div>
    {/if}
  </div>
</main>

<style>
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
</style>
