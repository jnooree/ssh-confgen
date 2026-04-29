import { describe, expect, it } from 'vitest';
import { parseRemoteProfileText, serializeRemoteProfileYaml } from './profile';
import { sampleProfileYaml } from './sampleProfile';
import { generateArtifacts, userSettingsSchema } from './sshConfig';

const baseSettings = userSettingsSchema.parse({
	localUser: 'localdev',
	remoteUser: 'remoteuser',
	reverseHost: 'workstation',
	localOs: 'linux',
	localSshPort: 2222,
	localIpMode: 'private',
	localIp: '203.0.113.10',
	enableX11: false,
	xAuthLocation: '/usr/bin/xauth',
});

describe('remote profile parsing', () => {
	it('accepts the sanitized sample profile', () => {
		expect.assertions(2);

		const result = parseRemoteProfileText(sampleProfileYaml);

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.profile.remote.platform).toBe('linux');
		}
	});

	it('round-trips serialized remote profile YAML', () => {
		expect.assertions(3);

		const result = parseRemoteProfileText(sampleProfileYaml);
		if (!result.ok) throw new Error('sample profile should parse');

		const yaml = serializeRemoteProfileYaml(result.profile);
		const reparsed = parseRemoteProfileText(yaml);

		expect(yaml).toContain('profileVersion: 1');
		expect(reparsed.ok).toBe(true);
		if (reparsed.ok) {
			expect(reparsed.profile).toEqual(result.profile);
		}
	});

	it('rejects profiles whose aliases do not point at entry hosts', () => {
		expect.assertions(2);

		const result = parseRemoteProfileText(`
profileVersion: 1
displayName: Broken
entryHosts:
  - alias: login
    hostName: login.example.edu
proxyHostAlias: missing
defaultLoginAlias: login
remoteHostPatterns: [compute*]
socket:
  directory: /tmp/sockets
  template: ssh-{remoteUser}-{localUser}@{reverseHost}_{localSshPort}.sock
remote:
  platform: linux
`);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.join('\n')).toContain('proxyHostAlias');
		}
	});
});

describe('SSH config generation', () => {
	it('generates reverse Unix-socket forwarding for private local addresses', () => {
		expect.assertions(8);

		const parsed = parseRemoteProfileText(sampleProfileYaml);
		if (!parsed.ok) throw new Error('sample profile should parse');

		const artifacts = generateArtifacts(parsed.profile, baseSettings);

		expect(artifacts.usesReverseSocket).toBe(true);
		expect(artifacts.localRootConfig).toContain('Include config.d/*.conf');
		expect(artifacts.localRootConfig).toContain('ControlPath');
		expect(artifacts.localProfileConfig).toContain(
			'RemoteForward /shared/sockets/ssh-%r-%u@workstation_2222.sock localhost:2222'
		);
		expect(artifacts.localProfileConfig).toContain('ProxyJump hpc-proxy');
		expect(artifacts.localProfileConfig).not.toContain(
			'Include config.d/*.conf'
		);
		expect(artifacts.remoteConfig).toContain(
			'ProxyCommand socat UNIX:/shared/sockets/ssh-remoteuser-%r@workstation_2222.sock -'
		);
		expect(artifacts.remoteConfig).toContain('HostName localhost');
	});

	it('generates direct host and port config for public local addresses', () => {
		expect.assertions(4);

		const parsed = parseRemoteProfileText(sampleProfileYaml);
		if (!parsed.ok) throw new Error('sample profile should parse');

		const artifacts = generateArtifacts(parsed.profile, {
			...baseSettings,
			localIpMode: 'public',
			localIp: '198.51.100.42',
		});

		expect(artifacts.usesReverseSocket).toBe(false);
		expect(artifacts.localProfileConfig).not.toContain('RemoteForward');
		expect(artifacts.remoteConfig).toContain('HostName 198.51.100.42');
		expect(artifacts.remoteConfig).toContain('Port 2222');
	});

	it('uses profile data instead of built-in cluster defaults', () => {
		expect.assertions(5);

		const parsed = parseRemoteProfileText(sampleProfileYaml);
		if (!parsed.ok) throw new Error('sample profile should parse');

		const artifacts = generateArtifacts(parsed.profile, baseSettings);
		const combined = `${artifacts.localProfileConfig}\n${artifacts.remoteConfig}\n${artifacts.remoteSetup}`;

		expect(combined).toContain('example.edu');
		expect(combined).toContain('/shared/sockets');
		expect(artifacts.fileNames.localProfileConfig).toBe(
			'hpc-login-workstation.conf'
		);
		expect(artifacts.fileNames.remoteConfig).toBe('workstation.conf');
		expect(combined).not.toContain('/store/');
	});
});
