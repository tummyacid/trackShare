<script>
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
	
	export let count;
	export let name;
	
	function addValue(delta) {
		count += delta;
		dispatch('change', count);
	}
</script>

<style>
	button {
		width: 2rem
	}
</style>

<!-- <div>
	<button on:click={() => addValue(-1)}>
		-
	</button>
	<button on:click={() => addValue(1)}>
		+
	</button>	
</div> -->

<div style="width:100%;text-align:center;font-weight:600">
	{name.innerHTML}
</div>