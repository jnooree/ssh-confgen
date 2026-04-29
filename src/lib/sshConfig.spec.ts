import { describe, expect, it } from 'vitest';
import { parseRemoteProfileText } from './profile';
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
	xAuthLocation: '/usr/bin/xauth'
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
		expect.assertions(6);

		const parsed = parseRemoteProfileText(sampleProfileYaml);
		if (!parsed.ok) throw new Error('sample profile should parse');

		const artifacts = generateArtifacts(parsed.profile, baseSettings);

		expect(artifacts.usesReverseSocket).toBe(true);
		expect(artifacts.localConfig).toContain(
			'RemoteForward /shared/sockets/ssh-%r-%u@workstation_2222.sock localhost:2222'
		);
		expect(artifacts.remoteConfig).toContain(
			'ProxyCommand socat UNIX:/shared/sockets/ssh-remoteuser-%r@workstation_2222.sock -'
		);
		expect(artifacts.remoteConfig).toContain('HostName localhost');
		expect(artifacts.localConfig).toContain('proxy.example.edu');
		expect(`${artifacts.localConfig}\n${artifacts.remoteConfig}`).not.toContain(
			'undefined'
		);
	});

	it('generates direct host and port config for public local addresses', () => {
		expect.assertions(4);

		const parsed = parseRemoteProfileText(sampleProfileYaml);
		if (!parsed.ok) throw new Error('sample profile should parse');

		const artifacts = generateArtifacts(parsed.profile, {
			...baseSettings,
			localIpMode: 'public',
			localIp: '198.51.100.42'
		});

		expect(artifacts.usesReverseSocket).toBe(false);
		expect(artifacts.localConfig).not.toContain('RemoteForward');
		expect(artifacts.remoteConfig).toContain('HostName 198.51.100.42');
		expect(artifacts.remoteConfig).toContain('Port 2222');
	});

	it('uses profile data instead of built-in cluster defaults', () => {
		expect.assertions(3);

		const parsed = parseRemoteProfileText(sampleProfileYaml);
		if (!parsed.ok) throw new Error('sample profile should parse');

		const artifacts = generateArtifacts(parsed.profile, baseSettings);
		const combined = `${artifacts.localConfig}\n${artifacts.remoteConfig}\n${artifacts.remoteSetup}`;

		expect(combined).toContain('example.edu');
		expect(combined).toContain('/shared/sockets');
		expect(combined).not.toContain('/store/');
	});
});
