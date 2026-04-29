import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

const aliasSchema = z
	.string()
	.trim()
	.min(1, 'Enter a host alias')
	.regex(
		/^[A-Za-z0-9][A-Za-z0-9._-]*$/,
		'Use letters, numbers, dots, underscores, or hyphens'
	);

const hostNameSchema = z.string().trim().min(1, 'Enter a hostname');

const portSchema = z.coerce
	.number()
	.int('Use a whole-number port')
	.min(1, 'Port must be at least 1')
	.max(65535, 'Port must be at most 65535');

export const remoteProfileSchema = z
	.object({
		profileVersion: z.literal(1),
		displayName: z.string().trim().min(1, 'Enter a profile name'),
		entryHosts: z
			.array(
				z.object({
					alias: aliasSchema,
					hostName: hostNameSchema,
					port: portSchema.default(22)
				})
			)
			.min(1, 'Add at least one login or proxy host'),
		proxyHostAlias: aliasSchema,
		defaultLoginAlias: aliasSchema,
		remoteHostPatterns: z
			.array(z.string().trim().min(1))
			.min(1, 'Add at least one remote host pattern'),
		socket: z.object({
			directory: z.string().trim().min(1, 'Enter a remote socket directory'),
			template: z
				.string()
				.trim()
				.min(1, 'Enter a remote socket filename template')
				.default(
					'ssh-{remoteUser}-{localUser}@{reverseHost}_{localSshPort}.sock'
				)
		}),
		remote: z.object({
			platform: z.literal('linux'),
			requires: z
				.array(z.string().trim().min(1))
				.default(['socat', 'openssh-client'])
		}),
		features: z
			.object({
				x11Forwarding: z.boolean().default(false),
				reverseSshViaUnixSocket: z.boolean().default(true)
			})
			.default({
				x11Forwarding: false,
				reverseSshViaUnixSocket: true
			})
	})
	.superRefine((profile, context) => {
		const aliases = new Set(profile.entryHosts.map((host) => host.alias));

		if (!aliases.has(profile.proxyHostAlias)) {
			context.addIssue({
				code: 'custom',
				path: ['proxyHostAlias'],
				message: 'proxyHostAlias must match one of the entryHosts aliases'
			});
		}

		if (!aliases.has(profile.defaultLoginAlias)) {
			context.addIssue({
				code: 'custom',
				path: ['defaultLoginAlias'],
				message: 'defaultLoginAlias must match one of the entryHosts aliases'
			});
		}
	});

export type RemoteProfile = z.infer<typeof remoteProfileSchema>;

export type ProfileParseResult =
	| { ok: true; profile: RemoteProfile }
	| { ok: false; errors: string[] };

export function parseRemoteProfileText(source: string): ProfileParseResult {
	if (source.trim().length === 0) {
		return { ok: false, errors: ['Paste or upload a remote profile'] };
	}

	try {
		const value = parseYaml(source);
		const parsed = remoteProfileSchema.safeParse(value);

		if (parsed.success) {
			return { ok: true, profile: parsed.data };
		}

		return {
			ok: false,
			errors: parsed.error.issues.map(formatIssue)
		};
	} catch (error) {
		return {
			ok: false,
			errors: [
				`Could not parse profile: ${error instanceof Error ? error.message : String(error)}`
			]
		};
	}
}

function formatIssue(issue: z.core.$ZodIssue): string {
	const path = issue.path.length > 0 ? issue.path.join('.') : 'profile';
	return `${path}: ${issue.message}`;
}
