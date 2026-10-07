<script lang="ts">
	import type { PageData } from './$types';
	import { browser } from '$app/env';
	import jsQR from 'jsqr';
	import { parseMemberQrPayload } from '#lib/qr';

	let { data }: { data: PageData } = $props();

	type Mode = 'in' | 'out';
	let mode = $state<Mode>('in');
	let scannedText = $state('');
	let message = $state('Waiting for a pass. Ask the member to hold their code inside the frame.');
	let resultTone = $state<'neutral' | 'success' | 'error'>('neutral');
	let cameraOpen = $state(false);
	let videoRef = $state<HTMLVideoElement | null>(null);
	let stream: MediaStream | null = null;
	let scanFrameId: number | null = null;

	const occupancyPct = $derived(
		Math.min(100, Math.round((data.currentOccupancy / data.capacity) * 100))
	);

	function stopCamera() {
		if (scanFrameId !== null) {
			cancelAnimationFrame(scanFrameId);
			scanFrameId = null;
		}

		if (stream) {
			for (const track of stream.getTracks()) track.stop();
			stream = null;
		}

		if (videoRef) {
			videoRef.srcObject = null;
		}

		cameraOpen = false;
	}

	function scanLoop() {
		const video = videoRef;
		if (!video || !video.videoWidth || !video.videoHeight) {
			scanFrameId = requestAnimationFrame(scanLoop);
			return;
		}

		const canvas = document.createElement('canvas');
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			scanFrameId = requestAnimationFrame(scanLoop);
			return;
		}

		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const qrCode = jsQR(imageData.data, canvas.width, canvas.height, {
			inversionAttempts: 'dontInvert'
		});

		if (qrCode) {
			scannedText = qrCode.data.trim();
			message = 'QR code detected. Validating member pass...';
			resultTone = 'neutral';
			handleScan();
			stopCamera();
			return;
		}

		scanFrameId = requestAnimationFrame(scanLoop);
	}

	async function startCamera() {
		if (!browser || !navigator.mediaDevices?.getUserMedia) {
			message = 'This browser cannot access the camera.';
			resultTone = 'error';
			return;
		}

		try {
			stopCamera();
			stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'environment' },
				audio: false
			});
			cameraOpen = true;
			if (videoRef) {
				videoRef.srcObject = stream;
				await videoRef.play();
			}
			message = 'Scanning… hold the pass inside the frame.';
			resultTone = 'neutral';
			scanFrameId = requestAnimationFrame(scanLoop);
		} catch (error) {
			console.error(error);
			message = 'Camera permission was denied or the device is unavailable.';
			resultTone = 'error';
			stopCamera();
		}
	}

	function handleScan() {
		const payload = parseMemberQrPayload(scannedText.trim());
		if (!payload) {
			message = 'This QR code is not a valid Gym House membership pass.';
			resultTone = 'error';
			return;
		}

		const member = data.members.find((m) => m.id === payload.memberId);
		if (!member) {
			message = 'Member not found for this QR code.';
			resultTone = 'error';
			return;
		}

		if (member.status !== 'active') {
			message = `${member.name} is ${member.status}. Access is not allowed.`;
			resultTone = 'error';
			return;
		}

		const action = mode === 'in' ? 'check in' : 'check out';
		message = `${member.name} is ready to ${action}.`;
		resultTone = 'success';
	}

	const demoQr = 'gymhouse-member:member-1:demo-member-1-pass';

	$effect(() => {
		return () => stopCamera();
	});
</script>

<svelte:head>
	<title>Check In · Gym House</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="wrap">
	<header class="head">
		<h1>Check in</h1>
		<p class="head-meta tnum">
			{data.currentOccupancy} of {data.capacity} on floor
		</p>
	</header>

	<!-- The scan is the job. It gets the room, not a tile in a grid. -->
	<section class="scan">
		<div class="scan-mode" role="group" aria-label="Direction">
			<button class:on={mode === 'in'} onclick={() => (mode = 'in')}>Check in</button>
			<button class:on={mode === 'out'} onclick={() => (mode = 'out')}>Check out</button>
		</div>

		<div class="scan-stage" aria-live="polite">
			{#if cameraOpen}
				<video bind:this={videoRef} autoplay muted playsinline class="camera-feed"></video>
			{:else}
				<div class="reticle" aria-hidden="true">
					<span class="corner tl"></span>
					<span class="corner tr"></span>
					<span class="corner bl"></span>
					<span class="corner br"></span>
				</div>
			{/if}
			<p class="scan-hint {resultTone}">{message}</p>
			<label class="scan-input-wrap">
				<span class="label">QR payload</span>
				<input
					bind:value={scannedText}
					placeholder="Paste scanned code here"
					autocomplete="off"
				/>
			</label>
			<p class="scan-camera-note">
				Demo QR: {demoQr}
			</p>
		</div>

		<div class="scan-actions">
			<button class="primary" onclick={cameraOpen ? stopCamera : startCamera}>
				{cameraOpen ? 'Stop camera' : 'Start camera'}
			</button>
			<button class="primary secondary-variant" onclick={handleScan}>Validate pass</button>
			<a class="secondary" href="/reception/lookup">Look up by name</a>
		</div>
	</section>

	<div class="cols">
		<section class="block">
			<h2>Recent door events</h2>
			<ul class="feed">
				{#each data.recentVisits as v (v.time + v.name)}
					<li>
						<span class="tnum feed-time">{v.time}</span>
						<span class="feed-name">{v.name}</span>
						<span class="feed-dir {v.status}">
							{v.status === 'checked-in' ? 'in' : 'out'}
						</span>
					</li>
				{/each}
			</ul>
		</section>

		<section class="block">
			<h2>Floor load</h2>
			<div class="load">
				<div class="load-bar" role="img" aria-label="Floor at {occupancyPct} percent">
					<span style="width: {occupancyPct}%"></span>
				</div>
				<p class="load-read tnum">
					{data.currentOccupancy} / {data.capacity} · {occupancyPct}%
				</p>
				<p class="load-note">
					Occupancy is derived from open attendance sessions, not a headcount.
				</p>
			</div>
		</section>
	</div>
</div>

<style>
	.wrap {
		max-width: 1000px;
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

	/* --- scan --- */
	.scan {
		border: 1px solid var(--color-line);
		margin-bottom: 2.75rem;
	}

	.scan-mode {
		display: flex;
		border-bottom: 1px solid var(--color-line);
	}

	.scan-mode button {
		flex: 1;
		padding: 0.7rem;
		background: transparent;
		border: 0;
		border-right: 1px solid var(--color-line);
		color: var(--color-chalk-faint);
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			color 140ms ease,
			background-color 140ms ease;
	}

	.scan-mode button:last-child {
		border-right: 0;
	}

	.scan-mode button:hover {
		color: var(--color-chalk);
	}

	.scan-mode button.on {
		color: var(--color-ink-950);
		background: var(--color-ember);
	}

	.scan-stage {
		display: grid;
		justify-items: center;
		gap: 1.25rem;
		padding: 3rem 1.5rem 2.5rem;
		background: var(--color-ink-900);
	}

	.camera-feed {
		width: min(100%, 320px);
		height: auto;
		display: block;
		background: var(--color-ink-950);
		border: 1px solid var(--color-line-strong);
	}

	.reticle {
		position: relative;
		width: 168px;
		height: 168px;
	}

	.corner {
		position: absolute;
		width: 26px;
		height: 26px;
		border: 2px solid var(--color-chalk-faint);
	}

	.corner.tl {
		top: 0;
		left: 0;
		border-right: 0;
		border-bottom: 0;
	}

	.corner.tr {
		top: 0;
		right: 0;
		border-left: 0;
		border-bottom: 0;
	}

	.corner.bl {
		bottom: 0;
		left: 0;
		border-right: 0;
		border-top: 0;
	}

	.corner.br {
		bottom: 0;
		right: 0;
		border-left: 0;
		border-top: 0;
	}

	.scan-hint {
		margin: 0;
		color: var(--color-chalk-dim);
		font-size: 0.9375rem;
		text-align: center;
		max-width: 34ch;
	}

	.scan-hint.success {
		color: var(--color-go);
	}

	.scan-hint.error {
		color: var(--color-stop);
	}

	.scan-input-wrap {
		display: grid;
		gap: 0.4rem;
		width: min(100%, 420px);
	}

	.scan-input-wrap input {
		width: 100%;
		background: var(--color-ink-950);
		border: 1px solid var(--color-line-strong);
		padding: 0.7rem 0.8rem;
		color: var(--color-chalk);
	}

	.scan-camera-note {
		margin: 0;
		color: var(--color-chalk-faint);
		font-size: 0.75rem;
		text-align: center;
	}

	.scan-actions {
		display: flex;
		border-top: 1px solid var(--color-line);
	}

.primary,
	.secondary {
		flex: 1;
		padding: 0.85rem;
		font-size: 0.875rem;
		font-weight: 600;
		text-align: center;
		text-decoration: none;
		cursor: pointer;
		transition: background-color 140ms ease;
	}

	.primary {
		background: var(--color-ember);
		color: var(--color-ink-950);
		border: 0;
	}

	.primary:hover {
		background: var(--color-ember-bright);
	}

	.primary:active {
		background: var(--color-ember-deep);
	}

	.secondary-variant {
		border-left: 1px solid var(--color-line);
	}

	.secondary {
		background: transparent;
		border: 0;
		border-left: 1px solid var(--color-line);
		color: var(--color-chalk-dim);
	}

	.secondary:hover {
		color: var(--color-chalk);
		background: var(--color-ink-850);
	}

	/* --- feeds --- */
	.cols {
		display: grid;
		grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
		gap: 3rem;
	}

	.block h2 {
		font-size: 1.0625rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--color-line-strong);
		margin-bottom: 0.25rem;
	}

	.feed {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.feed li {
		display: flex;
		align-items: baseline;
		gap: 1rem;
		padding: 0.65rem 0;
		border-bottom: 1px solid var(--color-line);
		font-size: 0.8125rem;
	}

	.feed-time {
		flex: 0 0 3.5rem;
		color: var(--color-chalk-faint);
	}

	.feed-name {
		flex: 1;
		font-weight: 500;
	}

	.feed-dir {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.feed-dir.checked-in {
		color: var(--color-go);
	}

	.feed-dir.checked-out {
		color: var(--color-chalk-faint);
	}

	.load {
		padding-top: 1.25rem;
		display: grid;
		gap: 0.7rem;
	}

	.load-bar {
		height: 6px;
		background: var(--color-ink-800);
	}

	.load-bar span {
		display: block;
		height: 100%;
		background: var(--color-ember);
	}

	.load-read {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 500;
	}

	.load-note {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--color-chalk-faint);
		max-width: 36ch;
		line-height: 1.6;
	}

	@media (max-width: 780px) {
		.cols {
			grid-template-columns: 1fr;
			gap: 2.5rem;
		}

		.scan-stage {
			padding: 2.25rem 1rem 2rem;
		}

		.scan-actions {
			flex-direction: column;
		}

		.secondary {
			border-left: 0;
			border-top: 1px solid var(--color-line);
		}
	}
</style>
