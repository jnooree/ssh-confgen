<script lang="ts">
	import { resolve } from '$app/paths';
	import ThemeModeToggle from '$lib/components/ThemeModeToggle.svelte';
	import { FileCodeOutline } from 'flowbite-svelte-icons';

	let { children } = $props();
</script>

<div
	class="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"
>
	<header
		class="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
	>
		<div
			class="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8"
		>
			<div class="flex flex-wrap items-center justify-between gap-4">
				<a href={resolve('/')} class="flex items-center gap-3">
					<span
						class="grid size-10 place-items-center rounded-md bg-primary-700 text-white"
					>
						<FileCodeOutline width={22} height={22} aria-hidden="true" />
					</span>
					<span>
						<span class="block text-xl font-semibold tracking-normal">
							SSH Config Generator
						</span>
						<span class="block text-sm text-slate-600 dark:text-slate-400">
							Static helpers for Linux HPC reverse SSH profiles.
						</span>
					</span>
				</a>

				<div class="flex items-center gap-3">
					<nav class="flex items-center gap-2 text-sm" aria-label="Main">
						<a
							href={resolve('/')}
							class="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
						>
							Home
						</a>
						<a
							href={resolve('/admin/')}
							class="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
						>
							Admin
						</a>
						<a
							href={resolve('/user/')}
							class="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
						>
							User
						</a>
					</nav>
					<ThemeModeToggle />
				</div>
			</div>
		</div>
	</header>

	{@render children()}
</div>
