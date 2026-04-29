<script lang="ts">
	import {
		Alert,
		Button,
		Card,
		Checkbox,
		Input,
		Label,
		Select,
		Textarea,
	} from 'flowbite-svelte';
	import {
		CheckCircleSolid,
		ExclamationCircleSolid,
		PlusOutline,
		TrashBinOutline,
	} from 'flowbite-svelte-icons';
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import OutputHeader from '$lib/components/OutputHeader.svelte';
	import {
		parseRemoteProfileText,
		remoteProfileSchema,
		sampleProfileYaml,
		serializeRemoteProfileYaml,
	} from '$lib';
	import type { RemoteProfile } from '$lib';

	type EntryHostForm = RemoteProfile['entryHosts'][number];

	const sampleResult = parseRemoteProfileText(sampleProfileYaml);

	if (!sampleResult.ok) {
		throw new Error('Sample profile must be valid');
	}

	const sampleProfile = sampleResult.profile;
	let displayName = $state(sampleProfile.displayName);
	let entryHosts = $state<EntryHostForm[]>(
		sampleProfile.entryHosts.map((host) => ({ ...host }))
	);
	let proxyHostAlias = $state(sampleProfile.proxyHostAlias);
	let defaultLoginAlias = $state(sampleProfile.defaultLoginAlias);
	let remoteHostPatternsText = $state(
		sampleProfile.remoteHostPatterns.join('\n')
	);
	let socketDirectory = $state(sampleProfile.socket.directory);
	let socketTemplate = $state(sampleProfile.socket.template);
	let remoteRequiresText = $state(sampleProfile.remote.requires.join('\n'));
	let x11Forwarding = $state(sampleProfile.features.x11Forwarding);
	let reverseSshViaUnixSocket = $state(
		sampleProfile.features.reverseSshViaUnixSocket
	);
	let copied = $state<string | null>(null);

	const hostAliasOptions = $derived(
		entryHosts.map((host) => ({
			value: host.alias,
			name: host.alias || '(blank alias)',
		}))
	);
	const profileCandidate = $derived({
		profileVersion: 1 as const,
		displayName,
		entryHosts: entryHosts.map((host) => ({
			alias: host.alias,
			hostName: host.hostName,
			port: host.port,
		})),
		proxyHostAlias,
		defaultLoginAlias,
		remoteHostPatterns: splitLines(remoteHostPatternsText),
		socket: {
			directory: socketDirectory,
			template: socketTemplate,
		},
		remote: {
			platform: 'linux' as const,
			requires: splitLines(remoteRequiresText),
		},
		features: {
			x11Forwarding,
			reverseSshViaUnixSocket,
		},
	});
	const profileValidation = $derived(
		remoteProfileSchema.safeParse(profileCandidate)
	);
	const profileErrors = $derived(
		profileValidation.success
			? []
			: profileValidation.error.issues.map(formatIssue)
	);
	const profileYaml = $derived(
		profileValidation.success
			? serializeRemoteProfileYaml(profileValidation.data)
			: ''
	);

	function addEntryHost() {
		const nextIndex = entryHosts.length + 1;
		entryHosts.push({
			alias: `login-${nextIndex}`,
			hostName: `login-${nextIndex}.example.edu`,
			port: 22,
		});
	}

	function removeEntryHost(index: number) {
		if (entryHosts.length <= 1) {
			return;
		}

		entryHosts.splice(index, 1);

		const aliases = entryHosts.map((host) => host.alias);
		proxyHostAlias = aliases.includes(proxyHostAlias)
			? proxyHostAlias
			: aliases[0];
		defaultLoginAlias = aliases.includes(defaultLoginAlias)
			? defaultLoginAlias
			: aliases[0];
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
		const blob = new Blob([text], { type: 'text/yaml;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = fileName;
		link.click();
		URL.revokeObjectURL(url);
	}

	function splitLines(value: string): string[] {
		return value
			.split(/\r?\n/)
			.map((item) => item.trim())
			.filter(Boolean);
	}

	function formatIssue(issue: {
		path: PropertyKey[];
		message: string;
	}): string {
		const path = issue.path.length > 0 ? issue.path.join('.') : 'profile';
		return `${path}: ${issue.message}`;
	}
</script>

<svelte:head>
	<title>Admin Profile Generator | SSH Config Generator</title>
	<meta
		name="description"
		content="Generate a validated YAML remote profile for Linux HPC SSH configuration users."
	/>
</svelte:head>

<main
	class="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(420px,560px)_1fr] lg:px-8"
>
	<section class="space-y-5">
		<div>
			<h1
				class="text-2xl font-semibold tracking-normal text-slate-950 dark:text-white"
			>
				Admin profile generator
			</h1>
			<p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
				Fill in cluster connection details once, then distribute the generated
				YAML profile to users.
			</p>
		</div>

		<Card class="max-w-none p-4 sm:p-5">
			<h2 class="mb-4 text-base font-semibold text-slate-950 dark:text-white">
				Profile details
			</h2>
			<div class="space-y-4">
				<div>
					<Label for="display-name" class="mb-2 block">Display name</Label>
					<Input id="display-name" bind:value={displayName} />
				</div>

				<div class="space-y-3">
					<div class="flex items-center justify-between gap-3">
						<h3 class="text-sm font-semibold text-slate-950 dark:text-white">
							Entry hosts
						</h3>
						<Button
							type="button"
							color="alternative"
							size="sm"
							onclick={addEntryHost}
						>
							<PlusOutline class="me-2 size-4" aria-hidden="true" />
							Add host
						</Button>
					</div>

					{#each entryHosts as host, index (index)}
						<div
							class="grid gap-3 rounded-md border border-slate-200 p-3 sm:grid-cols-[1fr_1fr_90px_auto] dark:border-slate-700"
						>
							<div>
								<Label for={`entry-alias-${index}`} class="mb-2 block"
									>Alias</Label
								>
								<Input id={`entry-alias-${index}`} bind:value={host.alias} />
							</div>
							<div>
								<Label for={`entry-hostname-${index}`} class="mb-2 block"
									>Hostname</Label
								>
								<Input
									id={`entry-hostname-${index}`}
									bind:value={host.hostName}
								/>
							</div>
							<div>
								<Label for={`entry-port-${index}`} class="mb-2 block"
									>Port</Label
								>
								<Input
									id={`entry-port-${index}`}
									type="number"
									min="1"
									max="65535"
									bind:value={host.port}
								/>
							</div>
							<div class="flex items-end">
								<Button
									type="button"
									color="alternative"
									size="sm"
									class="size-10 p-0"
									aria-label={`Remove entry host ${index + 1}`}
									title={`Remove entry host ${index + 1}`}
									disabled={entryHosts.length <= 1}
									onclick={() => removeEntryHost(index)}
								>
									<TrashBinOutline class="size-4" aria-hidden="true" />
								</Button>
							</div>
						</div>
					{/each}
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<Label for="proxy-host-alias" class="mb-2 block">Proxy host</Label>
						<Select
							id="proxy-host-alias"
							items={hostAliasOptions}
							bind:value={proxyHostAlias}
						/>
					</div>
					<div>
						<Label for="default-login-alias" class="mb-2 block"
							>Default login host</Label
						>
						<Select
							id="default-login-alias"
							items={hostAliasOptions}
							bind:value={defaultLoginAlias}
						/>
					</div>
				</div>

				<div>
					<Label for="remote-host-patterns" class="mb-2 block">
						Remote host patterns
					</Label>
					<Textarea
						id="remote-host-patterns"
						rows={4}
						bind:value={remoteHostPatternsText}
					/>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<Label for="socket-directory" class="mb-2 block"
							>Socket directory</Label
						>
						<Input id="socket-directory" bind:value={socketDirectory} />
					</div>
					<div>
						<Label for="socket-template" class="mb-2 block"
							>Socket template</Label
						>
						<Input id="socket-template" bind:value={socketTemplate} />
					</div>
				</div>

				<div>
					<Label for="remote-requires" class="mb-2 block">
						Required Linux tools
					</Label>
					<Textarea
						id="remote-requires"
						rows={3}
						bind:value={remoteRequiresText}
					/>
				</div>

				<div class="grid gap-3 sm:grid-cols-2">
					<Checkbox bind:checked={x11Forwarding}>Enable X11 option</Checkbox>
					<Checkbox bind:checked={reverseSshViaUnixSocket}>
						Enable reverse SSH via Unix socket
					</Checkbox>
				</div>

				{#if profileValidation.success}
					<Alert color="green" class="items-center">
						{#snippet icon()}
							<CheckCircleSolid class="size-5" aria-hidden="true" />
						{/snippet}
						<span class="font-medium">Profile YAML is valid.</span>
					</Alert>
				{:else}
					<Alert color="red" aria-label="Profile validation errors">
						{#snippet icon()}
							<ExclamationCircleSolid class="size-5" aria-hidden="true" />
						{/snippet}
						<ul class="space-y-1">
							{#each profileErrors as error (error)}
								<li>{error}</li>
							{/each}
						</ul>
					</Alert>
				{/if}
			</div>
		</Card>
	</section>

	<section>
		<Card class="max-w-none p-4 sm:p-5">
			{#if profileValidation.success}
				<OutputHeader
					title="Generated remote profile"
					fileName="remote-profile.yaml"
					label="remote profile"
					text={profileYaml}
					{copied}
					{copyText}
					{downloadText}
				/>
				<CodeBlock testId="admin-profile-output" text={profileYaml} />
			{:else}
				<Alert color="blue">
					{#snippet icon()}
						<ExclamationCircleSolid class="size-5" aria-hidden="true" />
					{/snippet}
					<span class="font-medium">
						Generated YAML will appear after the profile fields are valid.
					</span>
				</Alert>
			{/if}
		</Card>
	</section>
</main>
