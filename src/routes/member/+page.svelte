<script lang="ts">
	import type { PageData } from './$types';
	import QRCode from 'qrcode';
	import { browser } from '$app/env';
	import { createMemberQrPayload } from '#lib/qr';

	let { data }: { data: PageData } = $props();

	// QR generation is canvas-based, so it is browser-only.
	let qr = $state<string | null>(null);

	$effect(() => {
		if (!browser || !data.user) return;
		let cancelled = false;
		const payload = createMemberQrPayload(data.user.id, data.passToken);
		QRCode.toDataURL(payload, {
			width: 480,
			margin: 0,
			errorCorrectionLevel: 'M',
			color: { dark: '#0b0e12', light: '#eef1f5' }
		})
			.then((url) => {
				if (!cancelled) qr = url;
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	});

	function day(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('en-GB', {
			day: '2-digit',
			month: 'short'
		});
	}

	function weekday(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'short' });
	}

	const visits = $derived(data.attendanceHistory ?? []);
	const orders = $derived(data.recentOrders ?? []);
</script>

<svelte:head>
	<title>Overview · Gym House</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="wrap">
	<header class="head">
		<h1>{data.user?.full_name?.split(' ')[0]}</h1>
		<p class="head-meta tnum">
			{data.planName} · renews {day(data.user?.subscription_expires_at ?? '')}
		</p>
	</header>

	<!-- Asymmetric: the pass is the primary object, not one tile among equals. -->
	<section class="pass">
		<div class="pass-code">
			{#if qr}
				<img src={qr} alt="Membership pass code" width="480" height="480" />
			{:else}
				<div class="pass-pending" aria-hidden="true"></div>
			{/if}
		</div>
		<div class="pass-side">
			<span class="label">Door pass</span>
			<p class="pass-hint">Hold this at the scanner. Staff can also look you up by name.</p>
			<dl class="pass-facts">
				<div>
					<dt class="label">Member</dt>
					<dd class="tnum">{data.user?.id}</dd>
				</div>
				<div>
					<dt class="label">Status</dt>
					<dd class="ok">{data.user?.membership_status}</dd>
				</div>
			</dl>
		</div>
	</section>

	<div class="cols">
		<section class="block">
			<h2>Attendance</h2>
			<table>
				<thead>
					<tr>
						<th scope="col">Day</th>
						<th scope="col">In</th>
						<th scope="col">Out</th>
						<th scope="col">Time</th>
					</tr>
				</thead>
				<tbody>
					{#each visits as v (v.date)}
						<tr>
							<th scope="row"><span class="tnum">{day(v.date)}</span> <span class="muted">{weekday(v.date)}</span></th>
							<td class="tnum">{v.check_in}</td>
							<td class="tnum">{v.check_out}</td>
							<td class="tnum muted">{v.duration}</td>
						</tr>
					{:else}
						<tr><td colspan="4" class="empty">No visits recorded yet.</td></tr>
					{/each}
				</tbody>
			</table>
		</section>

		<section class="block">
			<h2>Shop orders</h2>
			<table>
				<thead>
					<tr>
						<th scope="col">Ref</th>
						<th scope="col">Placed</th>
						<th scope="col">Total</th>
						<th scope="col">State</th>
					</tr>
				</thead>
				<tbody>
					{#each orders as o (o.id)}
						<tr>
							<th scope="row" class="tnum">{o.id}</th>
							<td class="tnum">{day(o.date)}</td>
							<td class="tnum">{o.total}</td>
							<td><span class="state {o.status}">{o.status}</span></td>
						</tr>
					{:else}
						<tr><td colspan="4" class="empty">Nothing ordered yet.</td></tr>
					{/each}
				</tbody>
			</table>
		</section>
	</div>
</div>

<style>
	.wrap {
		max-width: 1080px;
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

	/* --- pass --- */
	.pass {
		display: grid;
		grid-template-columns: 208px minmax(0, 1fr);
		gap: 2rem;
		align-items: center;
		padding-bottom: 2.25rem;
		border-bottom: 1px solid var(--color-line);
		margin-bottom: 2.25rem;
	}

	.pass-code {
		background: var(--color-chalk);
		padding: 0.75rem;
		line-height: 0;
	}

	.pass-code img {
		width: 100%;
		height: auto;
		display: block;
	}

	.pass-pending {
		width: 100%;
		aspect-ratio: 1;
		background: linear-gradient(100deg, #d6dbe2 30%, #eef1f5 50%, #d6dbe2 70%);
		animation: sweep 1.4s linear infinite;
		background-size: 220% 100%;
	}

	@keyframes sweep {
		to {
			background-position: -120% 0;
		}
	}

	.pass-side {
		display: grid;
		gap: 0.75rem;
		align-content: center;
	}

	.pass-hint {
		margin: 0;
		color: var(--color-chalk-dim);
		font-size: 0.9375rem;
		line-height: 1.6;
		max-width: 38ch;
	}

	.pass-facts {
		display: flex;
		gap: 2.5rem;
		margin: 0.5rem 0 0;
	}

	.pass-facts div {
		display: grid;
		gap: 0.2rem;
	}

	.pass-facts dt {
		margin: 0;
	}

	.pass-facts dd {
		margin: 0;
		font-size: 0.875rem;
	}

	.ok {
		color: var(--color-go);
		font-weight: 600;
	}

	/* --- tables --- */
	.cols {
		display: grid;
		grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
		gap: 3rem;
	}

	.block h2 {
		font-size: 1.0625rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--color-line-strong);
		margin-bottom: 0.25rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		text-align: left;
		padding: 0.6rem 0;
		font-size: 0.8125rem;
		font-weight: 500;
	}

	thead th {
		font-family: var(--font-mono);
		font-size: 0.625rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-chalk-faint);
		padding-bottom: 0.4rem;
	}

	tbody tr {
		border-top: 1px solid var(--color-line);
	}

	tbody th {
		font-weight: 600;
	}

	.muted {
		color: var(--color-chalk-faint);
		font-weight: 400;
	}

	.empty {
		color: var(--color-chalk-faint);
		padding: 1.25rem 0;
	}

	.state {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.state.completed {
		color: var(--color-go);
	}

	.state.pending {
		color: var(--color-warn);
	}

	.state.cancelled {
		color: var(--color-stop);
	}

	@media (max-width: 860px) {
		.pass {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.pass-code {
			max-width: 208px;
		}

		.cols {
			grid-template-columns: 1fr;
			gap: 2.5rem;
		}
	}
</style>
