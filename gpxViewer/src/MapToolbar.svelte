<script>
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
	let eye = true;
	function clickEye() {
		eye = !eye;
		dispatch('click-eye', eye);
	}
	
	let lines = true;
	function clickLines() {
		lines = !lines;
		dispatch('click-lines', lines);
	}
	
	let loadedRoutes = [];
    function clickRoute(routeId) {    
		if (loadedRoutes.includes(routeId))
		{
			//todo toggle this layer that already exists
			console.log('cache hit route id ' + routeId);
		}
		else
		{
			dispatch('click-route', {detail: routeId});
			loadedRoutes.push(routeId);
			console.log('loaded route id ' + routeId);
		}
	}
	$: if(loadedRoutes) {
		console.log("cached routes:" + loadedRoutes);
	}
</script>

<style>
	.selected {
		background-opacity: 25%;
		background-color: #DCC;
	}
	
	button {
		width: 2rem;
		height: 2rem;
		border: 0;
		background-color: transparent;
		transition-property: background-color, background-opacity; 
		transition-duration: 250ms;
		border-radius: 0.375rem;
	}
	
	.single-click:hover {
		background-opacity: 50%;
		background-color: lightgray;
	}
</style>

<!-- Icons from heroicons.dev -->

<button type="button" class="single-click" on:click={() => dispatch('click-reset')} title="Reset View">
<svg fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
</button>

<button type="button" on:click={clickEye} class:selected={eye} title="Show Markers">
	<svg fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="{eye ? 2 : 1}" viewBox="0 0 24 24" stroke="currentColor">
	{#if eye}
		<path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
	{:else}
		<path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
	{/if}
	</svg>
</button>
<a href="https://github.com/tummyacid/trackShare" target="_blank">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
</a>
<div id="navbar">
    <button on:click={() => clickRoute(0)} class:selected={!loadedRoutes.includes(0)}><small>WA BDR</small></button> 
    <button on:click={() => clickRoute(1)} class:selected={!loadedRoutes.includes(1)}><small>OR BDR</small></button> 
    <button on:click={() => clickRoute(2)} class:selected={!loadedRoutes.includes(2)}><small>NV BDR</small></button> 
    <button on:click={() => clickRoute(4)} class:selected={!loadedRoutes.includes(4)}><small>ID BDR</small></button> 
    <button on:click={() => clickRoute(5)} class:selected={!loadedRoutes.includes(5)}><small>UT BDR</small></button> 
    <button on:click={() => clickRoute(6)} class:selected={!loadedRoutes.includes(6)}><small>TAT</small></button> 
    <button on:click={() => clickRoute(15)} class:selected={!loadedRoutes.includes(15)}><small>TCT West</small></button> 
    <button on:click={() => clickRoute(3)} class:selected={!loadedRoutes.includes(3)}><small>PA BDR</small></button> 
    <button on:click={() => clickRoute(14)} class:selected={!loadedRoutes.includes(14)}><small>Oly Peninsula</small></button> 
    <button on:click={() => clickRoute(7)} class:selected={!loadedRoutes.includes(7)}><small>Spring</small></button> 
    <button on:click={() => clickRoute(10)} class:selected={!loadedRoutes.includes(10)}><small>Touratech</small></button> 
    <button on:click={() => clickRoute(8)} class:selected={!loadedRoutes.includes(8)}><small>Banff</small></button> 
    <button on:click={() => clickRoute(9)} class:selected={!loadedRoutes.includes(9)}><small>Sunshine Coast</small></button> 
    <button on:click={() => clickRoute(11)} class:selected={!loadedRoutes.includes(11)}><small>Prince Rupert</small></button> 
    <button on:click={() => clickRoute(12)} class:selected={!loadedRoutes.includes(12)}><small>Duffy Lake</small></button> 
    <button on:click={() => clickRoute(13)} class:selected={!loadedRoutes.includes(13)}><small>Manning Lake</small></button> 
</div>