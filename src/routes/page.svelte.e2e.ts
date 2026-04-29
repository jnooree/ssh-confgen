import { expect, test } from '@playwright/test';

test('generates SSH config on the home page', async ({ page }) => {
	await page.goto('/');

	await expect(
		page.getByRole('heading', { name: 'SSH Config Generator' })
	).toBeVisible();
	await expect(page.getByTestId('local-config-output')).toContainText(
		'Host hpc-proxy'
	);
	await expect(page.getByTestId('local-config-output')).toContainText(
		'RemoteForward /shared/sockets/ssh-%r-%u@laptop_22.sock localhost:22'
	);
	await expect(
		page.getByRole('button', { name: 'Copy local SSH config' })
	).toBeVisible();
});
