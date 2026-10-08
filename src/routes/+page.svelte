<script lang="ts">
	// Public landing. One job: get the visitor to the sign-in door.
</script>

<svelte:head>
	<title>Gym House · Membership, access and payments in one place</title>
	<meta
		name="description"
		content="Gym House runs memberships, door access, subscriptions and shop orders from a single record. Built for gyms that are done with paper registers."
	/>
</svelte:head>

<div class="page">
	<header class="top">
		<a href="/" class="wordmark">
			<span class="wordmark-mark"></span>
			<span class="wordmark-text">Gym&nbsp;House</span>
		</a>
		<a href="/auth/signin" class="top-cta">Sign in</a>
	</header>

	<section class="hero">
		<div class="hero-copy">
			<h1>
				The register<br />
				is a liability.
			</h1>
			<p class="lede">
				Every paper sign-in sheet is a membership you cannot verify. Gym House keeps
				membership, access and payment in one record.
			</p>
			<a href="/auth/signin" class="cta">Open the desk</a>
		</div>

		<figure class="hero-plate">
			<img src="/img/gym-hero.png" alt="" width="900" height="1200" />
			<figcaption class="label">Demo build · sample data</figcaption>
		</figure>
	</section>

	<section class="facts" aria-label="What the platform covers">
		<article>
			<h2>Access</h2>
			<p>A scannable pass per member. The door reads status before the member reaches the desk.</p>
		</article>
		<article>
			<h2>Money</h2>
			<p>Plans, renewals and payment references settle against the membership they belong to.</p>
		</article>
		<article>
			<h2>Signal</h2>
			<p>Attendance by day and hour, so quiet weeks are visible before they become churn.</p>
		</article>
	</section>

	<section class="how" aria-label="How it works">
		<h2 class="section-title">How it works</h2>
		<div class="steps">
			<div class="step">
				<span class="step-num tnum">01</span>
				<h3>Subscribe</h3>
				<p>Members pick a plan and pay online or at the desk. The subscription activates the moment payment clears.</p>
			</div>
			<div class="step">
				<span class="step-num tnum">02</span>
				<h3>Scan</h3>
				<p>A unique QR pass lives in the member's phone. Reception scans it — entry or exit — in under two seconds.</p>
			</div>
			<div class="step">
				<span class="step-num tnum">03</span>
				<h3>Track</h3>
				<p>Every visit is recorded. Admins see attendance trends, peak hours, and renewals due — before they become problems.</p>
			</div>
		</div>
	</section>

	<section class="stats" aria-label="Platform numbers">
		<div class="stat">
			<span class="stat-num tnum">3</span>
			<span class="stat-label">Roles with tailored access</span>
		</div>
		<div class="stat">
			<span class="stat-num tnum">&lt;2s</span>
			<span class="stat-label">Average scan-to-entry time</span>
		</div>
		<div class="stat">
			<span class="stat-num tnum">100%</span>
			<span class="stat-label">Of visits recorded digitally</span>
		</div>
		<div class="stat">
			<span class="stat-num tnum">0</span>
			<span class="stat-label">Paper registers needed</span>
		</div>
	</section>

	<section class="bottom-cta">
		<h2>Run your gym from one screen.</h2>
		<p>Sign in with a demo account and explore the full platform.</p>
		<div class="cta-row">
			<a href="/auth/signin" class="cta">Open the demo</a>
			<a href="/auth/signin" class="cta-ghost">View member area</a>
		</div>
	</section>
</div>

<style>
	.page {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}

	.top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem clamp(1.25rem, 5vw, 4rem);
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
	}

	.wordmark-text {
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 0.95rem;
		letter-spacing: -0.015em;
	}

	.top-cta {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-chalk-dim);
		text-decoration: none;
		padding: 0.45rem 0.9rem;
		border: 1px solid var(--color-line-strong);
		transition:
			color 140ms ease,
			border-color 140ms ease;
	}

	.top-cta:hover {
		color: var(--color-chalk);
		border-color: var(--color-chalk-faint);
	}

	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1.06fr) minmax(0, 0.94fr);
		gap: clamp(2rem, 5vw, 5rem);
		align-items: center;
		padding: clamp(3rem, 7vw, 6rem) clamp(1.25rem, 5vw, 4rem);
		flex: 1;
	}

	.hero-copy h1 {
		font-size: clamp(2.75rem, 6.2vw, 5rem);
		margin-bottom: 1.35rem;
	}

	.lede {
		color: var(--color-chalk-dim);
		font-size: clamp(1rem, 1.15vw, 1.125rem);
		line-height: 1.6;
		max-width: 46ch;
		margin: 0 0 2.25rem;
	}

	.cta {
		display: inline-block;
		padding: 0.85rem 1.6rem;
		background: var(--color-ember);
		color: var(--color-ink-950);
		font-size: 0.9375rem;
		font-weight: 700;
		text-decoration: none;
		transition: background-color 140ms ease;
	}

	.cta:hover {
		background: var(--color-ember-bright);
	}

	.cta:active {
		background: var(--color-ember-deep);
	}

	.hero-plate {
		margin: 0;
		display: grid;
		gap: 0.75rem;
	}

	.hero-plate img {
		width: 100%;
		height: auto;
		aspect-ratio: 3 / 4;
		object-fit: cover;
		display: block;
		filter: saturate(0.72) contrast(1.06);
	}

	.facts {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		border-top: 1px solid var(--color-line);
	}

	.facts article {
		padding: 2rem clamp(1.25rem, 3vw, 2.25rem);
		border-right: 1px solid var(--color-line);
	}

	.facts article:last-child {
		border-right: 0;
	}

	.facts h2 {
		font-size: 1.0625rem;
		margin-bottom: 0.6rem;
	}

	.facts p {
		margin: 0;
		color: var(--color-chalk-dim);
		font-size: 0.875rem;
		line-height: 1.6;
		max-width: 32ch;
	}

	/* --- how it works --- */
	.how {
		padding: 3.5rem clamp(1.25rem, 5vw, 4rem);
		border-top: 1px solid var(--color-line);
	}

	.section-title {
		font-size: clamp(1.5rem, 3vw, 2.25rem);
		margin-bottom: 2.5rem;
	}

	.steps {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 2rem;
	}

	.step {
		border: 1px solid var(--color-line);
		padding: 1.75rem;
		display: grid;
		gap: 0.75rem;
		align-content: start;
	}

	.step-num {
		font-size: 0.75rem;
		color: var(--color-ember);
		letter-spacing: 0.1em;
	}

	.step h3 {
		font-size: 1.125rem;
	}

	.step p {
		margin: 0;
		color: var(--color-chalk-dim);
		font-size: 0.875rem;
		line-height: 1.6;
	}

	/* --- stats --- */
	.stats {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		border-top: 1px solid var(--color-line);
	}

	.stat {
		padding: 2.5rem clamp(1.25rem, 3vw, 2.25rem);
		border-right: 1px solid var(--color-line);
		display: grid;
		gap: 0.5rem;
		justify-items: center;
		text-align: center;
	}

	.stat:last-child {
		border-right: 0;
	}

	.stat-num {
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1;
		color: var(--color-ember);
	}

	.stat-label {
		font-size: 0.8125rem;
		color: var(--color-chalk-faint);
		max-width: 16ch;
	}

	/* --- bottom cta --- */
	.bottom-cta {
		padding: 4rem clamp(1.25rem, 5vw, 4rem);
		border-top: 1px solid var(--color-line);
		text-align: center;
		display: grid;
		gap: 1rem;
		justify-items: center;
	}

	.bottom-cta h2 {
		font-size: clamp(1.75rem, 3.5vw, 2.75rem);
	}

	.bottom-cta p {
		margin: 0;
		color: var(--color-chalk-dim);
		font-size: 1.0625rem;
	}

	.cta-row {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.cta-ghost {
		display: inline-block;
		padding: 0.85rem 1.6rem;
		background: transparent;
		color: var(--color-chalk);
		font-size: 0.9375rem;
		font-weight: 600;
		text-decoration: none;
		border: 1px solid var(--color-line-strong);
		transition:
			color 140ms ease,
			border-color 140ms ease;
	}

	.cta-ghost:hover {
		color: var(--color-chalk);
		border-color: var(--color-chalk-faint);
	}

	@media (max-width: 900px) {
		.hero {
			grid-template-columns: 1fr;
			gap: 2.5rem;
			padding: 2.5rem 1.25rem 3rem;
		}

		.hero-plate img {
			aspect-ratio: 4 / 3;
		}

		.facts {
			grid-template-columns: 1fr;
		}

		.facts article {
			border-right: 0;
			border-bottom: 1px solid var(--color-line);
		}

		.facts article:last-child {
			border-bottom: 0;
		}

		.steps {
			grid-template-columns: 1fr;
		}

		.stats {
			grid-template-columns: repeat(2, 1fr);
		}

		.stat:nth-child(2n) {
			border-right: 0;
		}

		.stat:nth-child(n + 3) {
			border-top: 1px solid var(--color-line);
		}
	}
</style>
