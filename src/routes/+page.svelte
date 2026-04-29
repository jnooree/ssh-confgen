<script lang="ts">
	import {
		Alert,
		Button,
		Card,
		Checkbox,
		Fileupload,
		Input,
		Label,
		Select,
		TabItem,
		Tabs,
		Textarea,
	} from 'flowbite-svelte';
	import {
		AlertTriangle,
		CheckCircle2,
		FileText,
		RefreshCw,
		Upload,
	} from 'lucide-svelte';
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import OutputHeader from '$lib/components/OutputHeader.svelte';
	import {
		generateArtifacts,
		parseRemoteProfileText,
		sampleProfileYaml,
		userSettingsSchema,
	} from '$lib';
	import type { GeneratedArtifacts } from '$lib';

	let profileText = $state(sampleProfileYaml);
	let localUser = $state('alice');
	let remoteUser = $state('alice');
	let reverseHost = $state('laptop');
	let localOs = $state<'linux' | 'macos'>('linux');
	let localSshPort = $state(22);
	let localIpMode = $state<'private' | 'public'>('private');
	let localIp = $state('203.0.113.10');
	let enableX11 = $state(false);
	let xAuthLocation = $state('/usr/bin/xauth');
	let copied = $state<string | null>(null);

	const localOsOptions = [
		{ value: 'linux', name: 'Linux' },
		{ value: 'macos', name: 'macOS' },
	];
	const localIpModeOptions = [
		{ value: 'private', name: 'Private or firewalled' },
		{ value: 'public', name: 'Directly reachable' },
	];

	const profileResult = $derived(parseRemoteProfileText(profileText));
	const settingsResult = $derived(
		userSettingsSchema.safeParse({
			localUser,
			remoteUser,
			reverseHost,
			localOs,
			localSshPort,
			localIpMode,
			localIp,
			enableX11,
			xAuthLocation,
		})
	);
	const artifacts = $derived<GeneratedArtifacts | null>(
		profileResult.ok && settingsResult.success
			? generateArtifacts(profileResult.profile, settingsResult.data)
			: null
	);
	const settingErrors = $derived(
		settingsResult.success
			? []
			: settingsResult.error.issues.map(
					(issue) => `${issue.path.join('.')}: ${issue.message}`
				)
	);

	async function loadProfileFile(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];

		if (file) {
			profileText = await file.text();
		}
	}

	function restoreSampleProfile() {
		profileText = sampleProfileYaml;
	}

	async function copyText(label: string, text: string) {
		await navigator.clipboard.writeText(text);
		copied = label;

		window.setTimeout(() => {
			if (copied === label) {
				copied = null;
			}
		}, 1800);
	}

	function downloadText(fileName: string, text: string) {
		const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = fileName;
		link.click();
		URL.revokeObjectURL(url);
	}
</script>

<svelte:head>
	<title>SSH Config Generator</title>
	<meta
		name="description"
		content="Generate local and remote SSH configuration for Linux HPC reverse SSH workflows."
	/>
</svelte:head>

<main class="min-h-screen bg-slate-50">
	<header class="border-b border-slate-200 bg-white">
		<div class="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
			<div class="flex items-center gap-3">
				<div
					class="grid size-10 place-items-center rounded-md bg-primary-700 text-white"
				>
					<FileText size={22} aria-hidden="true" />
				</div>
				<div>
					<h1 class="text-2xl font-semibold tracking-normal text-slate-950">
						SSH Config Generator
					</h1>
					<p class="text-sm text-slate-600">
						Static generator for Linux HPC reverse SSH profiles.
					</p>
				</div>
			</div>
		</div>
	</header>

	<div
		class="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(320px,420px)_1fr] lg:px-8"
	>
		<section class="space-y-5">
			<Card class="max-w-none p-4 sm:p-5">
				<div class="mb-4 flex items-center justify-between gap-3">
					<h2 class="text-base font-semibold text-slate-950">Remote Profile</h2>
					<Button
						type="button"
						color="alternative"
						size="sm"
						onclick={restoreSampleProfile}
					>
						<RefreshCw class="me-2" size={16} aria-hidden="true" />
						Sample
					</Button>
				</div>

				<div class="space-y-4">
					<div>
						<Label for="profile-upload" class="mb-2 block">
							Upload YAML or JSON
						</Label>
						<div class="flex items-center gap-2">
							<Upload
								class="shrink-0 text-slate-500"
								size={18}
								aria-hidden="true"
							/>
							<Fileupload
								id="profile-upload"
								accept=".yaml,.yml,.json"
								onchange={loadProfileFile}
								class="w-full"
							/>
						</div>
					</div>

					<div>
						<Label for="profile-text" class="mb-2 block">Profile contents</Label
						>
						<Textarea
							id="profile-text"
							rows={15}
							class="w-full font-mono text-sm"
							classes={{
								inner: 'bg-slate-950 text-slate-50 placeholder:text-slate-400',
							}}
							bind:value={profileText}
							spellcheck="false"
						/>
					</div>

					{#if profileResult.ok}
						<Alert color="green" class="items-center">
							{#snippet icon()}
								<CheckCircle2 class="size-5" aria-hidden="true" />
							{/snippet}
							<span class="font-medium"
								>{profileResult.profile.displayName}</span
							>
						</Alert>
					{:else}
						<Alert color="red" aria-label="Profile errors">
							{#snippet icon()}
								<AlertTriangle class="size-5" aria-hidden="true" />
							{/snippet}
							<ul class="space-y-1">
								{#each profileResult.errors as error (error)}
									<li>{error}</li>
								{/each}
							</ul>
						</Alert>
					{/if}
				</div>
			</Card>

			<Card class="max-w-none p-4 sm:p-5">
				<h2 class="mb-4 text-base font-semibold text-slate-950">User Inputs</h2>
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
					<div>
						<Label for="local-user" class="mb-2 block">Local username</Label>
						<Input id="local-user" bind:value={localUser} />
					</div>
					<div>
						<Label for="remote-user" class="mb-2 block">Remote username</Label>
						<Input id="remote-user" bind:value={remoteUser} />
					</div>
					<div>
						<Label for="reverse-host" class="mb-2 block"
							>Reverse host alias</Label
						>
						<Input id="reverse-host" bind:value={reverseHost} />
					</div>
					<div>
						<Label for="local-os" class="mb-2 block">Local OS</Label>
						<Select id="local-os" items={localOsOptions} bind:value={localOs} />
					</div>
					<div>
						<Label for="local-sshd-port" class="mb-2 block"
							>Local sshd port</Label
						>
						<Input
							id="local-sshd-port"
							type="number"
							min="1"
							max="65535"
							bind:value={localSshPort}
						/>
					</div>
					<div>
						<Label for="local-ip-mode" class="mb-2 block">Local IP mode</Label>
						<Select
							id="local-ip-mode"
							items={localIpModeOptions}
							bind:value={localIpMode}
						/>
					</div>
					<div>
						<Label for="local-ip" class="mb-2 block">Local IPv4 address</Label>
						<Input id="local-ip" bind:value={localIp} />
					</div>
					<div>
						<Label for="xauth-location" class="mb-2 block">XAuth location</Label
						>
						<Input id="xauth-location" bind:value={xAuthLocation} />
					</div>
					<Checkbox bind:checked={enableX11}>Generate X11 settings</Checkbox>
				</div>

				{#if settingErrors.length > 0}
					<Alert color="red" class="mt-4" aria-label="Input errors">
						{#snippet icon()}
							<AlertTriangle class="size-5" aria-hidden="true" />
						{/snippet}
						<ul class="space-y-1">
							{#each settingErrors as error (error)}
								<li>{error}</li>
							{/each}
						</ul>
					</Alert>
				{/if}
			</Card>
		</section>

		<section class="space-y-5">
			{#if artifacts}
				<Alert color="yellow" aria-label="Warnings">
					{#snippet icon()}
						<AlertTriangle class="size-5" aria-hidden="true" />
					{/snippet}
					<ul class="space-y-2">
						{#each artifacts.warnings as warning (warning)}
							<li>{warning}</li>
						{/each}
					</ul>
				</Alert>

				<Card class="max-w-none p-4 sm:p-5">
					<Tabs tabStyle="underline" classes={{ content: 'pt-4' }}>
						<TabItem title="Local config" open>
							<OutputHeader
								title="Local SSH config"
								fileName="local-ssh-config"
								label="local SSH config"
								text={artifacts.localConfig}
								{copied}
								{copyText}
								{downloadText}
							/>
							<CodeBlock
								testId="local-config-output"
								text={artifacts.localConfig}
							/>
						</TabItem>
						<TabItem title="Remote config">
							<OutputHeader
								title="Remote SSH config"
								fileName={`${reverseHost}.conf`}
								label="remote SSH config"
								text={artifacts.remoteConfig}
								{copied}
								{copyText}
								{downloadText}
							/>
							<CodeBlock
								testId="remote-config-output"
								text={artifacts.remoteConfig}
							/>
						</TabItem>
						<TabItem title="Remote root">
							<OutputHeader
								title="Remote root config"
								fileName="remote-ssh-config"
								label="remote root config"
								text={artifacts.remoteRootConfig}
								{copied}
								{copyText}
								{downloadText}
							/>
							<CodeBlock
								testId="remote-root-config-output"
								text={artifacts.remoteRootConfig}
							/>
						</TabItem>
						<TabItem title="Setup commands">
							<OutputHeader
								title="Setup commands"
								fileName="setup-commands.sh"
								label="setup commands"
								text={`${artifacts.localSetup}\n${artifacts.remoteSetup}`}
								{copied}
								{copyText}
								{downloadText}
							/>
							<div
								class="grid overflow-hidden rounded-md border border-slate-800 lg:grid-cols-2"
							>
								<div>
									<h3
										class="bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-50"
									>
										Local
									</h3>
									<CodeBlock text={artifacts.localSetup} flush />
								</div>
								<div
									class="border-t border-slate-800 lg:border-t-0 lg:border-l"
								>
									<h3
										class="bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-50"
									>
										Remote
									</h3>
									<CodeBlock text={artifacts.remoteSetup} flush />
								</div>
							</div>
						</TabItem>
					</Tabs>
				</Card>
			{:else}
				<Alert color="blue">
					{#snippet icon()}
						<AlertTriangle class="size-5" aria-hidden="true" />
					{/snippet}
					<span class="font-medium">
						Generated output is waiting for valid profile and user inputs.
					</span>
				</Alert>
			{/if}
		</section>
	</div>
</main>
