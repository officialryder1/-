<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let subscribing = $state<string | null>(null);
	let subscribeError = $state('');
	let subscribeSuccess = $state('');

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

	async function subscribe(planId: string) {
		subscribing = planId;
		subscribeError = '';
		subscribeSuccess = '';

		try {
			const res = await fetch('/api/subscriptions', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ planId, paymentMethod: 'pay_at_gym' })
			});

			const result = await res.json();

			if (!res.ok) {
				subscribeError = result.error || 'Failed to subscribe';
				return;
			}

			subscribeSuccess = `Subscribed to ${data.plans.find(p => p.id === planId)?.name}!`;
			setTimeout(() => (window.location.href = window.location.pathname), 1000);
		} catch {
			subscribeError = 'Network error. Please try again.';
		} finally {
			subscribing = null;
		}
	}

	async function cancelSubscription(subscriptionId: string) {
		if (!confirm('Cancel this subscription?')) return;
		try {
			const res = await fetch(`/api/subscriptions/${subscriptionId}`, {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ action: 'cancel' })
			});
			if (res.ok) window.location.reload();
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
		<p class="head-meta tnum">Choose a membership plan</p>
	</header>

	{#if data.activeSubscription}
		<div class="current-sub">
			<span class="label">Current plan</span>
			<span class="plan-name">
				{data.plans.find(p => p.id === data.activeSubscription?.plan_id)?.name ?? 'Unknown'}
			</span>
			<span class="tnum sub-date">
				Expires {formatDate(data.activeSubscription.expires_at)}
			</span>
			<button class="link danger" onclick={() => cancelSubscription(data.activeSubscription!.id)}>
				Cancel
			</button>
		</div>
	{/if}

	{#if subscribeError}
		<p class="error">{subscribeError}</p>
	{/if}
	{#if subscribeSuccess}
		<p class="success">{subscribeSuccess}</p>
	{/if}

	<div class="plans-grid">
		{#each data.plans as plan (plan.id)}
			<article class="plan-card">
				<div class="plan-head">
					<h2>{plan.name}</h2>
					<span class="plan-price tnum">{formatPrice(plan.price)}<span class="per">/mo</span></span>
				</div>
				<p class="plan-desc">{plan.description}</p>
				<ul class="features">
					{#each plan.features as feature (feature)}
						<li>{feature}</li>
					{/each}
				</ul>
				<button
					class="subscribe-btn"
					disabled={subscribing === plan.id || !!data.activeSubscription}
					onclick={() => subscribe(plan.id)}
				>
					{subscribing === plan.id
						? 'Subscribing…'
						: data.activeSubscription
							? 'Active'
							: 'Subscribe'}
				</button>
			</article>
		{/each}
	</div>

	{#if data.subscriptionHistory.length > 0}
		<section class="history">
			<h2>Subscription history</h2>
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Plan</th>
							<th>Start</th>
							<th>Expires</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{#each data.subscriptionHistory as sub (sub.id)}
							<tr>
								<td>{data.plans.find(p => p.id === sub.plan_id)?.name ?? 'Unknown'}</td>
								<td class="tnum">{formatDate(sub.starts_at)}</td>
								<td class="tnum">{formatDate(sub.expires_at)}</td>
								<td>
									<span class="pill" class:active={sub.status === 'active'}>
										{sub.status}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
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

	.current-sub {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.25rem;
		border: 1px solid var(--color-line);
		margin-bottom: 2rem;
	}

	.plan-name {
		font-weight: 600;
		font-size: 1.125rem;
	}

	.sub-date {
		font-size: 0.8125rem;
		color: var(--color-chalk-faint);
	}

	.link {
		margin-left: auto;
		background: none;
		border: 0;
		color: var(--color-chalk-faint);
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.link.danger:hover {
		color: var(--color-stop);
	}

	.error {
		color: var(--color-stop);
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.success {
		color: var(--color-go);
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.plans-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
		margin-bottom: 3rem;
	}

	.plan-card {
		border: 1px solid var(--color-line);
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.plan-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	.plan-head h2 {
		font-size: 1.25rem;
	}

	.plan-price {
		font-size: 1.5rem;
		font-weight: 600;
	}

	.per {
		font-size: 0.875rem;
		font-weight: 400;
		color: var(--color-chalk-faint);
	}

	.plan-desc {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-chalk-dim);
		line-height: 1.5;
	}

	.features {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.5rem;
		flex: 1;
	}

	.features li {
		font-size: 0.875rem;
		color: var(--color-chalk-dim);
		padding-left: 1.25rem;
		position: relative;
	}

	.features li::before {
		content: '✓';
		position: absolute;
		left: 0;
		color: var(--color-go);
	}

	.subscribe-btn {
		padding: 0.75rem;
		background: var(--color-ember);
		color: var(--color-ink-950);
		border: 0;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
	}

	.subscribe-btn:hover {
		background: var(--color-ember-bright);
	}

	.subscribe-btn:disabled {
		background: var(--color-ink-700);
		color: var(--color-chalk-faint);
		cursor: not-allowed;
	}

	.history h2 {
		font-size: 1.0625rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--color-line-strong);
		margin-bottom: 0.25rem;
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
</style>
