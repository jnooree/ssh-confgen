import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from '../routes/+page.svelte';

describe('SSH config generator page', () => {
	it('renders generated config from the sample profile', async () => {
		render(Page);

		await expect
			.element(
				page.getByRole('heading', { level: 1, name: 'SSH Config Generator' })
			)
			.toBeInTheDocument();
		await expect
			.element(page.getByTestId('local-config-output'))
			.toHaveTextContent('Host hpc-proxy');
		await expect
			.element(page.getByTestId('local-config-output'))
			.toHaveTextContent(
				'RemoteForward /shared/sockets/ssh-%r-%u@laptop_22.sock localhost:22'
			);
		await expect
			.element(page.getByRole('button', { name: 'Copy local SSH config' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Download local SSH config' }))
			.toBeInTheDocument();
	});

	it('shows validation errors for an invalid profile', async () => {
		render(Page);

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
});
