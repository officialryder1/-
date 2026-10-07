<script lang="ts">
	import './layout.css';
	import RoleLayout from '#lib/components/RoleLayout.svelte';
	import type { GymHouseUser } from '#lib/server/mock-auth';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: { user: GymHouseUser | null }; children: Snippet } = $props();
</script>

{#if data.user}
	<RoleLayout user={data.user}>
		{@render children()}
	</RoleLayout>
{:else}
	{@render children()}
{/if}
