<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Recent Visits · Gym House</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="wrap">
	<header class="head">
		<h1>Recent Visits</h1>
		<p class="head-meta tnum">{data.recentVisits.length} events today</p>
	</header>

	<section class="block">
		<h2>Door events</h2>
		<ul class="feed">
			{#each data.recentVisits as v, idx (idx)}
				<li>
					<span class="tnum feed-time">{v.time}</span>
					<span class="feed-name">{v.name}</span>
					<span class="feed-dir {v.status}">
						{v.status === 'checked-in' ? 'in' : 'out'}
					</span>
				</li>
			{/each}
		</ul>
	</section>
</div>

<style>
	.wrap {
		max-width: 900px;
	}

	.head {
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--color-line);
		margin-bottom: 2rem;
	}

	.head h1 {
		font-size: clamp(1.85rem, 3.4vw, 2.6rem);
	}

	.head-meta {
		margin: 0.6rem 0 0;
		font-size: 0.8125rem;
		color: var(--color-chalk-faint);
	}

	.block h2 {
		font-size: 1.0625rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--color-line-strong);
		margin-bottom: 0.25rem;
	}

	.feed {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.feed li {
		display: flex;
		align-items: baseline;
		gap: 1rem;
		padding: 0.65rem 0;
		border-bottom: 1px solid var(--color-line);
		font-size: 0.8125rem;
	}

	.feed-time {
		flex: 0 0 3.5rem;
		color: var(--color-chalk-faint);
	}

	.feed-name {
		flex: 1;
		font-weight: 500;
	}

	.feed-dir {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.feed-dir.checked-in {
		color: var(--color-go);
	}

	.feed-dir.checked-out {
		color: var(--color-chalk-faint);
	}
</style>
