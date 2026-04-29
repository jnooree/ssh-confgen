<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button, Card } from 'flowbite-svelte';
	import {
		ArrowRightOutline,
		ServerOutline,
		UserSettingsOutline,
	} from 'flowbite-svelte-icons';
</script>

<svelte:head>
	<title>SSH Config Generator</title>
	<meta
		name="description"
		content="Choose an admin or user workflow for static Linux HPC SSH configuration generation."
	/>
</svelte:head>

<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<section class="max-w-3xl">
		<h1
			class="text-3xl font-semibold tracking-normal text-slate-950 dark:text-white"
		>
			Choose your SSH configuration workflow
		</h1>
		<p class="mt-3 text-base text-slate-600 dark:text-slate-400">
			Generate a distributable remote profile as an admin, or use an existing
			profile to create local and remote SSH config artifacts as a user.
		</p>
	</section>

	<section class="mt-8 grid gap-5 md:grid-cols-2">
		<Card class="max-w-none p-5">
			<div
				class="mb-4 grid size-11 place-items-center rounded-md bg-primary-700 text-white"
			>
				<ServerOutline class="size-6" aria-hidden="true" />
			</div>
			<h2 class="text-xl font-semibold text-slate-950 dark:text-white">
				Admin profile generator
			</h2>
			<p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
				Build a validated YAML remote profile that can be distributed to users.
			</p>
			<Button href={resolve('/admin/')} class="mt-5 w-fit">
				Open admin wizard
				<ArrowRightOutline class="ms-2 size-4" aria-hidden="true" />
			</Button>
		</Card>

		<Card class="max-w-none p-5">
			<div
				class="mb-4 grid size-11 place-items-center rounded-md bg-primary-700 text-white"
			>
				<UserSettingsOutline class="size-6" aria-hidden="true" />
			</div>
			<h2 class="text-xl font-semibold text-slate-950 dark:text-white">
				User configuration wizard
			</h2>
			<p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
				Upload or paste a profile and generate copyable SSH config files and
				setup commands.
			</p>
			<Button href={resolve('/user/')} class="mt-5 w-fit">
				Open user wizard
				<ArrowRightOutline class="ms-2 size-4" aria-hidden="true" />
			</Button>
		</Card>
	</section>
</main>
