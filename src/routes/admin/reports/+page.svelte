<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const a = $derived(data.insights);

	function formatPrice(kobo: number): string {
		return `₦${(kobo / 100).toLocaleString('en-NG')}`;
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}

	const totalOrders = $derived(data.orders.length);
	const totalOrderValue = $derived(data.orders.reduce((sum, o) => sum + o.subtotal, 0));
	const avgOrderValue = $derived(totalOrders > 0 ? Math.round(totalOrderValue / totalOrders) : 0);
</script>

<svelte:head>
	<title>Reports · Gym House</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="wrap">
	<header class="head">
		<h1>Reports</h1>
		<p class="head-meta tnum">Revenue, membership, and attendance summaries</p>
	</header>

	<div class="cols">
		<section class="block">
			<h2>Revenue</h2>
			<ul class="feed">
				<li>
					<span class="feed-name">This month</span>
					<span class="feed-dir checked-in tnum">{formatPrice(a.monthlyRevenue)}</span>
				</li>
				<li>
					<span class="feed-name">Total</span>
					<span class="feed-dir checked-in tnum">{formatPrice(a.totalRevenue)}</span>
				</li>
				<li>
					<span class="feed-name">Shop orders</span>
					<span class="feed-dir tnum">{totalOrders}</span>
				</li>
				<li>
					<span class="feed-name">Avg order value</span>
					<span class="feed-dir tnum">{formatPrice(avgOrderValue)}</span>
				</li>
			</ul>
		</section>

		<section class="block">
			<h2>Membership</h2>
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
			</ul>
		</section>

		<section class="block">
			<h2>Attendance</h2>
			<ul class="feed">
				<li>
					<span class="feed-name">Today</span>
					<span class="feed-dir checked-in tnum">{a.visitsToday}</span>
				</li>
				<li>
					<span class="feed-name">This week</span>
					<span class="feed-dir tnum">{a.visitsThisWeek}</span>
				</li>
				<li>
					<span class="feed-name">This month</span>
					<span class="feed-dir tnum">{a.visitsThisMonth}</span>
				</li>
				<li>
					<span class="feed-name">Peak hour</span>
					<span class="feed-dir tnum">{a.peakHour}</span>
				</li>
			</ul>
		</section>

		<section class="block">
			<h2>Plans</h2>
			<ul class="feed">
				{#each data.plans as plan (plan.id)}
					<li>
						<span class="feed-name">{plan.name}</span>
						<span class="feed-dir tnum">{formatPrice(plan.price)}/mo</span>
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

	.cols {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
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
		justify-content: space-between;
		align-items: baseline;
		padding: 0.65rem 0;
		border-bottom: 1px solid var(--color-line);
		font-size: 0.8125rem;
	}

	.feed-name {
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

	@media (max-width: 780px) {
		.cols {
			grid-template-columns: 1fr;
			gap: 2.5rem;
		}
	}
</style>
