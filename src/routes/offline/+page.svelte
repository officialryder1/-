<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<svelte:head>
	<title>Offline · Gym House</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="wrap">
	<p class="mark" aria-hidden="true">offline</p>
	<h1>You're offline</h1>
	<p class="body">
		Gym House needs a connection to load live membership and attendance data. Reconnect and
		the page will pick up where you left off.
	</p>
	<div class="actions">
		<button onclick={() => location.reload()}>Retry</button>
		<button class="ghost" onclick={() => goto('/')}>Go home</button>
	</div>
</div>

<style>
	.wrap {
		min-height: 70vh;
		display: grid;
		align-content: center;
		gap: 1rem;
		max-width: 44ch;
	}

	.mark {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--color-ember);
	}

	h1 {
		font-size: clamp(1.85rem, 3.4vw, 2.6rem);
		margin: 0;
	}

	.body {
		margin: 0;
		color: var(--color-chalk-dim);
		font-size: 1rem;
		line-height: 1.65;
	}

	.actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 0.75rem;
		flex-wrap: wrap;
	}

	.actions button {
		padding: 0.7rem 1.4rem;
		background: var(--color-ember);
		color: var(--color-ink-950);
		border: 1px solid var(--color-ember);
		font-size: 0.9375rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
	}

	.actions button.ghost {
		background: transparent;
		color: var(--color-chalk);
		border-color: var(--color-line-strong);
	}
</style>
