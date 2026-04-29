<script lang="ts">
	let {
		text,
		testId,
		flush = false
	}: {
		text: string;
		testId?: string;
		flush?: boolean;
	} = $props();
</script>

<pre
	data-testid={testId}
	class={`${flush ? 'rounded-none border-0' : 'mt-3 rounded-md border border-slate-800'} max-h-96 overflow-auto bg-slate-950 p-4 text-sm text-slate-50`}><code
		>{text}</code
	></pre>
