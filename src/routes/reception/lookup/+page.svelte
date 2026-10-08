<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let search = $state('');

	const filtered = $derived(
		data.members.filter((m) =>
			m.name.toLowerCase().includes(search.toLowerCase()) ||
			m.id.toLowerCase().includes(search.toLowerCase())
		)
	);
</script>

<svelte:head>
	<title>Member Lookup · Gym House</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="wrap">
	<header class="head">
		<h1>Member Lookup</h1>
		<p class="head-meta tnum">Search by name or ID</p>
	</header>

	<div class="search-wrap">
		<input
			bind:value={search}
			type="search"
			placeholder="Search members..."
			autocomplete="off"
		/>
	</div>

	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Name</th>
					<th>ID</th>
					<th>Plan</th>
					<th>Status</th>
				</tr>
			</thead>
			<tbody>
				{#each filtered as m (m.id)}
					<tr>
						<td class="feed-name">{m.name}</td>
						<td class="tnum">{m.id}</td>
						<td class="label">{m.plan}</td>
						<td>
							<span class="pill" class:active={m.status === 'active'}>
								{m.status}
							</span>
						</td>
					</tr>
				{:else}
					<tr><td colspan="4" class="empty">No members found.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
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

	.search-wrap {
		margin-bottom: 1.5rem;
	}

	.search-wrap input {
		width: 100%;
		background: var(--color-ink-900);
		border: 1px solid var(--color-line-strong);
		color: var(--color-chalk);
		padding: 0.7rem 1rem;
		font-size: 0.9375rem;
		font-family: inherit;
	}

	.search-wrap input:focus {
		outline: none;
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
