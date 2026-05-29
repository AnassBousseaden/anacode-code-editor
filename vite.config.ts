import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		// The suites are pure file-system/graph logic — no DOM required.
		environment: 'node',
		include: ['src/**/*.{test,spec}.ts']
	}
});
