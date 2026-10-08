<script lang="ts">
	import { cart, updateCartQuantity, removeFromCart, clearCart, getCartTotal } from '#lib/stores/cart';
	import { page } from '$app/state';

	let submitting = $state(false);
	let orderResult = $state<{ id: string; total: number } | null>(null);
	let error = $state('');

	const total = $derived(getCartTotal($cart));

	function formatPrice(kobo: number): string {
		return `₦${(kobo / 100).toLocaleString('en-NG')}`;
	}

	async function submitOrder() {
		if ($cart.length === 0) return;
		submitting = true;
		error = '';
		orderResult = null;

		try {
			const items = $cart.map((i) => ({ productId: i.productId, quantity: i.quantity }));
			const res = await fetch('/api/shop/orders', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ items })
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.error || 'Failed to place order';
				return;
			}

			orderResult = { id: data.order.id, total: data.order.subtotal };
			clearCart();
		} catch {
			error = 'Network error. Please try again.';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Cart · Gym House</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="wrap">
	<header class="head">
		<h1>Cart</h1>
		<p class="head-meta tnum">{$cart.length} item{$cart.length === 1 ? '' : 's'}</p>
	</header>

	{#if orderResult}
		<div class="success-panel">
			<h2>Order placed</h2>
			<p>
				Order <span class="tnum">{orderResult.id}</span> for
				<span class="tnum">{formatPrice(orderResult.total)}</span> has been submitted.
			</p>
			<p class="label">Pay at gym · show this code at reception</p>
			<a class="btn" href="/member/shop/orders">View orders</a>
		</div>
	{:else if $cart.length === 0}
		<div class="empty-panel">
			<p>Your cart is empty.</p>
			<a class="btn" href="/member/shop">Browse products</a>
		</div>
	{:else}
		<div class="cart-layout">
			<div class="items">
				{#each $cart as item (item.productId)}
					<div class="cart-item">
						<div class="item-info">
							<span class="item-name">{item.name}</span>
							<span class="item-price tnum">{formatPrice(item.price)}</span>
						</div>
						<div class="item-controls">
							<button
								class="qty-btn"
								aria-label="Decrease quantity"
								onclick={() => updateCartQuantity(item.productId, item.quantity - 1)}
							>
								−
							</button>
							<span class="qty tnum">{item.quantity}</span>
							<button
								class="qty-btn"
								aria-label="Increase quantity"
								onclick={() => updateCartQuantity(item.productId, item.quantity + 1)}
							>
								+
							</button>
							<button
								class="remove"
								aria-label="Remove item"
								onclick={() => removeFromCart(item.productId)}
							>
								Remove
							</button>
						</div>
						<span class="line-total tnum">{formatPrice(item.price * item.quantity)}</span>
					</div>
				{/each}
			</div>

			<aside class="summary">
				<h2>Summary</h2>
				<div class="summary-row">
					<span>Subtotal</span>
					<span class="tnum">{formatPrice(total)}</span>
				</div>
				<div class="summary-row">
					<span>Payment</span>
					<span class="label">Pay at gym</span>
				</div>
				<div class="summary-total">
					<span>Total</span>
					<span class="tnum">{formatPrice(total)}</span>
				</div>
				{#if error}
					<p class="error">{error}</p>
				{/if}
				<button class="checkout" disabled={submitting} onclick={submitOrder}>
					{submitting ? 'Placing order…' : 'Place order'}
				</button>
				<a class="continue" href="/member/shop">Continue shopping</a>
			</aside>
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

	.success-panel,
	.empty-panel {
		border: 1px solid var(--color-line);
		padding: 2.5rem;
		text-align: center;
		display: grid;
		gap: 1rem;
		justify-items: center;
	}

	.success-panel h2 {
		font-size: 1.25rem;
	}

	.success-panel p {
		margin: 0;
		color: var(--color-chalk-dim);
	}

	.btn {
		display: inline-block;
		padding: 0.6rem 1.2rem;
		background: var(--color-ember);
		color: var(--color-ink-950);
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 600;
		border: 0;
		cursor: pointer;
	}

	.cart-layout {
		display: grid;
		grid-template-columns: 1fr 320px;
		gap: 2rem;
		align-items: start;
	}

	.items {
		display: flex;
		flex-direction: column;
	}

	.cart-item {
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: 1.5rem;
		align-items: center;
		padding: 1rem 0;
		border-bottom: 1px solid var(--color-line);
	}

	.item-info {
		display: grid;
		gap: 0.25rem;
	}

	.item-name {
		font-weight: 500;
	}

	.item-price {
		font-size: 0.8125rem;
		color: var(--color-chalk-faint);
	}

	.item-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.qty-btn {
		width: 28px;
		height: 28px;
		display: grid;
		place-items: center;
		background: transparent;
		border: 1px solid var(--color-line-strong);
		color: var(--color-chalk);
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
	}

	.qty-btn:hover {
		border-color: var(--color-chalk-faint);
	}

	.qty {
		min-width: 1.5rem;
		text-align: center;
	}

	.remove {
		background: none;
		border: 0;
		color: var(--color-chalk-faint);
		font-size: 0.8125rem;
		cursor: pointer;
		margin-left: 0.5rem;
	}

	.remove:hover {
		color: var(--color-stop);
	}

	.line-total {
		font-weight: 600;
		min-width: 5rem;
		text-align: right;
	}

	.summary {
		border: 1px solid var(--color-line);
		padding: 1.5rem;
		display: grid;
		gap: 1rem;
		align-content: start;
		position: sticky;
		top: 2rem;
	}

	.summary h2 {
		font-size: 1.0625rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--color-line-strong);
	}

	.summary-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.875rem;
		color: var(--color-chalk-dim);
	}

	.summary-total {
		display: flex;
		justify-content: space-between;
		font-size: 1.125rem;
		font-weight: 600;
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-line);
	}

	.error {
		margin: 0;
		color: var(--color-stop);
		font-size: 0.8125rem;
	}

	.checkout {
		padding: 0.75rem;
		background: var(--color-ember);
		color: var(--color-ink-950);
		border: 0;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
	}

	.checkout:hover {
		background: var(--color-ember-bright);
	}

	.checkout:disabled {
		background: var(--color-ink-700);
		color: var(--color-chalk-faint);
		cursor: not-allowed;
	}

	.continue {
		text-align: center;
		font-size: 0.8125rem;
		color: var(--color-chalk-faint);
		text-decoration: none;
	}

	.continue:hover {
		color: var(--color-chalk);
	}

	@media (max-width: 780px) {
		.cart-layout {
			grid-template-columns: 1fr;
		}

		.summary {
			position: static;
		}
	}
</style>
