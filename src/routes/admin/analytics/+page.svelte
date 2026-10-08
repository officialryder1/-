<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const a = $derived(data.insights);

	function formatPrice(kobo: number): string {
		return `₦${(kobo / 100).toLocaleString('en-NG')}`;
	}

	const maxDayCount = $derived(Math.max(...a.visitsByDay.map((d) => d.count), 1));
	const maxHourCount = $derived(Math.max(...a.visitsByHour.map((h) => h.count), 1));
</script>

<svelte:head>
	<title>Analytics · Gym House</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="wrap">
	<header class="head">
		<h1>Analytics</h1>
		<p class="head-meta tnum">Attendance, membership, and revenue insights</p>
	</header>

	<!-- Key metrics -->
	<section class="ledger" aria-label="Key metrics">
		<div class="metric">
			<span class="label">On floor now</span>
			<span class="figure tnum">{a.currentOccupancy}</span>
			<span class="delta tnum">members</span>
		</div>
		<div class="metric">
			<span class="label">Visits today</span>
			<span class="figure tnum">{a.visitsToday}</span>
			<span class="delta up tnum">{a.visitsThisWeek} this week</span>
		</div>
		<div class="metric">
			<span class="label">Active members</span>
			<span class="figure tnum">{a.activeMembers}</span>
			<span class="delta tnum">subscribed</span>
		</div>
		<div class="metric">
			<span class="label">Expiring soon</span>
			<span class="figure tnum">{a.expiringSoon}</span>
			<span class="delta down tnum">next 7 days</span>
		</div>
		<div class="metric">
			<span class="label">Inactive</span>
			<span class="figure tnum">{a.inactiveMembers}</span>
			<span class="delta down tnum">no visit in 14d</span>
		</div>
		<div class="metric">
			<span class="label">Revenue (month)</span>
			<span class="figure tnum">{formatPrice(a.monthlyRevenue)}</span>
			<span class="delta up tnum">{formatPrice(a.totalRevenue)} total</span>
		</div>
	</section>

	<div class="cols">
		<!-- Visits by day chart -->
		<section class="block">
			<h2>Visits this week</h2>
			<div class="chart">
				{#each a.visitsByDay as d (d.day)}
					<div class="bar-col">
						<span class="bar-val tnum">{d.count}</span>
						<div class="bar" style="height: {(d.count / maxDayCount) * 100}%"></div>
						<span class="bar-label label">{d.day}</span>
					</div>
				{/each}
			</div>
		</section>

		<!-- Visits by hour chart -->
		<section class="block">
			<h2>Peak hours</h2>
			<div class="chart">
				{#each a.visitsByHour as h (h.hour)}
					<div class="bar-col">
						<span class="bar-val tnum">{h.count}</span>
						<div class="bar" style="height: {(h.count / maxHourCount) * 100}%"></div>
						<span class="bar-label label">{h.hour}</span>
					</div>
				{/each}
			</div>
		</section>
	</div>

	<div class="cols">
		<!-- Membership breakdown -->
		<section class="block">
			<h2>Membership status</h2>
			<ul class="feed">
				<li>
					<span class="feed-name">Active</span>
					<span class="feed-dir checked-in tnum">{a.activeMembers}</span>
				</li>
				<li>
					<span class="feed-name">Expiring soon</span>
					<span class="feed-dir warn tnum">{a.expiringSoon}</span>
				</li>
				<li>
					<span class="feed-name">Expired</span>
					<span class="feed-dir muted tnum">{a.expiredMembers}</span>
				</li>
				<li>
					<span class="feed-name">Suspended</span>
					<span class="feed-dir danger tnum">{a.suspendedMembers}</span>
				</li>
				<li>
					<span class="feed-name">Inactive (14d)</span>
					<span class="feed-dir muted tnum">{a.inactiveMembers}</span>
				</li>
			</ul>
		</section>

		<!-- Recent activity -->
		<section class="block">
			<h2>Recent activity</h2>
			<ul class="feed">
				{#each a.recentCheckIns as c (c.time + c.member)}
					<li>
						<span class="tnum feed-time">{c.time}</span>
						<span class="feed-name">{c.member}</span>
						<span class="feed-dir {c.status}">{c.status === 'check-in' ? 'in' : 'out'}</span>
					</li>
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

	.ledger {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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

	.delta.down {
		color: var(--color-warn);
	}

	.cols {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 3rem;
	}

	.block h2 {
		font-size: 1.0625rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--color-line-strong);
		margin-bottom: 1rem;
	}

	.chart {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
		height: 180px;
		padding-bottom: 1.5rem;
	}

	.bar-col {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		height: 100%;
		justify-content: flex-end;
	}

	.bar-val {
		font-size: 0.6875rem;
		color: var(--color-chalk-faint);
	}

	.bar {
		width: 100%;
		max-width: 32px;
		background: var(--color-ember);
		min-height: 2px;
		transition: height 300ms ease;
	}

	.bar-label {
		font-size: 0.625rem;
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

	.feed-dir.warn {
		color: var(--color-warn);
	}

	.feed-dir.danger {
		color: var(--color-stop);
	}

	.feed-dir.muted {
		color: var(--color-chalk-faint);
	}

	@media (max-width: 980px) {
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

	@media (max-width: 780px) {
		.cols {
			grid-template-columns: 1fr;
			gap: 2.5rem;
		}
	}
</style>
