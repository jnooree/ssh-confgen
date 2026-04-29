import { z } from 'zod';
import type { RemoteProfile } from './profile';

const userNameSchema = z
	.string()
	.trim()
	.min(1)
	.regex(
		/^[A-Za-z0-9._-]+$/,
		'Use letters, numbers, dots, underscores, or hyphens'
	);

const hostAliasSchema = z
	.string()
	.trim()
	.min(1)
	.regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, 'Use a valid SSH host alias');

const portSchema = z.coerce.number().int().min(1).max(65535);

const ipv4Schema = z
	.string()
	.trim()
	.refine(isIpv4, 'Use an IPv4 address such as 203.0.113.10');

export const userSettingsSchema = z.object({
	localUser: userNameSchema,
	remoteUser: userNameSchema,
	reverseHost: hostAliasSchema,
	localOs: z.enum(['linux', 'macos']),
	localSshPort: portSchema,
	localIpMode: z.enum(['private', 'public']),
	localIp: ipv4Schema,
	enableX11: z.boolean(),
	xAuthLocation: z.string().trim().min(1)
});

export type UserSettings = z.infer<typeof userSettingsSchema>;

export interface GeneratedArtifacts {
	localConfig: string;
	remoteConfig: string;
	remoteRootConfig: string;
	localSetup: string;
	remoteSetup: string;
	warnings: string[];
	usesReverseSocket: boolean;
	localForwardSocketPath: string | null;
	remoteProxySocketPath: string | null;
}

const controlPath = '~/.ssh/control-%L-%r@%h:%p';

export function generateArtifacts(
	profile: RemoteProfile,
	settings: UserSettings
): GeneratedArtifacts {
	const usesReverseSocket =
		settings.localIpMode === 'private' &&
		profile.features.reverseSshViaUnixSocket;
	const localForwardSocketPath = usesReverseSocket
		? formatSocketPath(profile, settings, { remoteUser: '%r', localUser: '%u' })
		: null;
	const remoteProxySocketPath = usesReverseSocket
		? formatSocketPath(profile, settings, {
				remoteUser: settings.remoteUser,
				localUser: '%r'
			})
		: null;
	const localConfig = generateLocalConfig(
		profile,
		settings,
		usesReverseSocket,
		localForwardSocketPath
	);
	const remoteConfig = generateRemoteConfig(
		profile,
		settings,
		usesReverseSocket,
		remoteProxySocketPath
	);
	const remoteRootConfig = generateRemoteRootConfig();

	return {
		localConfig,
		remoteConfig,
		remoteRootConfig,
		localSetup: generateLocalSetup(profile, settings, localConfig),
		remoteSetup: generateRemoteSetup(
			profile,
			settings,
			remoteConfig,
			remoteRootConfig
		),
		warnings: generateWarnings(profile, settings, usesReverseSocket),
		usesReverseSocket,
		localForwardSocketPath,
		remoteProxySocketPath
	};
}

export function formatSocketPath(
	profile: RemoteProfile,
	settings: Pick<UserSettings, 'reverseHost' | 'localSshPort'>,
	identity: { remoteUser: string; localUser: string }
): string {
	const rendered = renderTemplate(profile.socket.template, {
		remoteUser: identity.remoteUser,
		localUser: identity.localUser,
		reverseHost: settings.reverseHost,
		localSshPort: String(settings.localSshPort)
	});

	if (rendered.startsWith('/')) {
		return rendered;
	}

	return `${profile.socket.directory.replace(/\/+$/, '')}/${rendered}`;
}

function generateLocalConfig(
	profile: RemoteProfile,
	settings: UserSettings,
	usesReverseSocket: boolean,
	localForwardSocketPath: string | null
): string {
	const hostBlocks = profile.entryHosts.map((host) =>
		[
			`Host ${host.alias}`,
			`    HostName ${host.hostName}`,
			`    Port ${host.port}`,
			`    User ${settings.remoteUser}`,
			...(host.alias === profile.proxyHostAlias ? ['    ControlPath none'] : [])
		].join('\n')
	);

	const patterns = profile.remoteHostPatterns.join(' ');
	const patternBlock = [
		`Host ${patterns}`,
		'    ControlMaster auto',
		`    User ${settings.remoteUser}`,
		...(settings.enableX11 && profile.features.x11Forwarding
			? ['    ForwardX11 yes']
			: []),
		...(usesReverseSocket && localForwardSocketPath
			? [
					`    RemoteForward ${localForwardSocketPath} localhost:${settings.localSshPort}`
				]
			: [])
	].join('\n');

	const proxyJumpBlock = [
		`Host !${profile.defaultLoginAlias} ${patterns}`,
		`    ProxyJump ${profile.proxyHostAlias}`
	].join('\n');

	const globalBlock = [
		'Host *',
		`    ControlPath ${controlPath}`,
		'    ControlPersist 10m',
		`    SetEnv LC_HOSTNAME=${settings.reverseHost}`,
		...(settings.enableX11 && profile.features.x11Forwarding
			? [
					'    ForwardX11Trusted no',
					'    ForwardX11Timeout 0',
					`    XAuthLocation ${settings.xAuthLocation}`
				]
			: [])
	].join('\n');

	return (
		[...hostBlocks, patternBlock, proxyJumpBlock, globalBlock].join('\n\n') +
		'\n'
	);
}

function generateRemoteConfig(
	profile: RemoteProfile,
	settings: UserSettings,
	usesReverseSocket: boolean,
	remoteProxySocketPath: string | null
): string {
	const base = [
		`Host ${settings.reverseHost}`,
		`    User ${settings.localUser}`,
		'    ControlMaster auto'
	];

	if (usesReverseSocket && remoteProxySocketPath) {
		return (
			[
				...base,
				'    HostName localhost',
				`    HostKeyAlias ${settings.reverseHost}`,
				'    CheckHostIP no',
				`    ProxyCommand socat UNIX:${remoteProxySocketPath} -`
			].join('\n') + '\n'
		);
	}

	return (
		[
			...base,
			`    HostName ${settings.localIp}`,
			`    Port ${settings.localSshPort}`
		].join('\n') + '\n'
	);
}

function generateRemoteRootConfig(): string {
	return (
		[
			'Include config.d/*.conf',
			'',
			'Host *',
			`    ControlPath ${controlPath}`,
			'    ControlPersist 1h'
		].join('\n') + '\n'
	);
}

function generateLocalSetup(
	profile: RemoteProfile,
	settings: UserSettings,
	localConfig: string
): string {
	const sshdCommands =
		settings.localOs === 'macos'
			? 'sudo systemsetup -setremotelogin on'
			: [
					'sudo apt update',
					'sudo apt install -y openssh-server',
					'sudo systemctl enable --now ssh || sudo service ssh restart'
				].join('\n');

	return (
		[
			'# Review the generated SSH config before appending it.',
			'mkdir -p ~/.ssh',
			'chmod 700 ~/.ssh',
			'test -f ~/.ssh/id_ed25519 || ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519',
			`ssh-copy-id ${shellQuote(profile.defaultLoginAlias)}`,
			sshdCommands,
			"cat >> ~/.ssh/config <<'SSHCONF'",
			localConfig.trimEnd(),
			'SSHCONF'
		].join('\n') + '\n'
	);
}

function generateRemoteSetup(
	profile: RemoteProfile,
	settings: UserSettings,
	remoteConfig: string,
	remoteRootConfig: string
): string {
	const requiredChecks = profile.remote.requires
		.map(
			(tool) =>
				`command -v ${shellQuote(tool)} >/dev/null || echo "Missing remote tool: ${tool}"`
		)
		.join('\n');

	return (
		[
			'mkdir -p ~/.ssh/config.d',
			'chmod 700 ~/.ssh',
			requiredChecks,
			'grep -qxF "Include config.d/*.conf" ~/.ssh/config 2>/dev/null || cat > ~/.ssh/config <<\'SSHCONF\'',
			remoteRootConfig.trimEnd(),
			'SSHCONF',
			`cat > ~/.ssh/config.d/${shellQuote(`${settings.reverseHost}.conf`)} <<'SSHCONF'`,
			remoteConfig.trimEnd(),
			'SSHCONF'
		].join('\n') + '\n'
	);
}

function generateWarnings(
	profile: RemoteProfile,
	settings: UserSettings,
	usesReverseSocket: boolean
): string[] {
	const warnings = [
		'This static page only generates files and commands; it cannot edit SSH config, copy keys, enable sshd, or verify remote packages.'
	];

	if (
		settings.localIpMode === 'private' &&
		!profile.features.reverseSshViaUnixSocket
	) {
		warnings.push(
			'The profile disables reverse SSH through a Unix socket, so a private local IP may not be reachable from the remote side.'
		);
	}

	if (usesReverseSocket) {
		warnings.push(
			'Keep a local SSH connection to the HPC login open so the remote Unix socket forward stays available.'
		);
	}

	if (settings.enableX11 && !profile.features.x11Forwarding) {
		warnings.push(
			'X11 forwarding was requested, but this remote profile disables X11 config generation.'
		);
	}

	if (profile.remote.platform !== 'linux') {
		warnings.push('Only Linux remote systems are supported.');
	}

	return warnings;
}

function renderTemplate(
	template: string,
	values: Record<string, string>
): string {
	return template.replace(
		/\{([A-Za-z0-9_]+)\}/g,
		(match, key: string) => values[key] ?? match
	);
}

function shellQuote(value: string): string {
	return `'${value.replaceAll("'", "'\\''")}'`;
}

function isIpv4(value: string): boolean {
	const parts = value.split('.');

	return (
		parts.length === 4 &&
		parts.every((part) => /^\d+$/.test(part) && Number(part) <= 255)
	);
}
