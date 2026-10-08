<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let showForm = $state(false);
	let editingId = $state<string | null>(null);
	let formName = $state('');
	let formDesc = $state('');
	let formCategory = $state('');
	let formPrice = $state(0);
	let formStock = $state(0);
	let formActive = $state(true);
	let formError = $state('');
	let formSuccess = $state('');

	function formatPrice(kobo: number): string {
		return `₦${(kobo / 100).toLocaleString('en-NG')}`;
	}

	function startCreate() {
		editingId = null;
		formName = '';
		formDesc = '';
		formCategory = '';
		formPrice = 0;
		formStock = 0;
		formActive = true;
		formError = '';
		formSuccess = '';
		showForm = true;
	}

	function startEdit(id: string) {
		const p = data.products.find((x) => x.id === id);
		if (!p) return;
		editingId = id;
		formName = p.name;
		formDesc = p.description;
		formCategory = p.category;
		formPrice = p.price / 100;
		formStock = p.stock_quantity;
		formActive = p.is_active;
		formError = '';
		formSuccess = '';
		showForm = true;
	}

	async function saveProduct() {
		formError = '';
		formSuccess = '';

		if (!formName.trim() || !formDesc.trim() || !formCategory.trim()) {
			formError = 'All fields are required';
			return;
		}
		if (formPrice <= 0) {
			formError = 'Price must be greater than zero';
			return;
		}
		if (formStock < 0) {
			formError = 'Stock cannot be negative';
			return;
		}

		const payload = {
			name: formName.trim(),
			description: formDesc.trim(),
			category: formCategory.trim(),
			price: Math.round(formPrice * 100),
			stock_quantity: formStock,
			is_active: formActive
		};

		try {
			const url = editingId ? `/api/shop/products/${editingId}` : '/api/shop/products';
			const method = editingId ? 'PATCH' : 'POST';
			const res = await fetch(url, {
				method,
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const result = await res.json();
			if (!res.ok) {
				formError = result.error || 'Failed to save product';
				return;
			}

			formSuccess = editingId ? 'Product updated' : 'Product created';
			showForm = false;
			// Reload to get fresh data
			setTimeout(() => (window.location.href = window.location.pathname), 800);
		} catch {
			formError = 'Network error. Please try again.';
		}
	}

	async function deleteProduct(id: string) {
		if (!confirm('Delete this product?')) return;
		try {
			const res = await fetch(`/api/shop/products/${id}`, { method: 'DELETE' });
			if (res.ok) {
				window.location.reload();
			}
		} catch {
			// silent
		}
	}

	async function toggleActive(id: string) {
		const p = data.products.find((x) => x.id === id);
		if (!p) return;
		try {
			await fetch(`/api/shop/products/${id}`, {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ is_active: !p.is_active })
			});
			window.location.reload();
		} catch {
			// silent
		}
	}
</script>

<svelte:head>
	<title>Products · Gym House</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="wrap">
	<header class="head">
		<h1>Products</h1>
		<p class="head-meta tnum">{data.products.length} products</p>
	</header>

	<div class="actions">
		<button class="btn" onclick={startCreate}>+ New product</button>
	</div>

	{#if showForm}
		<div class="form-panel">
			<h2>{editingId ? 'Edit product' : 'New product'}</h2>
			<div class="form-grid">
				<label>
					<span class="label">Name</span>
					<input bind:value={formName} type="text" placeholder="Product name" />
				</label>
				<label>
					<span class="label">Category</span>
					<input bind:value={formCategory} type="text" placeholder="Accessories" />
				</label>
				<label class="full">
					<span class="label">Description</span>
					<textarea bind:value={formDesc} rows="3" placeholder="Product description"></textarea>
				</label>
				<label>
					<span class="label">Price (₦)</span>
					<input bind:value={formPrice} type="number" min="0" step="100" />
				</label>
				<label>
					<span class="label">Stock</span>
					<input bind:value={formStock} type="number" min="0" step="1" />
				</label>
				<label class="check">
					<input bind:checked={formActive} type="checkbox" />
					<span>Active</span>
				</label>
			</div>
			{#if formError}
				<p class="error">{formError}</p>
			{/if}
			{#if formSuccess}
				<p class="success">{formSuccess}</p>
			{/if}
			<div class="form-actions">
				<button class="btn" onclick={saveProduct}>
					{editingId ? 'Update' : 'Create'}
				</button>
				<button class="btn-ghost" onclick={() => (showForm = false)}>Cancel</button>
			</div>
		</div>
	{/if}

	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Product</th>
					<th>Category</th>
					<th>Price</th>
					<th>Stock</th>
					<th>Status</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.products as product (product.id)}
					<tr>
						<td>
							<div class="prod-cell">
								<img src={product.image_url} alt="" class="prod-img" />
								<span>{product.name}</span>
							</div>
						</td>
						<td class="label">{product.category}</td>
						<td class="tnum">{formatPrice(product.price)}</td>
						<td class="tnum">{product.stock_quantity}</td>
						<td>
							<span class="pill" class:active={product.is_active}>
								{product.is_active ? 'Active' : 'Inactive'}
							</span>
						</td>
						<td class="row-actions">
							<button class="link" onclick={() => startEdit(product.id)}>Edit</button>
							<button class="link" onclick={() => toggleActive(product.id)}>
								{product.is_active ? 'Deactivate' : 'Activate'}
							</button>
							<button class="link danger" onclick={() => deleteProduct(product.id)}>Delete</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
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

	.actions {
		margin-bottom: 1.5rem;
	}

	.btn {
		padding: 0.5rem 1rem;
		background: var(--color-ember);
		color: var(--color-ink-950);
		border: 0;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
	}

	.btn:hover {
		background: var(--color-ember-bright);
	}

	.btn-ghost {
		padding: 0.5rem 1rem;
		background: transparent;
		color: var(--color-chalk-dim);
		border: 1px solid var(--color-line-strong);
		font-size: 0.875rem;
		cursor: pointer;
	}

	.btn-ghost:hover {
		color: var(--color-chalk);
	}

	.form-panel {
		border: 1px solid var(--color-line);
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		display: grid;
		gap: 1rem;
	}

	.form-panel h2 {
		font-size: 1.0625rem;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.form-grid label {
		display: grid;
		gap: 0.35rem;
	}

	.form-grid label.full {
		grid-column: 1 / -1;
	}

	.form-grid label.check {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.form-grid input,
	.form-grid textarea {
		background: var(--color-ink-900);
		border: 1px solid var(--color-line-strong);
		color: var(--color-chalk);
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		font-family: inherit;
	}

	.form-grid input:focus,
	.form-grid textarea:focus {
		outline: none;
		border-color: var(--color-ember);
	}

	.error {
		margin: 0;
		color: var(--color-stop);
		font-size: 0.8125rem;
	}

	.success {
		margin: 0;
		color: var(--color-go);
		font-size: 0.8125rem;
	}

	.form-actions {
		display: flex;
		gap: 0.75rem;
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

	.prod-cell {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.prod-img {
		width: 36px;
		height: 36px;
		object-fit: cover;
		border: 1px solid var(--color-line);
	}

	.pill {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 0.2rem 0.5rem;
		border: 1px solid var(--color-line-strong);
		color: var(--color-chalk-faint);
	}

	.pill.active {
		color: var(--color-go);
		border-color: var(--color-go);
	}

	.row-actions {
		display: flex;
		gap: 0.75rem;
	}

	.link {
		background: none;
		border: 0;
		color: var(--color-chalk-dim);
		font-size: 0.8125rem;
		cursor: pointer;
		padding: 0;
	}

	.link:hover {
		color: var(--color-chalk);
	}

	.link.danger:hover {
		color: var(--color-stop);
	}

	@media (max-width: 780px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
