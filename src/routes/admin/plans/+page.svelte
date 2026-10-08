<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let showForm = $state(false);
	let editingId = $state<string | null>(null);
	let formName = $state('');
	let formDesc = $state('');
	let formPrice = $state(0);
	let formDuration = $state(30);
	let formFeatures = $state('');
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
		formPrice = 0;
		formDuration = 30;
		formFeatures = '';
		formActive = true;
		formError = '';
		formSuccess = '';
		showForm = true;
	}

	function startEdit(id: string) {
		const p = data.plans.find((x) => x.id === id);
		if (!p) return;
		editingId = id;
		formName = p.name;
		formDesc = p.description;
		formPrice = p.price / 100;
		formDuration = p.duration_days;
		formFeatures = p.features.join('\n');
		formActive = p.is_active;
		formError = '';
		formSuccess = '';
		showForm = true;
	}

	async function savePlan() {
		formError = '';
		formSuccess = '';

		if (!formName.trim() || !formDesc.trim()) {
			formError = 'Name and description are required';
			return;
		}
		if (formPrice <= 0) {
			formError = 'Price must be greater than zero';
			return;
		}
		if (formDuration < 1) {
			formError = 'Duration must be at least 1 day';
			return;
		}

		const payload = {
			name: formName.trim(),
			description: formDesc.trim(),
			price: Math.round(formPrice * 100),
			duration_days: formDuration,
			features: formFeatures.split('\n').map((f) => f.trim()).filter(Boolean),
			is_active: formActive
		};

		try {
			const url = editingId ? `/api/plans/${editingId}` : '/api/plans';
			const method = editingId ? 'PATCH' : 'POST';
			const res = await fetch(url, {
				method,
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const result = await res.json();
			if (!res.ok) {
				formError = result.error || 'Failed to save plan';
				return;
			}

			formSuccess = editingId ? 'Plan updated' : 'Plan created';
			showForm = false;
			setTimeout(() => (window.location.href = window.location.pathname), 800);
		} catch {
			formError = 'Network error. Please try again.';
		}
	}

	async function deletePlan(id: string) {
		if (!confirm('Delete this plan?')) return;
		try {
			const res = await fetch(`/api/plans/${id}`, { method: 'DELETE' });
			if (res.ok) window.location.reload();
		} catch {
			// silent
		}
	}

	async function toggleActive(id: string) {
		const p = data.plans.find((x) => x.id === id);
		if (!p) return;
		try {
			await fetch(`/api/plans/${id}`, {
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
	<title>Plans · Gym House</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="wrap">
	<header class="head">
		<h1>Plans</h1>
		<p class="head-meta tnum">{data.plans.length} plans</p>
	</header>

	<div class="actions">
		<button class="btn" onclick={startCreate}>+ New plan</button>
	</div>

	{#if showForm}
		<div class="form-panel">
			<h2>{editingId ? 'Edit plan' : 'New plan'}</h2>
			<div class="form-grid">
				<label>
					<span class="label">Name</span>
					<input bind:value={formName} type="text" placeholder="Plan name" />
				</label>
				<label>
					<span class="label">Duration (days)</span>
					<input bind:value={formDuration} type="number" min="1" step="1" />
				</label>
				<label class="full">
					<span class="label">Description</span>
					<textarea bind:value={formDesc} rows="3" placeholder="Plan description"></textarea>
				</label>
				<label>
					<span class="label">Price (₦)</span>
					<input bind:value={formPrice} type="number" min="0" step="100" />
				</label>
				<label class="full">
					<span class="label">Features (one per line)</span>
					<textarea bind:value={formFeatures} rows="4" placeholder="Feature 1&#10;Feature 2&#10;Feature 3"></textarea>
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
				<button class="btn" onclick={savePlan}>
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
					<th>Plan</th>
					<th>Price</th>
					<th>Duration</th>
					<th>Features</th>
					<th>Status</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.plans as plan (plan.id)}
					<tr>
						<td>
							<div class="plan-cell">
								<span class="plan-name">{plan.name}</span>
								<span class="plan-desc">{plan.description}</span>
							</div>
						</td>
						<td class="tnum">{formatPrice(plan.price)}</td>
						<td class="tnum">{plan.duration_days} days</td>
						<td class="features-cell">
							<span class="label">{plan.features.length} features</span>
						</td>
						<td>
							<span class="pill" class:active={plan.is_active}>
								{plan.is_active ? 'Active' : 'Inactive'}
							</span>
						</td>
						<td class="row-actions">
							<button class="link" onclick={() => startEdit(plan.id)}>Edit</button>
							<button class="link" onclick={() => toggleActive(plan.id)}>
								{plan.is_active ? 'Deactivate' : 'Activate'}
							</button>
							<button class="link danger" onclick={() => deletePlan(plan.id)}>Delete</button>
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

	.plan-cell {
		display: grid;
		gap: 0.2rem;
	}

	.plan-name {
		font-weight: 500;
	}

	.plan-desc {
		font-size: 0.8125rem;
		color: var(--color-chalk-faint);
	}

	.features-cell {
		max-width: 12rem;
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
