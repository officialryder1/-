<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const initials = $derived(
		data.user.full_name
			.split(' ')
			.map((p) => p[0])
			.slice(0, 2)
			.join('')
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
	<title>Profile · Gym House</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="wrap">
	<header class="head">
		<h1>Profile</h1>
		<p class="head-meta tnum">Your account details</p>
	</header>

	<div class="profile-layout">
		<div class="profile-card">
			<div class="avatar tnum" aria-hidden="true">{initials}</div>
			<h2>{data.user.full_name}</h2>
			<span class="label">{data.user.role}</span>
		</div>

		<div class="details">
			<div class="detail-row">
				<span class="label">Email</span>
				<span class="value">{data.user.email}</span>
			</div>
			<div class="detail-row">
				<span class="label">Member ID</span>
				<span class="value tnum">{data.user.id}</span>
			</div>
			<div class="detail-row">
				<span class="label">Gym</span>
				<span class="value tnum">{data.user.gym_id}</span>
			</div>
			<div class="detail-row">
				<span class="label">Membership status</span>
				<span class="value status" class:active={data.user.membership_status === 'active'}>
					{data.user.membership_status}
				</span>
			</div>
			<div class="detail-row">
				<span class="label">Subscription expires</span>
				<span class="value tnum">{formatDate(data.user.subscription_expires_at)}</span>
			</div>
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

	.profile-layout {
		display: grid;
		grid-template-columns: 280px 1fr;
		gap: 2.5rem;
		align-items: start;
	}

	.profile-card {
		border: 1px solid var(--color-line);
		padding: 2rem;
		display: grid;
		gap: 1rem;
		justify-items: center;
		text-align: center;
	}

	.avatar {
		width: 80px;
		height: 80px;
		display: grid;
		place-items: center;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--color-ink-950);
		background: var(--color-chalk-dim);
		border-radius: 50%;
	}

	.profile-card h2 {
		font-size: 1.25rem;
	}

	.details {
		border: 1px solid var(--color-line);
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--color-line);
	}

	.detail-row:last-child {
		border-bottom: 0;
	}

	.value {
		font-weight: 500;
	}

	.value.status {
		text-transform: capitalize;
	}

	.value.status.active {
		color: var(--color-go);
	}

	@media (max-width: 780px) {
		.profile-layout {
			grid-template-columns: 1fr;
		}
	}
</style>
