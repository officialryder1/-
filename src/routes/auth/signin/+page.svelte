<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let email = $state('');
	let password = $state('');
	let busy = $state(false);
</script>

<svelte:head>
	<title>Sign in · Gym House</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="split">
	<section class="pane">
		<a href="/" class="wordmark">
			<span class="wordmark-mark"></span>
			<span class="wordmark-text">Gym&nbsp;House</span>
		</a>

		<div class="pane-body">
			<h1>Front desk,<br />settled.</h1>
			<p class="lede">
				Memberships, door access and payments in one record. Sign in to pick up where the gym
				left off.
			</p>

			<!-- No `action` attribute on purpose: an explicit `?/default` is a
			     reserved name in SvelteKit 3 and 500s. Omitting it uses `default`. -->
			<form
				method="POST"
				use:enhance={() => {
					busy = true;
					return async ({ result, update }) => {
						if (result.type === 'redirect') {
							window.location.href = result.location;
							return;
						}
						busy = false;
						await update({ reset: false });
					};
				}}
			>
				{#if form?.error}
					<p class="alert" role="alert">{form.error}</p>
				{/if}

				<div class="field">
					<label for="email">Email</label>
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="username"
						bind:value={email}
						required
					/>
				</div>

				<div class="field">
					<label for="password">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="current-password"
						bind:value={password}
						required
					/>
				</div>

				<button type="submit" class="go" disabled={busy}>
					{busy ? 'Checking' : 'Sign in'}
				</button>
			</form>

			<details class="demo">
				<summary>Demo accounts</summary>
				<ul>
					<li><span class="label">Member</span> alice@demogym.com / member123</li>
					<li><span class="label">Reception</span> reception@demogym.com / reception123</li>
					<li><span class="label">Admin</span> admin@demogym.com / admin1234</li>
				</ul>
			</details>
		</div>
	</section>

	<figure class="plate">
		<img src="/img/gym-hero.png" alt="" width="900" height="1200" />
	</figure>
</div>

<style>
	.split {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 0.82fr);
		min-height: 100dvh;
		background: var(--color-ink-950);
	}

	.pane {
		display: flex;
		flex-direction: column;
		padding: 1.5rem 3.5rem 3rem;
	}

	.wordmark {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		text-decoration: none;
		color: var(--color-chalk);
		width: fit-content;
	}

	.wordmark-mark {
		width: 9px;
		height: 9px;
		background: var(--color-ember);
	}

	.wordmark-text {
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 0.95rem;
		letter-spacing: -0.015em;
	}

	.pane-body {
		margin: auto 0;
		padding-top: 3rem;
		max-width: 27rem;
	}

	h1 {
		font-size: clamp(2.25rem, 4.4vw, 3.25rem);
		margin-bottom: 1.1rem;
	}

	.lede {
		color: var(--color-chalk-dim);
		font-size: 1rem;
		line-height: 1.6;
		max-width: 34ch;
		margin: 0 0 2.25rem;
	}

	form {
		display: grid;
		gap: 1.1rem;
	}

	.field {
		display: grid;
		gap: 0.4rem;
	}

	label {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-chalk-faint);
	}

	input {
		width: 100%;
		padding: 0.7rem 0.85rem;
		background: var(--color-ink-900);
		border: 1px solid var(--color-line-strong);
		color: var(--color-chalk);
		font-size: 0.9375rem;
		transition: border-color 140ms ease;
	}

	input:focus {
		outline: none;
		border-color: var(--color-ember);
	}

	.go {
		margin-top: 0.35rem;
		padding: 0.8rem 1rem;
		background: var(--color-ember);
		color: var(--color-ink-950);
		border: 0;
		font-size: 0.9375rem;
		font-weight: 700;
		cursor: pointer;
		transition: background-color 140ms ease;
	}

	.go:hover:not(:disabled) {
		background: var(--color-ember-bright);
	}

	.go:active:not(:disabled) {
		background: var(--color-ember-deep);
	}

	.go:disabled {
		opacity: 0.55;
		cursor: default;
	}

	.alert {
		margin: 0;
		padding: 0.6rem 0.75rem;
		border-left: 2px solid var(--color-stop);
		background: color-mix(in srgb, var(--color-stop) 12%, transparent);
		color: var(--color-chalk);
		font-size: 0.875rem;
	}

	.demo {
		margin-top: 2rem;
		border-top: 1px solid var(--color-line);
		padding-top: 1rem;
	}

	.demo summary {
		cursor: pointer;
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-chalk-faint);
	}

	.demo ul {
		list-style: none;
		margin: 0.75rem 0 0;
		padding: 0;
		display: grid;
		gap: 0.4rem;
	}

	.demo li {
		font-size: 0.8125rem;
		color: var(--color-chalk-dim);
		display: flex;
		gap: 0.6rem;
		align-items: baseline;
	}

	.demo .label {
		flex: 0 0 4.75rem;
	}

	.plate {
		margin: 0;
		position: relative;
		overflow: hidden;
		background: var(--color-ink-900);
	}

	.plate img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		filter: saturate(0.72) contrast(1.06);
	}

	@media (max-width: 900px) {
		.split {
			grid-template-columns: 1fr;
		}

		.pane {
			padding: 1.25rem 1.25rem 2.5rem;
			min-height: 100dvh;
		}

		.pane-body {
			padding-top: 2rem;
			max-width: none;
		}

		.plate {
			display: none;
		}
	}
</style>
