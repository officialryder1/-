<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let search = $state('');
	let statusFilter = $state<'all' | 'active' | 'expired' | 'suspended'>('all');

	const filtered = $derived(
		data.members.filter((m) => {
			const matchesSearch =
				m.name.toLowerCase().includes(search.toLowerCase()) ||
				m.email.toLowerCase().includes(search.toLowerCase()) ||
				m.id.toLowerCase().includes(search.toLowerCase());
			const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
			return matchesSearch && matchesStatus;
		})
	);

	function formatDate(iso: string | null): string {
		if (!iso) return 'N/A';
		return new Date(iso).toLocaleDateString('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Members · Gym House</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="wrap">
	<header class="head">
		<h1>Members</h1>
		<p class="head-meta tnum">{data.members.length} members on roster</p>
	</header>

	<div class="toolbar">
		<input
			bind:value={search}
			type="search"
			placeholder="Search members..."
			autocomplete="off"
		/>
		<div class="filters">
			{#each ['all', 'active', 'expired', 'suspended'] as f (f)}
				<button
					class="filter-btn"
					class:active={statusFilter === f}
					onclick={() => (statusFilter = f as typeof statusFilter)}
				>
					{f === 'all' ? 'All' : f}
				</button>
			{/each}
		</div>
	</div>

	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Name</th>
					<th>Email</th>
					<th>ID</th>
<th>Status</th>
					<th>Expires</th>
				</tr>
			</thead>
			<tbody>
				{#each filtered as m (m.id)}
					<tr>
						<td class="feed-name">{m.name}</td>
						<td>{m.email}</td>
						<td class="tnum">{m.id}</td>
						<td>
							<span class="pill" class:active={m.status === 'active'}>
								{m.status}
							</span>
						</td>
						<td class="tnum">{formatDate(m.expires)}</td>
					</tr>
				{:else}
					<tr><td colspan="5" class="empty">No members found.</td></tr>
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

	.toolbar {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}

	.toolbar input {
		flex: 1;
		min-width: 200px;
		background: var(--color-ink-900);
		border: 1px solid var(--color-line-strong);
		color: var(--color-chalk);
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		font-family: inherit;
	}

	.toolbar input:focus {
		outline: none;
		border-color: var(--color-ember);
	}

	.filters {
		display: flex;
		gap: 0.5rem;
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

	.feed-name {
		font-weight: 500;
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

	.empty {
		color: var(--color-chalk-faint);
		padding: 1.25rem 0;
	}
</style>
