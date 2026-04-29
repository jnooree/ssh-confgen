<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import { CheckCircle2, Clipboard, Download } from 'lucide-svelte';

	let {
		title,
		fileName,
		label,
		text,
		copied,
		copyText,
		downloadText
	}: {
		title: string;
		fileName: string;
		label: string;
		text: string;
		copied: string | null;
		copyText: (label: string, text: string) => Promise<void>;
		downloadText: (fileName: string, text: string) => void;
	} = $props();
</script>

<div class="flex min-h-14 items-center justify-between gap-3">
	<h2 class="text-base font-semibold text-slate-950">{title}</h2>
	<div class="flex shrink-0 items-center gap-2">
		<Button
			type="button"
			color="alternative"
			size="sm"
			class="size-9 p-0"
			aria-label={`Copy ${label}`}
			title={`Copy ${label}`}
			onclick={() => copyText(label, text)}
		>
			{#if copied === label}
				<CheckCircle2 size={17} aria-hidden="true" />
			{:else}
				<Clipboard size={17} aria-hidden="true" />
			{/if}
		</Button>
		<Button
			type="button"
			color="alternative"
			size="sm"
			class="size-9 p-0"
			aria-label={`Download ${label}`}
			title={`Download ${label}`}
			onclick={() => downloadText(fileName, text)}
		>
			<Download size={17} aria-hidden="true" />
		</Button>
	</div>
</div>
