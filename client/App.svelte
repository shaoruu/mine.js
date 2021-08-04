<script>
  import Router from 'svelte-spa-router';

  import Biomes from './pages/Biomes.svelte';
  import Game from './pages/Game.svelte';
  import Home from './pages/Home.svelte';

  const routes = {
    '/': Home,
    '/biomes': Biomes,
    '/game/:world?': Game,
  };
</script>

<Router {routes} />
