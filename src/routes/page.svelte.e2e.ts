import { expect, test } from '@playwright/test';

test('navigates admin and user SSH config workflows', async ({ page }) => {
	await page.goto('/');

	await expect(
		page.getByRole('heading', {
			name: 'Choose your SSH configuration workflow',
		})
	).toBeVisible();
	await expect(
		page.getByRole('link', { name: /Open admin wizard/ })
	).toBeVisible();
	await expect(
		page.getByRole('link', { name: /Open user wizard/ })
	).toBeVisible();

	await page.getByRole('link', { name: /Open admin wizard/ }).click();

	await expect(
		page.getByRole('heading', { name: 'Admin profile generator' })
	).toBeVisible();
	await expect(page.getByTestId('admin-profile-output')).toContainText(
		'profileVersion: 1'
	);
	await expect(
		page.getByRole('button', { name: 'Copy remote profile' })
	).toBeVisible();

	await page.getByRole('link', { name: 'User' }).click();

	await expect(
		page.getByRole('heading', { name: 'User configuration wizard' })
	).toBeVisible();
	await expect(page.getByTestId('local-root-config-output')).toContainText(
		'Include config.d/*.conf'
	);
	await page.getByText('Local profile').click();
	await expect(page.getByTestId('local-profile-config-output')).toContainText(
		'Host hpc-proxy'
	);
	await expect(page.getByTestId('local-profile-config-output')).toContainText(
		'RemoteForward /shared/sockets/ssh-%r-%u@laptop_22.sock localhost:22'
	);
	await expect(
		page.getByRole('button', { name: 'Copy local profile config' })
	).toBeVisible();
});
