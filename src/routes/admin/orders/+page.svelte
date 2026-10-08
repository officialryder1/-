<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let filter = $state<'all' | 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled'>('all');

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

	const statusLabel: Record<string, string> = {
		pending: 'Pending',
		confirmed: 'Confirmed',
		ready: 'Ready',
		completed: 'Completed',
		cancelled: 'Cancelled'
	};

	const nextStatus: Record<string, { label: string; value: string } | null> = {
		pending: { label: 'Confirm', value: 'confirmed' },
		confirmed: { label: 'Mark ready', value: 'ready' },
		ready: { label: 'Complete', value: 'completed' },
		completed: null,
		cancelled: null
	};

	const filtered = $derived(
		filter === 'all' ? data.orders : data.orders.filter((o) => o.status === filter)
	);

	async function advanceStatus(orderId: string, newStatus: string) {
		try {
			const res = await fetch(`/api/shop/orders/${orderId}`, {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ status: newStatus })
			});
			if (res.ok) window.location.reload();
		} catch {
			// silent
		}
	}

	async function cancelOrder(orderId: string) {
		if (!confirm('Cancel this order?')) return;
		try {
			const res = await fetch(`/api/shop/orders/${orderId}`, {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ status: 'cancelled' })
			});
			if (res.ok) window.location.reload();
		} catch {
			// silent
		}
	}
</script>

<svelte:head>
	<title>Orders · Gym House</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="wrap">
	<header class="head">
		<h1>Orders</h1>
		<p class="head-meta tnum">{data.orders.length} total</p>
	</header>

	<div class="filters">
		{#each ['all', 'pending', 'confirmed', 'ready', 'completed', 'cancelled'] as f (f)}
			<button
				class="filter-btn"
				class:active={filter === f}
				onclick={() => (filter = f as typeof filter)}
			>
				{f === 'all' ? 'All' : statusLabel[f]}
			</button>
		{/each}
	</div>

	{#if filtered.length === 0}
		<p class="empty">No orders found.</p>
	{:else}
		<div class="orders">
			{#each filtered as order (order.id)}
				<article class="order">
					<div class="order-head">
						<span class="order-id tnum">{order.id}</span>
						<span class="order-date tnum">{formatDate(order.created_at)}</span>
						<span class="status {order.status}">{statusLabel[order.status] ?? order.status}</span>
					</div>
					<div class="order-items">
						{#each order.items as item (item.id)}
							<div class="order-item">
								<span class="item-name">{item.product_name_snapshot}</span>
								<span class="item-qty tnum">×{item.quantity}</span>
								<span class="item-price tnum">{formatPrice(item.line_total)}</span>
							</div>
						{/each}
					</div>
					<div class="order-foot">
						<span class="label">{order.fulfillment_note}</span>
						<span class="order-total tnum">{formatPrice(order.subtotal)}</span>
					</div>
					{#if nextStatus[order.status]}
						<div class="order-actions">
							<button
								class="btn-sm"
								onclick={() => advanceStatus(order.id, nextStatus[order.status]!.value)}
							>
								{nextStatus[order.status]!.label}
							</button>
							<button class="btn-sm danger" onclick={() => cancelOrder(order.id)}>
								Cancel
							</button>
						</div>
					{/if}
				</article>
			{/each}
		</div>
	{/if}
</div>

<style>
	.wrap {
		max-width: 900px;
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
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
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

	.empty {
		color: var(--color-chalk-faint);
		padding: 3rem 0;
		text-align: center;
	}

	.orders {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.order {
		border: 1px solid var(--color-line);
	}

	.order-head {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--color-line);
	}

	.order-id {
		font-weight: 600;
	}

	.order-date {
		font-size: 0.8125rem;
		color: var(--color-chalk-faint);
	}

	.status {
		margin-left: auto;
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 0.2rem 0.5rem;
	}

	.status.pending {
		color: var(--color-warn);
	}

	.status.confirmed {
		color: var(--color-go);
	}

	.status.ready {
		color: var(--color-go);
	}

	.status.completed {
		color: var(--color-chalk-faint);
	}

	.status.cancelled {
		color: var(--color-stop);
	}

	.order-items {
		padding: 0.5rem 1.25rem;
	}

	.order-item {
		display: flex;
		gap: 1rem;
		padding: 0.4rem 0;
		font-size: 0.875rem;
	}

	.item-name {
		flex: 1;
	}

	.item-qty {
		color: var(--color-chalk-faint);
	}

	.item-price {
		min-width: 5rem;
		text-align: right;
	}

	.order-foot {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1.25rem;
		border-top: 1px solid var(--color-line);
	}

	.order-total {
		font-weight: 600;
		font-size: 1rem;
	}

	.order-actions {
		display: flex;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		border-top: 1px solid var(--color-line);
	}

	.btn-sm {
		padding: 0.35rem 0.75rem;
		background: var(--color-ember);
		color: var(--color-ink-950);
		border: 0;
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-sm:hover {
		background: var(--color-ember-bright);
	}

	.btn-sm.danger {
		background: transparent;
		color: var(--color-stop);
		border: 1px solid var(--color-stop);
	}

	.btn-sm.danger:hover {
		background: var(--color-stop);
		color: var(--color-ink-950);
	}
</style>
