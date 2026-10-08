<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let filter = $state<'all' | 'active' | 'expired' | 'cancelled' | 'suspended'>('all');

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
		active: 'Active',
		expired: 'Expired',
		cancelled: 'Cancelled',
		suspended: 'Suspended'
	};

	const filtered = $derived(
		filter === 'all' ? data.subscriptions : data.subscriptions.filter((s) => s.status === filter)
	);

	async function updateStatus(subscriptionId: string, newStatus: string) {
		try {
			const res = await fetch(`/api/subscriptions/${subscriptionId}`, {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ status: newStatus })
			});
			if (res.ok) window.location.reload();
		} catch {
			// silent
		}
	}
</script>

<svelte:head>
	<title>Subscriptions · Gym House</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="wrap">
	<header class="head">
		<h1>Subscriptions</h1>
		<p class="head-meta tnum">{data.subscriptions.length} total</p>
	</header>

	<div class="filters">
		{#each ['all', 'active', 'expired', 'cancelled', 'suspended'] as f (f)}
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
		<p class="empty">No subscriptions found.</p>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Member</th>
						<th>Plan</th>
						<th>Start</th>
						<th>Expires</th>
						<th>Payment</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each filtered as sub (sub.id)}
						<tr>
							<td class="tnum">{sub.member_id}</td>
							<td>{data.plans.find(p => p.id === sub.plan_id)?.name ?? 'Unknown'}</td>
							<td class="tnum">{formatDate(sub.starts_at)}</td>
							<td class="tnum">{formatDate(sub.expires_at)}</td>
							<td>
								<span class="label">{sub.payment_method}</span>
								{#if sub.payment_reference}
									<span class="ref tnum">{sub.payment_reference}</span>
								{/if}
							</td>
							<td>
								<span class="pill" class:active={sub.status === 'active'}>
									{statusLabel[sub.status] ?? sub.status}
								</span>
							</td>
							<td class="row-actions">
								{#if sub.status === 'active'}
									<button class="link" onclick={() => updateStatus(sub.id, 'suspended')}>
										Suspend
									</button>
									<button class="link danger" onclick={() => updateStatus(sub.id, 'cancelled')}>
										Cancel
									</button>
								{:else if sub.status === 'suspended'}
									<button class="link" onclick={() => updateStatus(sub.id, 'active')}>
										Reactivate
									</button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
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

	.ref {
		display: block;
		font-size: 0.6875rem;
		color: var(--color-chalk-faint);
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
</style>
