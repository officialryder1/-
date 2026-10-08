<script lang="ts">
	import { page } from '$app/state';
	import type { GymHouseUser } from '#lib/server/mock-auth';
	// Client component: must import the isomorphic helper, not `#lib/server/*`.
	import { getDashboardTitle } from '#lib/roles.js';
	import type { Snippet } from 'svelte';

	let { user, children }: { user: GymHouseUser; children: Snippet } = $props();

	let drawerOpen = $state(false);

	const navByRole = {
		member: [
			{ label: 'Overview', href: '/member' },
			{ label: 'QR Pass', href: '/member/qr' },
			{ label: 'Attendance', href: '/member/attendance' },
			{ label: 'Shop', href: '/member/shop' },
			{ label: 'Orders', href: '/member/shop/orders' },
			{ label: 'Profile', href: '/member/profile' }
		],
		receptionist: [
			{ label: 'Check In', href: '/reception/checkin' },
			{ label: 'Recent Visits', href: '/reception/visits' },
			{ label: 'Member Lookup', href: '/reception/lookup' }
		],
		admin: [
			{ label: 'Overview', href: '/admin' },
			{ label: 'Members', href: '/admin/members' },
			{ label: 'Subscriptions', href: '/admin/subscriptions' },
			{ label: 'Attendance', href: '/admin/attendance' },
			{ label: 'Products', href: '/admin/products' },
			{ label: 'Orders', href: '/admin/orders' },
			{ label: 'Reports', href: '/admin/reports' },
			{ label: 'Staff', href: '/admin/staff' }
		]
	} as const;

	// `$derived` so the nav follows a role change instead of capturing the
	// first value (svelte-check flags the plain read as `state_referenced_locally`).
	const nav = $derived(navByRole[user.role] ?? []);
	const initials = $derived(
		user.full_name
			.split(' ')
			.map((p) => p[0])
			.slice(0, 2)
			.join('')
	);

	async function signOut() {
		await fetch('/api/auth', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ action: 'signout' })
		});
		window.location.href = '/auth/signin';
	}

	// Close the drawer whenever the route changes.
	$effect(() => {
		page.url.pathname;
		drawerOpen = false;
	});
</script>

<div class="shell">
	<aside class="rail" class:open={drawerOpen}>
		<div class="rail-head">
			<a href="/" class="wordmark">
				<span class="wordmark-mark"></span>
				<span class="wordmark-text">Gym&nbsp;House</span>
			</a>
			<button class="rail-close" onclick={() => (drawerOpen = false)} aria-label="Close menu">
				<span aria-hidden="true">&times;</span>
			</button>
		</div>

		<nav class="rail-nav" aria-label="Primary">
			{#each nav as item (item.href)}
				{@const active = page.url.pathname === item.href}
				<a href={item.href} class="rail-link" class:active aria-current={active ? 'page' : undefined}>
					{item.label}
				</a>
			{/each}
		</nav>

		<div class="rail-foot">
			<div class="who">
				<span class="who-initials tnum" aria-hidden="true">{initials}</span>
				<span class="who-body">
					<span class="who-name">{user.full_name}</span>
					<span class="who-role label">{user.role}</span>
				</span>
			</div>
			<button class="signout" onclick={signOut}>Sign out</button>
		</div>
	</aside>

	{#if drawerOpen}
		<button class="scrim" onclick={() => (drawerOpen = false)} aria-label="Close menu"></button>
	{/if}

	<div class="main">
		<header class="bar">
			<button class="bar-toggle" onclick={() => (drawerOpen = true)} aria-label="Open menu">
				<span class="bar-toggle-line"></span>
				<span class="bar-toggle-line"></span>
			</button>
			<span class="bar-title">{getDashboardTitle(user.role)}</span>
			<span class="bar-gym tnum">{user.gym_id}</span>
		</header>

		<main class="stage">
			{@render children()}
		</main>
	</div>
</div>

<style>
	.shell {
		display: grid;
		grid-template-columns: 248px 1fr;
		min-height: 100dvh;
		background: var(--color-ink-950);
	}

	/* --- rail --- */
	.rail {
		display: flex;
		flex-direction: column;
		background: var(--color-ink-900);
		border-right: 1px solid var(--color-line);
		position: sticky;
		top: 0;
		height: 100dvh;
	}

	.rail-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.125rem 1.25rem;
		border-bottom: 1px solid var(--color-line);
	}

	.wordmark {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		text-decoration: none;
		color: var(--color-chalk);
	}

	.wordmark-mark {
		width: 9px;
		height: 9px;
		background: var(--color-ember);
		display: block;
	}

	.wordmark-text {
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 0.95rem;
		letter-spacing: -0.015em;
	}

	.rail-close {
		display: none;
		background: none;
		border: 0;
		color: var(--color-chalk-dim);
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		padding: 0 0.25rem;
	}

	.rail-nav {
		display: flex;
		flex-direction: column;
		padding: 0.5rem 0;
		flex: 1;
		overflow-y: auto;
	}

	/* Active state is a rule, not a pill. */
	.rail-link {
		position: relative;
		padding: 0.6rem 1.25rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-chalk-dim);
		text-decoration: none;
		transition: color 140ms ease;
	}

	.rail-link:hover {
		color: var(--color-chalk);
	}

	.rail-link.active {
		color: var(--color-chalk);
	}

	.rail-link.active::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 2px;
		background: var(--color-ember);
	}

	.rail-foot {
		border-top: 1px solid var(--color-line);
		padding: 1rem 1.25rem;
		display: grid;
		gap: 0.75rem;
	}

	.who {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}

	.who-initials {
		width: 30px;
		height: 30px;
		flex: 0 0 30px;
		display: grid;
		place-items: center;
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--color-ink-950);
		background: var(--color-chalk-dim);
	}

	.who-body {
		display: grid;
		gap: 0.1rem;
		min-width: 0;
	}

	.who-name {
		font-size: 0.8125rem;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.signout {
		width: 100%;
		padding: 0.5rem;
		background: transparent;
		border: 1px solid var(--color-line-strong);
		color: var(--color-chalk-dim);
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			color 140ms ease,
			border-color 140ms ease,
			background-color 140ms ease;
	}

	.signout:hover {
		color: var(--color-chalk);
		border-color: var(--color-chalk-faint);
		background: var(--color-ink-850);
	}

	.signout:active {
		background: var(--color-ink-800);
	}

	/* --- main --- */
	.main {
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.bar {
		display: none;
		align-items: center;
		gap: 0.85rem;
		padding: 0.7rem 1rem;
		border-bottom: 1px solid var(--color-line);
		background: var(--color-ink-900);
		position: sticky;
		top: 0;
		z-index: 20;
	}

	.bar-toggle {
		background: none;
		border: 0;
		padding: 0.3rem 0.15rem;
		display: grid;
		gap: 4px;
		cursor: pointer;
	}

	.bar-toggle-line {
		display: block;
		width: 18px;
		height: 1.5px;
		background: var(--color-chalk-dim);
	}

	.bar-title {
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.bar-gym {
		margin-left: auto;
		font-size: 0.6875rem;
		color: var(--color-chalk-faint);
	}

	.stage {
		padding: 2rem 2rem 3.5rem;
		flex: 1;
		min-width: 0;
	}

	.scrim {
		display: none;
	}

	/* --- mobile --- */
	@media (max-width: 860px) {
		.shell {
			grid-template-columns: 1fr;
		}

		.bar {
			display: flex;
		}

		.rail {
			position: fixed;
			inset: 0 auto 0 0;
			width: 264px;
			z-index: 40;
			transform: translateX(-100%);
			transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
		}

		.rail.open {
			transform: translateX(0);
		}

		.rail-close {
			display: block;
		}

		.scrim {
			display: block;
			position: fixed;
			inset: 0;
			z-index: 30;
			background: rgb(11 14 18 / 0.72);
			border: 0;
			cursor: pointer;
		}

		.stage {
			padding: 1.25rem 1rem 2.5rem;
		}
	}
</style>
