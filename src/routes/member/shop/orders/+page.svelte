<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

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
</script>

<svelte:head>
	<title>Orders · Gym House</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="wrap">
	<header class="head">
		<h1>Orders</h1>
		<p class="head-meta tnum">{data.orders.length} order{data.orders.length === 1 ? '' : 's'}</p>
	</header>

	{#if data.orders.length === 0}
		<div class="empty-panel">
			<p>No orders yet.</p>
			<a class="btn" href="/member/shop">Browse products</a>
		</div>
	{:else}
		<div class="orders">
			{#each data.orders as order (order.id)}
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

	.empty-panel {
		border: 1px solid var(--color-line);
		padding: 2.5rem;
		text-align: center;
		display: grid;
		gap: 1rem;
		justify-items: center;
		color: var(--color-chalk-faint);
	}

	.btn {
		display: inline-block;
		padding: 0.6rem 1.2rem;
		background: var(--color-ember);
		color: var(--color-ink-950);
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 600;
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
</style>
