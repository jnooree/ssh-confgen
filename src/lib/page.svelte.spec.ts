import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ThemeModeToggle from './components/ThemeModeToggle.svelte';
import AdminPage from '../routes/admin/+page.svelte';
import Page from '../routes/+page.svelte';
import UserPage from '../routes/user/+page.svelte';

describe('SSH config generator page', () => {
	it('renders the role chooser', async () => {
		render(Page);

		await expect
			.element(
				page.getByRole('heading', {
					level: 1,
					name: 'Choose your SSH configuration workflow',
				})
			)
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('link', { name: /Open admin wizard/ }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('link', { name: /Open user wizard/ }))
			.toBeInTheDocument();
	});

	it('renders generated user config from the sample profile', async () => {
		render(UserPage);

		await expect
			.element(
				page.getByRole('heading', {
					level: 1,
					name: 'User configuration wizard',
				})
			)
			.toBeInTheDocument();
		await expect
			.element(page.getByTestId('local-root-config-output'))
			.toHaveTextContent('Include config.d/*.conf');

		await page.getByText('Local profile').click();

		await expect
			.element(page.getByTestId('local-profile-config-output'))
			.toHaveTextContent('Host hpc-proxy');
		await expect
			.element(page.getByTestId('local-profile-config-output'))
			.toHaveTextContent(
				'RemoteForward /shared/sockets/ssh-%r-%u@laptop_22.sock localhost:22'
			);
		await expect
			.element(page.getByRole('button', { name: 'Copy local profile config' }))
			.toBeInTheDocument();
		await expect
			.element(
				page.getByRole('button', { name: 'Download local profile config' })
			)
			.toBeInTheDocument();
	});

	it('keeps profile contents in an advanced accordion', async () => {
		render(UserPage);

		await expect
			.element(page.getByLabelText('Profile contents'))
			.not.toBeInTheDocument();

		await page
			.getByRole('button', { name: 'Advanced: profile contents' })
			.click();

		await expect
			.element(page.getByLabelText('Profile contents'))
			.toBeInTheDocument();
	});

	it('shows validation errors for an invalid profile', async () => {
		render(UserPage);

		await page
			.getByRole('button', { name: 'Advanced: profile contents' })
			.click();
		await page.getByLabelText('Profile contents').fill('profileVersion: 2');

		await expect
			.element(page.getByLabelText('Profile errors'))
			.toHaveTextContent('profileVersion');
		await expect
			.element(
				page.getByText(
					'Generated output is waiting for valid profile and user inputs.'
				)
			)
			.toBeInTheDocument();
	});

	it('renders valid admin profile YAML from the sample profile', async () => {
		render(AdminPage);

		await expect
			.element(
				page.getByRole('heading', { level: 1, name: 'Admin profile generator' })
			)
			.toBeInTheDocument();
		await expect
			.element(page.getByTestId('admin-profile-output'))
			.toHaveTextContent('profileVersion: 1');
		await expect
			.element(page.getByTestId('admin-profile-output'))
			.toHaveTextContent('displayName: Example HPC Profile');
		await expect
			.element(page.getByRole('button', { name: 'Copy remote profile' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Download remote profile' }))
			.toBeInTheDocument();
	});

	it('toggles persisted dark mode', async () => {
		expect.assertions(2);
		localStorage.removeItem('ssh-confgen-theme-mode');
		document.documentElement.classList.remove('dark');

		render(ThemeModeToggle);
		await page.getByRole('button', { name: 'Dark theme' }).click();

		expect(document.documentElement.classList.contains('dark')).toBe(true);
		await expect
			.element(page.getByRole('button', { name: 'Dark theme' }))
			.toHaveAttribute('aria-pressed', 'true');
	});
});
