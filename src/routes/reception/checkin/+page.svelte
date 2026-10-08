<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const occupancyPct = $derived(
		Math.min(100, Math.round((data.currentOccupancy / data.capacity) * 100))
	);
</script>

<svelte:head>
	<title>Check In · Gym House</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="wrap">
	<header class="head">
		<h1>Check in</h1>
		<p class="head-meta tnum">{data.currentOccupancy} of {data.capacity} on floor</p>
	</header>

	<div class="cols">
		<section class="block">
			<h2>Recent door events</h2>
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

		<section class="block">
			<h2>Floor load</h2>
			<div class="load">
				<div class="load-bar" role="img" aria-label="Floor at {occupancyPct} percent">
					<span style="width: {occupancyPct}%"></span>
				</div>
				<p class="load-read tnum">{data.currentOccupancy} / {data.capacity} · {occupancyPct}%</p>
				<p class="load-note">Occupancy is derived from open attendance sessions, not a headcount.</p>
			</div>
		</section>
	</div>
</div>

<style>
	.wrap {
		max-width: 1000px;
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

	.cols {
		display: grid;
		grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
		gap: 3rem;
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

	.load {
		padding-top: 1.25rem;
		display: grid;
		gap: 0.7rem;
	}

	.load-bar {
		height: 6px;
		background: var(--color-ink-800);
	}

	.load-bar span {
		display: block;
		height: 100%;
		background: var(--color-ember);
	}

	.load-read {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 500;
	}

	.load-note {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--color-chalk-faint);
		max-width: 36ch;
		line-height: 1.6;
	}

	@media (max-width: 780px) {
		.cols {
			grid-template-columns: 1fr;
			gap: 2.5rem;
		}
	}
</style>
