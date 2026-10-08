<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const a = $derived(data.insights);

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-GB', {
			day: '2-digit',
			month: 'short'
		});
	}

	function weekday(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'short' });
	}
</script>

<svelte:head>
	<title>Attendance · Gym House</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="wrap">
	<header class="head">
		<h1>Attendance</h1>
		<p class="head-meta tnum">{a.visitsToday} visits today · {a.visitsThisWeek} this week</p>
	</header>

	<section class="ledger" aria-label="Attendance summary">
		<div class="metric">
			<span class="label">Today</span>
			<span class="figure tnum">{a.visitsToday}</span>
			<span class="delta tnum">check-ins</span>
		</div>
		<div class="metric">
			<span class="label">This week</span>
			<span class="figure tnum">{a.visitsThisWeek}</span>
			<span class="delta tnum">visits</span>
		</div>
		<div class="metric">
			<span class="label">This month</span>
			<span class="figure tnum">{a.visitsThisMonth}</span>
			<span class="delta tnum">visits</span>
		</div>
		<div class="metric">
			<span class="label">Peak hour</span>
			<span class="figure tnum">{a.peakHour}</span>
			<span class="delta tnum">on average</span>
		</div>
		<div class="metric">
			<span class="label">Peak day</span>
			<span class="figure">{a.peakDay}</span>
			<span class="delta tnum">on average</span>
		</div>
	</section>

	<section class="block">
		<h2>Recent check-ins</h2>
		<ul class="feed">
			{#each a.recentCheckIns as c, idx (idx)}
				<li>
					<span class="tnum feed-time">{c.time}</span>
					<span class="feed-name">{c.member}</span>
					<span class="feed-dir {c.status}">{c.status === 'check-in' ? 'in' : 'out'}</span>
				</li>
			{/each}
		</ul>
	</section>
</div>

<style>
	.wrap {
		max-width: 1080px;
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

	.ledger {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		border-top: 1px solid var(--color-line);
		border-bottom: 1px solid var(--color-line);
		margin-bottom: 2.75rem;
	}

	.metric {
		display: grid;
		gap: 0.45rem;
		padding: 1.35rem 1.25rem 1.35rem 0;
		border-right: 1px solid var(--color-line);
	}

	.metric:not(:first-child) {
		padding-left: 1.25rem;
	}

	.metric:last-child {
		border-right: 0;
	}

	.figure {
		font-size: clamp(1.5rem, 2.5vw, 2rem);
		font-weight: 500;
		letter-spacing: -0.02em;
		line-height: 1;
	}

	.delta {
		font-size: 0.6875rem;
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

	.feed-dir.check-in {
		color: var(--color-go);
	}

	.feed-dir.check-out {
		color: var(--color-chalk-faint);
	}

	@media (max-width: 780px) {
		.ledger {
			grid-template-columns: repeat(2, 1fr);
		}

		.metric:nth-child(2n) {
			border-right: 0;
		}

		.metric:nth-child(n + 3) {
			border-top: 1px solid var(--color-line);
		}
	}
</style>
