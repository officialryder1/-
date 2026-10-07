<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const s = $derived(data.stats);

	function clock(t: string) {
		return t;
	}
</script>

<svelte:head>
	<title>Overview · Gym House</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="wrap">
	<header class="head">
		<h1>Operations</h1>
		<p class="head-meta tnum">gym-house-001 · {s.currentOccupancy} on floor now</p>
	</header>

	<!-- Metrics breathe in plain layout: no card containers, hairlines only. -->
	<section class="ledger" aria-label="Key numbers">
		<div class="metric">
			<span class="label">Active members</span>
			<span class="figure tnum">{s.activeMembers}</span>
			<span class="delta up tnum">{s.todayCheckIns} in today</span>
		</div>
		<div class="metric">
			<span class="label">On floor</span>
			<span class="figure tnum">{s.currentOccupancy}</span>
			<span class="delta tnum">of {s.totalMembers} on roster</span>
		</div>
		<div class="metric">
			<span class="label">Collected this month</span>
			<span class="figure tnum">₦{(s.monthlyRevenue / 1000).toFixed(1)}k</span>
			<span class="delta up tnum">+12% vs last</span>
		</div>
		<div class="metric">
			<span class="label">Needs attention</span>
			<span class="figure tnum">{s.expiredMembers + s.suspendedMembers}</span>
			<span class="delta down tnum">{s.expiredMembers} lapsed · {s.suspendedMembers} held</span>
		</div>
	</section>

	<div class="cols">
		<section class="block">
			<h2>Door activity</h2>
			<ul class="feed">
				{#each data.recentCheckIns as c (c.time + c.member)}
					<li>
						<span class="tnum feed-time">{clock(c.time)}</span>
						<span class="feed-name">{c.member}</span>
						<span class="feed-dir {c.status}">{c.status === 'check-in' ? 'in' : 'out'}</span>
					</li>
				{/each}
			</ul>
		</section>

		<section class="block">
			<h2>Renewals due</h2>
			<ul class="feed">
				{#each data.upcomingExpirations as e (e.name)}
					<li>
						<span class="tnum feed-time">{e.date.slice(5)}</span>
						<span class="feed-name">{e.name}</span>
						<span class="feed-dir muted">{e.plan}</span>
					</li>
				{:else}
					<li class="empty">Nothing expiring this fortnight.</li>
				{/each}
			</ul>
		</section>
	</div>
</div>

<style>
	.wrap {
		max-width: 1180px;
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

	/* --- metric ledger --- */
	.ledger {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		border-top: 1px solid var(--color-line);
		border-bottom: 1px solid var(--color-line);
		margin-bottom: 2.75rem;
	}

	.metric {
		display: grid;
		gap: 0.45rem;
		padding: 1.35rem 1.5rem 1.35rem 0;
		border-right: 1px solid var(--color-line);
	}

	.metric:not(:first-child) {
		padding-left: 1.5rem;
	}

	.metric:last-child {
		border-right: 0;
	}

	.figure {
		font-size: clamp(1.75rem, 3vw, 2.35rem);
		font-weight: 500;
		letter-spacing: -0.02em;
		line-height: 1;
	}

	.delta {
		font-size: 0.6875rem;
		color: var(--color-chalk-faint);
	}

	.delta.up {
		color: var(--color-go);
	}

	.delta.down {
		color: var(--color-warn);
	}

	/* --- feeds --- */
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
		min-width: 0;
		font-weight: 500;
	}

	.feed-dir {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.feed-dir.check-in {
		color: var(--color-go);
	}

	.feed-dir.check-out {
		color: var(--color-chalk-faint);
	}

	.muted {
		color: var(--color-chalk-faint);
	}

	.empty {
		color: var(--color-chalk-faint);
		display: block;
	}

	@media (max-width: 980px) {
		.ledger {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.metric {
			padding: 1.25rem 1.25rem 1.25rem 0;
		}

		.metric:nth-child(2n) {
			border-right: 0;
		}

		.metric:nth-child(n + 3) {
			border-top: 1px solid var(--color-line);
		}

		.metric:nth-child(odd) {
			padding-left: 0;
		}
	}

	@media (max-width: 780px) {
		.cols {
			grid-template-columns: 1fr;
			gap: 2.5rem;
		}
	}
</style>
