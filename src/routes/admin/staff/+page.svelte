<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Staff · Gym House</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="wrap">
	<header class="head">
		<h1>Staff</h1>
		<p class="head-meta tnum">{data.staff.length} staff members</p>
	</header>

	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Name</th>
					<th>Email</th>
					<th>Role</th>
				</tr>
			</thead>
			<tbody>
				{#each data.staff as s (s.id)}
					<tr>
						<td class="feed-name">{s.name}</td>
						<td>{s.email}</td>
						<td>
							<span class="pill" class:active={s.role === 'admin'}>
								{s.role}
							</span>
						</td>
					</tr>
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
		color: var(--color-ember);
		border-color: var(--color-ember);
	}
</style>
