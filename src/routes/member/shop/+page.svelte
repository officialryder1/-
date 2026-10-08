<script lang="ts">
	import type { PageData } from './$types';
	import { addToCart } from '#lib/stores/cart';
	import { getCartCount } from '#lib/stores/cart';
	import { cart } from '#lib/stores/cart';
	import { page } from '$app/state';

	let { data }: { data: PageData } = $props();

	let addedId = $state<string | null>(null);
	let addedTimeout: ReturnType<typeof setTimeout> | null = null;

	const categories = $derived(
		[...new Set(data.products.map((p) => p.category))].sort()
	);

	const cartCount = $derived(getCartCount($cart));

	function formatPrice(kobo: number): string {
		return `₦${(kobo / 100).toLocaleString('en-NG')}`;
	}

	function handleAdd(productId: string, name: string, price: number) {
		addToCart(productId, name, price, 1);
		addedId = productId;
		if (addedTimeout) clearTimeout(addedTimeout);
		addedTimeout = setTimeout(() => (addedId = null), 1500);
	}
</script>

<svelte:head>
	<title>Shop · Gym House</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="wrap">
	<header class="head">
		<h1>Shop</h1>
		<p class="head-meta tnum">{data.products.length} products · pay at gym</p>
	</header>

	<div class="shop-bar">
		<div class="cats">
			{#each categories as cat (cat)}
				<span class="cat label">{cat}</span>
			{/each}
		</div>
		<a class="cart-link" href="/member/shop/cart">
			<span class="label">Cart</span>
			{#if cartCount > 0}
				<span class="cart-badge tnum">{cartCount}</span>
			{/if}
		</a>
	</div>

	{#if data.products.length === 0}
		<p class="empty">No products available yet.</p>
	{:else}
		<div class="grid">
			{#each data.products as product (product.id)}
				<article class="card">
					<div class="card-img">
						<img src={product.image_url} alt={product.name} loading="lazy" />
					</div>
					<div class="card-body">
						<span class="label">{product.category}</span>
						<h2>{product.name}</h2>
						<p class="desc">{product.description}</p>
						<div class="card-foot">
							<span class="price tnum">{formatPrice(product.price)}</span>
							<button
								class="add"
								class:added={addedId === product.id}
								disabled={product.stock_quantity === 0}
								onclick={() => handleAdd(product.id, product.name, product.price)}
							>
								{product.stock_quantity === 0
									? 'Out of stock'
									: addedId === product.id
										? 'Added ✓'
										: 'Add to cart'}
							</button>
						</div>
						{#if product.stock_quantity <= 5 && product.stock_quantity > 0}
							<span class="stock-warn label">Only {product.stock_quantity} left</span>
						{/if}
					</div>
				</article>
			{/each}
		</div>
	{/if}
</div>

<style>
	.wrap {
		max-width: 1180px;
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

	.shop-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 2rem;
	}

	.cats {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.cat {
		padding: 0.3rem 0.6rem;
		border: 1px solid var(--color-line);
	}

	.cart-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
		color: var(--color-chalk);
		padding: 0.4rem 0.8rem;
		border: 1px solid var(--color-line);
		transition: border-color 140ms ease;
	}

	.cart-link:hover {
		border-color: var(--color-chalk-faint);
	}

	.cart-badge {
		background: var(--color-ember);
		color: var(--color-ink-950);
		font-size: 0.6875rem;
		font-weight: 600;
		padding: 0.1rem 0.4rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 1.5rem;
	}

	.card {
		border: 1px solid var(--color-line);
		display: flex;
		flex-direction: column;
	}

	.card-img {
		aspect-ratio: 1;
		background: var(--color-ink-900);
		border-bottom: 1px solid var(--color-line);
		overflow: hidden;
	}

	.card-img img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.card-body {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex: 1;
	}

	.card-body h2 {
		font-size: 1rem;
		font-weight: 600;
	}

	.desc {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--color-chalk-dim);
		line-height: 1.5;
		flex: 1;
	}

	.card-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 0.5rem;
	}

	.price {
		font-size: 1rem;
		font-weight: 600;
	}

	.add {
		padding: 0.4rem 0.8rem;
		background: var(--color-ember);
		color: var(--color-ink-950);
		border: 0;
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 140ms ease;
	}

	.add:hover {
		background: var(--color-ember-bright);
	}

	.add:disabled {
		background: var(--color-ink-700);
		color: var(--color-chalk-faint);
		cursor: not-allowed;
	}

	.add.added {
		background: var(--color-go);
	}

	.stock-warn {
		color: var(--color-warn);
	}

	.empty {
		color: var(--color-chalk-faint);
		padding: 3rem 0;
		text-align: center;
	}
</style>
