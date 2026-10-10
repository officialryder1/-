<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let filter = $state('all');

	const ACTION_LABELS: Record<string, string> = {
		'subscription.created': 'Subscription created',
		'subscription.suspended': 'Subscription suspended',
		'subscription.reactivated': 'Subscription reactivated',
		'subscription.cancelled': 'Subscription cancelled',
		'plan.created': 'Plan created',
		'plan.updated': 'Plan updated',
		'plan.deleted': 'Plan deleted',
		'product.created': 'Product created',
		'product.updated': 'Product updated',
		'product.deleted': 'Product deleted',
		'order.created': 'Order created',
		'order.status_changed': 'Order status changed',
		'member.checked_in': 'Member checked in',
		'member.checked_out': 'Member checked out',
		'sign_in': 'Signed in',
		'sign_out': 'Signed out'
	};

	const families = $derived([
		'all',
		...Array.from(new Set(data.entries.map((e) => e.action.split('.')[0])))
	]);

	const filtered = $derived(
		filter === 'all' ? data.entries : data.entries.filter((e) => e.action.startsWith(filter))
	);

	function tone(action: string): string {
		if (action.startsWith('member.')) return 'go';
		if (action.includes('cancel') || action.includes('suspend') || action.includes('deleted'))
			return 'stop';
		if (action.startsWith('subscription') || action.startsWith('plan')) return 'ember';
		return 'muted';
	}

	function when(iso: string): string {
		const d = new Date(iso);
		const now = Date.now();
		const mins = Math.round((now - d.getTime()) / 60_000);
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins}m ago`;
		if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
		return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
	}

	function full(iso: string): string {
		return new Date(iso).toLocaleString('en-GB', {
			day: '2-digit',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Audit Log · Gym House</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="wrap">
	<header class="head">
		<h1>Audit Log</h1>
		<p class="head-meta tnum">
			{data.stats.total} events · {data.stats.today} today
		</p>
	</header>

	<div class="filters">
		{#each families as f (f)}
			<button class="filter-btn" class:active={filter === f} onclick={() => (filter = f)}>
				{f === 'all' ? 'All' : f}
			</button>
		{/each}
	</div>

	<section class="block">
		<h2>Recent activity</h2>
		{#if filtered.length === 0}
			<p class="empty">No audit entries for this filter.</p>
		{:else}
			<ul class="feed">
				{#each filtered as e (e.id)}
					<li>
						<span class="dot {tone(e.action)}" aria-hidden="true"></span>
						<span class="feed-main">
							<span class="feed-summary">{e.summary}</span>
							<span class="feed-meta tnum">
								{e.actor_name} · {e.actor_role} · {ACTION_LABELS[e.action] ?? e.action}
							</span>
						</span>
						<span class="feed-when tnum" title={full(e.at)}>{when(e.at)}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>

<style>
	.wrap {
		max-width: 1080px;
	}

	.head {
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--color-line);
		margin-bottom: 1.5rem;
	}

	.head h1 {
		font-size: clamp(1.85rem, 3.4vw, 2.6rem);
	}

	.head-meta {
		margin: 0.6rem 0 0;
		font-size: 0.8125rem;
		color: var(--color-chalk-faint);
	}

	.filters {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 1.75rem;
	}

	.filter-btn {
		padding: 0.35rem 0.75rem;
		background: transparent;
		border: 1px solid var(--color-line);
		color: var(--color-chalk-faint);
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.filter-btn:hover {
		color: var(--color-chalk);
	}

	.filter-btn.active {
		background: var(--color-ember);
		color: var(--color-ink-950);
		border-color: var(--color-ember);
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
		align-items: center;
		gap: 0.85rem;
		padding: 0.7rem 0;
		border-bottom: 1px solid var(--color-line);
		font-size: 0.8125rem;
	}

	.dot {
		width: 7px;
		height: 7px;
		flex: 0 0 7px;
		background: var(--color-chalk-faint);
	}

	.dot.go {
		background: var(--color-go);
	}

	.dot.stop {
		background: var(--color-stop);
	}

	.dot.ember {
		background: var(--color-ember);
	}

	.dot.muted {
		background: var(--color-chalk-faint);
	}

	.feed-main {
		flex: 1;
		display: grid;
		gap: 0.15rem;
		min-width: 0;
	}

	.feed-summary {
		font-weight: 500;
	}

	.feed-meta {
		font-size: 0.6875rem;
		color: var(--color-chalk-faint);
	}

	.feed-when {
		font-size: 0.6875rem;
		color: var(--color-chalk-faint);
		white-space: nowrap;
	}

	.empty {
		color: var(--color-chalk-faint);
		padding: 1.25rem 0;
		font-size: 0.875rem;
	}
</style>
