<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const i = $derived(data.insights);

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
		<p class="head-meta tnum">{i.totalVisits} total visits</p>
	</header>

	<section class="ledger" aria-label="Attendance summary">
		<div class="metric">
			<span class="label">This week</span>
			<span class="figure tnum">{i.visitsThisWeek}</span>
			<span class="delta tnum">visits</span>
		</div>
		<div class="metric">
			<span class="label">This month</span>
			<span class="figure tnum">{i.visitsThisMonth}</span>
			<span class="delta tnum">visits</span>
		</div>
		<div class="metric">
			<span class="label">Most active day</span>
			<span class="figure">{i.mostActiveDay}</span>
			<span class="delta tnum">on average</span>
		</div>
		<div class="metric">
			<span class="label">Current streak</span>
			<span class="figure tnum">{i.currentStreak}</span>
			<span class="delta up tnum">days in a row</span>
		</div>
		<div class="metric">
			<span class="label">Longest streak</span>
			<span class="figure tnum">{i.longestStreak}</span>
			<span class="delta tnum">days</span>
		</div>
		<div class="metric">
			<span class="label">Avg duration</span>
			<span class="figure tnum">{i.avgDuration}</span>
			<span class="delta tnum">per visit</span>
		</div>
	</section>

	<section class="block">
		<h2>Recent visits</h2>
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Day</th>
						<th>In</th>
						<th>Out</th>
						<th>Time</th>
					</tr>
				</thead>
				<tbody>
					{#each i.recentHistory as v (v.date)}
						<tr>
							<th scope="row">
								<span class="tnum">{formatDate(v.date)}</span>
								<span class="muted"> {weekday(v.date)}</span>
							</th>
							<td class="tnum">{v.check_in}</td>
							<td class="tnum">{v.check_out}</td>
							<td class="tnum muted">{v.duration}</td>
						</tr>
					{:else}
						<tr><td colspan="4" class="empty">No visits recorded yet.</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
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

	.delta.up {
		color: var(--color-go);
	}

	.block h2 {
		font-size: 1.0625rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--color-line-strong);
		margin-bottom: 0.25rem;
	}

	.table-wrap {
		border: 1px solid var(--color-line);
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	th,
	td {
		text-align: left;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-line);
	}

	th {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-chalk-faint);
		font-weight: 500;
	}

	tbody tr:last-child td {
		border-bottom: 0;
	}

	tbody th {
		font-weight: 600;
	}

	.muted {
		color: var(--color-chalk-faint);
		font-weight: 400;
	}

	.empty {
		color: var(--color-chalk-faint);
		padding: 1.25rem 0;
	}

	@media (max-width: 780px) {
		.ledger {
			grid-template-columns: repeat(2, 1fr);
		}

		.metric {
			padding: 1.25rem 1rem 1.25rem 0;
		}

		.metric:nth-child(2n) {
			border-right: 0;
		}

		.metric:nth-child(n + 3) {
			border-top: 1px solid var(--color-line);
		}
	}
</style>
