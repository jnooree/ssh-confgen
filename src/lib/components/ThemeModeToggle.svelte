<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import {
		DesktopPcOutline,
		MoonOutline,
		SunOutline,
	} from 'flowbite-svelte-icons';
	import { onMount } from 'svelte';

	type ThemeMode = 'light' | 'dark' | 'auto';

	const storageKey = 'ssh-confgen-theme-mode';
	let mode = $state<ThemeMode>(readStoredMode());

	function readStoredMode(): ThemeMode {
		if (typeof localStorage === 'undefined') {
			return 'auto';
		}

		try {
			const stored = localStorage.getItem(storageKey);
			return stored === 'light' || stored === 'dark' || stored === 'auto'
				? stored
				: 'auto';
		} catch {
			return 'auto';
		}
	}

	function applyMode(nextMode: ThemeMode) {
		const prefersDark = window.matchMedia(
			'(prefers-color-scheme: dark)'
		).matches;
		const useDark = nextMode === 'dark' || (nextMode === 'auto' && prefersDark);

		document.documentElement.classList.toggle('dark', useDark);
		document.documentElement.dataset.themeMode = nextMode;
	}

	function setMode(nextMode: ThemeMode) {
		mode = nextMode;
		localStorage.setItem(storageKey, nextMode);
		applyMode(nextMode);
	}

	onMount(() => {
		applyMode(mode);

		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const updateAutoMode = () => {
			if (mode === 'auto') {
				applyMode('auto');
			}
		};

		media.addEventListener('change', updateAutoMode);

		return () => {
			media.removeEventListener('change', updateAutoMode);
		};
	});
</script>

<div
	class="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-950"
	role="group"
	aria-label="Theme mode"
>
	<Button
		type="button"
		size="sm"
		color={mode === 'light' ? 'primary' : 'alternative'}
		class="size-8 p-0"
		aria-label="Light theme"
		aria-pressed={mode === 'light'}
		title="Light theme"
		onclick={() => setMode('light')}
	>
		<SunOutline class="size-4" aria-hidden="true" />
	</Button>
	<Button
		type="button"
		size="sm"
		color={mode === 'dark' ? 'primary' : 'alternative'}
		class="size-8 p-0"
		aria-label="Dark theme"
		aria-pressed={mode === 'dark'}
		title="Dark theme"
		onclick={() => setMode('dark')}
	>
		<MoonOutline class="size-4" aria-hidden="true" />
	</Button>
	<Button
		type="button"
		size="sm"
		color={mode === 'auto' ? 'primary' : 'alternative'}
		class="size-8 p-0"
		aria-label="Auto theme"
		aria-pressed={mode === 'auto'}
		title="Auto theme"
		onclick={() => setMode('auto')}
	>
		<DesktopPcOutline class="size-4" aria-hidden="true" />
	</Button>
</div>
