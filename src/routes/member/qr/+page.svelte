<script lang="ts">
	import type { PageData } from './$types';
	import QRCode from 'qrcode';
	import { browser } from '$app/env';
	import { createMemberQrPayload } from '#lib/qr';

	let { data }: { data: PageData } = $props();

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
</script>

<svelte:head>
	<title>QR Pass · Gym House</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="wrap">
	<header class="head">
		<h1>QR Pass</h1>
		<p class="head-meta tnum">Show this code at reception</p>
	</header>

	<div class="pass-layout">
		<div class="pass-card">
			{#if qr}
				<img src={qr} alt="Membership QR code" width="480" height="480" />
			{:else}
				<div class="pass-pending" aria-hidden="true"></div>
			{/if}
		</div>
		<div class="pass-info">
			<span class="label">Member</span>
			<p class="pass-name">{data.user.full_name}</p>
			<span class="label">ID</span>
			<p class="pass-id tnum">{data.user.id}</p>
			<span class="label">Status</span>
			<p class="pass-status">{data.user.membership_status}</p>
			<p class="pass-hint">Hold this at the scanner. Staff can also look you up by name.</p>
		</div>
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

	.pass-layout {
		display: grid;
		grid-template-columns: 320px 1fr;
		gap: 2.5rem;
		align-items: start;
	}

	.pass-card {
		background: var(--color-chalk);
		padding: 1rem;
		line-height: 0;
	}

	.pass-card img {
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
			background-position: -220% 0;
		}
	}

	.pass-info {
		display: grid;
		gap: 0.5rem;
		align-content: start;
	}

	.pass-name {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.pass-id {
		margin: 0;
		font-size: 1rem;
	}

	.pass-status {
		margin: 0;
		color: var(--color-go);
		font-weight: 600;
		text-transform: capitalize;
	}

	.pass-hint {
		margin: 1.5rem 0 0;
		color: var(--color-chalk-dim);
		font-size: 0.9375rem;
		line-height: 1.6;
		max-width: 38ch;
	}

	@media (max-width: 780px) {
		.pass-layout {
			grid-template-columns: 1fr;
		}

		.pass-card {
			max-width: 320px;
		}
	}
</style>
