import Icon from '$lib/components/file-tree/file-icon/Icon.svelte';
import type {
	IconComponent,
	IIconFactory,
	ThemedIconID,
	ThemeMode
} from '$lib/components/file-tree/file-icon/icon-factory';

const ICONIFY_PREFIX: string = 'vscode-icons';

export type VSCodeFileIconName =
	| 'file'
	| 'folder'
	| 'folder-open'
	| 'java'
	| 'typescript'
	| 'typescript-react'
	| 'javascript'
	| 'javascript-react'
	| 'python'
	| 'go'
	| 'go-mod'
	| 'rust'
	| 'c'
	| 'cpp'
	| 'h'
	| 'kotlin'
	| 'scala'
	| 'html'
	| 'css'
	| 'markdown'
	| 'json'
	| 'yaml'
	| 'toml'
	| 'xml'
	| 'sql'
	| 'csv'
	| 'assembly'
	| 'makefile'
	| 'gradle'
	| 'npm'
	| 'eslint'
	| 'prettier'
	| 'git'
	| 'docker'
	| 'svelte'
	| 'vue'
	| 'angular'
	| 'react'
	| 'sass'
	| 'less'
	| 'tailwind'
	| 'graphql'
	| 'prisma'
	| 'env'
	| 'lock'
	| 'readme'
	| 'license'
	| 'image'
	| 'pdf'
	| 'zip'
	| 'audio'
	| 'video'
	| 'font'
	| 'binary'
	| 'shell'
	| 'powershell'
	| 'ruby'
	| 'php'
	| 'csharp'
	| 'swift'
	| 'dart'
	| 'lua'
	| 'perl'
	| 'haskell'
	| 'elixir'
	| 'clojure'
	| 'r'
	| 'julia'
	| 'matlab'
	| 'tex'
	| 'vite'
	| 'webpack'
	| 'rollup'
	| 'esbuild'
	| 'vitest'
	| 'jest'
	| 'cypress'
	| 'playwright'
	| 'storybook';

const VSCODE_ICON_MAP: Record<VSCodeFileIconName, { light: string; dark: string }> = {
	file: { light: 'default-file', dark: 'default-file' },
	folder: { light: 'default-folder', dark: 'default-folder' },
	'folder-open': { light: 'default-folder-opened', dark: 'default-folder-opened' },
	java: { light: 'file-type-java', dark: 'file-type-java' },
	typescript: { light: 'file-type-typescript', dark: 'file-type-typescript' },
	'typescript-react': { light: 'file-type-reactts', dark: 'file-type-reactts' },
	javascript: { light: 'file-type-js', dark: 'file-type-js' },
	'javascript-react': { light: 'file-type-reactjs', dark: 'file-type-reactjs' },
	python: { light: 'file-type-python', dark: 'file-type-python' },
	go: { light: 'file-type-go', dark: 'file-type-go' },
	'go-mod': { light: 'file-type-go-package', dark: 'file-type-go-package' },
	rust: { light: 'file-type-rust', dark: 'file-type-rust' },
	c: { light: 'file-type-c', dark: 'file-type-c' },
	cpp: { light: 'file-type-cpp', dark: 'file-type-cpp' },
	h: { light: 'file-type-cheader', dark: 'file-type-cheader' },
	kotlin: { light: 'file-type-kotlin', dark: 'file-type-kotlin' },
	scala: { light: 'file-type-scala', dark: 'file-type-scala' },
	html: { light: 'file-type-html', dark: 'file-type-html' },
	css: { light: 'file-type-css', dark: 'file-type-css' },
	markdown: { light: 'file-type-markdown', dark: 'file-type-markdown' },
	json: { light: 'file-type-json', dark: 'file-type-json' },
	yaml: { light: 'file-type-yaml', dark: 'file-type-yaml' },
	toml: { light: 'file-type-toml', dark: 'file-type-toml' },
	xml: { light: 'file-type-xml', dark: 'file-type-xml' },
	sql: { light: 'file-type-sql', dark: 'file-type-sql' },
	csv: { light: 'default-file', dark: 'default-file' },
	assembly: { light: 'file-type-assembly', dark: 'file-type-assembly' },
	makefile: { light: 'file-type-makefile', dark: 'file-type-makefile' },
	gradle: { light: 'file-type-gradle', dark: 'file-type-gradle' },
	npm: { light: 'file-type-npm', dark: 'file-type-npm' },
	eslint: { light: 'file-type-eslint', dark: 'file-type-eslint' },
	prettier: { light: 'file-type-prettier', dark: 'file-type-prettier' },
	git: { light: 'file-type-git', dark: 'file-type-git' },
	docker: { light: 'file-type-docker', dark: 'file-type-docker' },
	svelte: { light: 'file-type-svelte', dark: 'file-type-svelte' },
	vue: { light: 'file-type-vue', dark: 'file-type-vue' },
	angular: { light: 'file-type-angular', dark: 'file-type-angular' },
	react: { light: 'file-type-reactjs', dark: 'file-type-reactjs' },
	sass: { light: 'file-type-sass', dark: 'file-type-sass' },
	less: { light: 'file-type-less', dark: 'file-type-less' },
	tailwind: { light: 'file-type-tailwind', dark: 'file-type-tailwind' },
	graphql: { light: 'file-type-graphql', dark: 'file-type-graphql' },
	prisma: { light: 'file-type-prisma', dark: 'file-type-prisma' },
	env: { light: 'file-type-dotenv', dark: 'file-type-dotenv' },
	lock: { light: 'default-file', dark: 'default-file' },
	readme: { light: 'default-file', dark: 'default-file' },
	license: { light: 'file-type-license', dark: 'file-type-license' },
	image: { light: 'file-type-image', dark: 'file-type-image' },
	pdf: { light: 'file-type-pdf2', dark: 'file-type-pdf2' },
	zip: { light: 'file-type-zip', dark: 'file-type-zip' },
	audio: { light: 'file-type-audio', dark: 'file-type-audio' },
	video: { light: 'file-type-video', dark: 'file-type-video' },
	font: { light: 'file-type-font', dark: 'file-type-font' },
	binary: { light: 'file-type-binary', dark: 'file-type-binary' },
	shell: { light: 'file-type-shell', dark: 'file-type-shell' },
	powershell: { light: 'file-type-powershell', dark: 'file-type-powershell' },
	ruby: { light: 'file-type-ruby', dark: 'file-type-ruby' },
	php: { light: 'file-type-php', dark: 'file-type-php' },
	csharp: { light: 'file-type-csharp', dark: 'file-type-csharp' },
	swift: { light: 'file-type-swift', dark: 'file-type-swift' },
	dart: { light: 'file-type-dartlang', dark: 'file-type-dartlang' },
	lua: { light: 'file-type-lua', dark: 'file-type-lua' },
	perl: { light: 'file-type-perl', dark: 'file-type-perl' },
	haskell: { light: 'file-type-haskell', dark: 'file-type-haskell' },
	elixir: { light: 'file-type-elixir', dark: 'file-type-elixir' },
	clojure: { light: 'file-type-clojure', dark: 'file-type-clojure' },
	r: { light: 'file-type-r', dark: 'file-type-r' },
	julia: { light: 'file-type-julia', dark: 'file-type-julia' },
	matlab: { light: 'file-type-matlab', dark: 'file-type-matlab' },
	tex: { light: 'file-type-tex', dark: 'file-type-tex' },
	vite: { light: 'file-type-vite', dark: 'file-type-vite' },
	webpack: { light: 'file-type-webpack', dark: 'file-type-webpack' },
	rollup: { light: 'file-type-rollup', dark: 'file-type-rollup' },
	esbuild: { light: 'file-type-esbuild', dark: 'file-type-esbuild' },
	vitest: { light: 'file-type-vitest', dark: 'file-type-vitest' },
	jest: { light: 'file-type-jest', dark: 'file-type-jest' },
	cypress: { light: 'file-type-cypress', dark: 'file-type-cypress' },
	playwright: { light: 'file-type-playwright', dark: 'file-type-playwright' },
	storybook: { light: 'file-type-storybook', dark: 'file-type-storybook' }
};

const EXTENSION_TO_ICON: Record<string, VSCodeFileIconName> = {
	'.ts': 'typescript',
	'.mts': 'typescript',
	'.cts': 'typescript',
	'.tsx': 'typescript-react',
	'.js': 'javascript',
	'.mjs': 'javascript',
	'.cjs': 'javascript',
	'.jsx': 'javascript-react',
	'.java': 'java',
	'.kt': 'kotlin',
	'.kts': 'kotlin',
	'.py': 'python',
	'.pyw': 'python',
	'.pyi': 'python',
	'.rs': 'rust',
	'.go': 'go',
	'.c': 'c',
	'.cpp': 'cpp',
	'.cc': 'cpp',
	'.cxx': 'cpp',
	'.c++': 'cpp',
	'.h': 'h',
	'.hpp': 'h',
	'.hxx': 'h',
	'.hh': 'h',
	'.scala': 'scala',
	'.sc': 'scala',
	'.html': 'html',
	'.htm': 'html',
	'.xhtml': 'html',
	'.css': 'css',
	'.md': 'markdown',
	'.markdown': 'markdown',
	'.mdx': 'markdown',
	'.sql': 'sql',
	'.csv': 'csv',
	'.tsv': 'csv',
	'.asm': 'assembly',
	'.s': 'assembly',
	'.json': 'json',
	'.json5': 'json',
	'.jsonc': 'json',
	'.yaml': 'yaml',
	'.yml': 'yaml',
	'.toml': 'toml',
	'.xml': 'xml',
	'.svg': 'xml',
	'.svelte': 'svelte',
	'.vue': 'vue',
	'.scss': 'sass',
	'.sass': 'sass',
	'.less': 'less',
	'.graphql': 'graphql',
	'.gql': 'graphql',
	'.prisma': 'prisma',
	'.sh': 'shell',
	'.bash': 'shell',
	'.zsh': 'shell',
	'.fish': 'shell',
	'.ps1': 'powershell',
	'.psm1': 'powershell',
	'.rb': 'ruby',
	'.rake': 'ruby',
	'.gemspec': 'ruby',
	'.php': 'php',
	'.cs': 'csharp',
	'.swift': 'swift',
	'.dart': 'dart',
	'.lua': 'lua',
	'.pl': 'perl',
	'.pm': 'perl',
	'.hs': 'haskell',
	'.lhs': 'haskell',
	'.ex': 'elixir',
	'.exs': 'elixir',
	'.clj': 'clojure',
	'.cljs': 'clojure',
	'.cljc': 'clojure',
	'.r': 'r',
	'.R': 'r',
	'.jl': 'julia',
	'.m': 'matlab',
	'.mat': 'matlab',
	'.tex': 'tex',
	'.latex': 'tex',
	'.png': 'image',
	'.jpg': 'image',
	'.jpeg': 'image',
	'.gif': 'image',
	'.webp': 'image',
	'.ico': 'image',
	'.bmp': 'image',
	'.pdf': 'pdf',
	'.zip': 'zip',
	'.tar': 'zip',
	'.gz': 'zip',
	'.rar': 'zip',
	'.7z': 'zip',
	'.mp3': 'audio',
	'.wav': 'audio',
	'.flac': 'audio',
	'.ogg': 'audio',
	'.mp4': 'video',
	'.webm': 'video',
	'.mkv': 'video',
	'.avi': 'video',
	'.mov': 'video',
	'.ttf': 'font',
	'.otf': 'font',
	'.woff': 'font',
	'.woff2': 'font',
	'.eot': 'font',
	'.exe': 'binary',
	'.dll': 'binary',
	'.so': 'binary',
	'.dylib': 'binary',
	'.bin': 'binary',
	'.lock': 'lock'
};

const FILENAME_TO_ICON: Record<string, VSCodeFileIconName> = {
	'package.json': 'npm',
	'package-lock.json': 'npm',
	'.npmrc': 'npm',
	'yarn.lock': 'lock',
	'pnpm-lock.yaml': 'lock',
	makefile: 'makefile',
	gnumakefile: 'makefile',
	dockerfile: 'docker',
	'docker-compose.yml': 'docker',
	'docker-compose.yaml': 'docker',
	'.dockerignore': 'docker',
	'.prettierrc': 'prettier',
	'.prettierrc.json': 'prettier',
	'.prettierrc.yaml': 'prettier',
	'.prettierrc.yml': 'prettier',
	'.prettierrc.js': 'prettier',
	'.prettierrc.cjs': 'prettier',
	'.prettierrc.mjs': 'prettier',
	'prettier.config.js': 'prettier',
	'prettier.config.cjs': 'prettier',
	'prettier.config.mjs': 'prettier',
	'.eslintrc': 'eslint',
	'.eslintrc.json': 'eslint',
	'.eslintrc.js': 'eslint',
	'.eslintrc.cjs': 'eslint',
	'.eslintrc.yaml': 'eslint',
	'.eslintrc.yml': 'eslint',
	'eslint.config.js': 'eslint',
	'eslint.config.cjs': 'eslint',
	'eslint.config.mjs': 'eslint',
	'.gitignore': 'git',
	'.gitattributes': 'git',
	'.gitmodules': 'git',
	'.env': 'env',
	'.env.local': 'env',
	'.env.development': 'env',
	'.env.production': 'env',
	'.env.test': 'env',
	'.env.example': 'env',
	'go.mod': 'go-mod',
	'go.sum': 'go-mod',
	'go.work': 'go-mod',
	'build.gradle': 'gradle',
	'build.gradle.kts': 'gradle',
	'settings.gradle': 'gradle',
	'settings.gradle.kts': 'gradle',
	'gradle.properties': 'gradle',
	'vite.config.js': 'vite',
	'vite.config.ts': 'vite',
	'vite.config.mjs': 'vite',
	'vite.config.mts': 'vite',
	'webpack.config.js': 'webpack',
	'webpack.config.ts': 'webpack',
	'rollup.config.js': 'rollup',
	'rollup.config.ts': 'rollup',
	'rollup.config.mjs': 'rollup',
	'esbuild.config.js': 'esbuild',
	'esbuild.config.mjs': 'esbuild',
	'vitest.config.js': 'vitest',
	'vitest.config.ts': 'vitest',
	'vitest.config.mjs': 'vitest',
	'vitest.config.mts': 'vitest',
	'jest.config.js': 'jest',
	'jest.config.ts': 'jest',
	'jest.config.mjs': 'jest',
	'cypress.config.js': 'cypress',
	'cypress.config.ts': 'cypress',
	'playwright.config.js': 'playwright',
	'playwright.config.ts': 'playwright',
	'.storybook': 'storybook',
	'tailwind.config.js': 'tailwind',
	'tailwind.config.ts': 'tailwind',
	'tailwind.config.cjs': 'tailwind',
	'tailwind.config.mjs': 'tailwind',
	readme: 'readme',
	'readme.md': 'readme',
	'readme.txt': 'readme',
	license: 'license',
	'license.md': 'license',
	'license.txt': 'license',
	copying: 'license',
	'tsconfig.json': 'typescript',
	'jsconfig.json': 'javascript',
	'svelte.config.js': 'svelte',
	'svelte.config.ts': 'svelte'
};

const DEFAULT_ICON: VSCodeFileIconName = 'file';

function toIconifyID(iconName: string): string {
	return `${ICONIFY_PREFIX}:${iconName}`;
}

export interface IVSCodeFileIconFactory extends IIconFactory<VSCodeFileIconName> {
	readonly defaultIcon: VSCodeFileIconName;
	getDefaultIconID(theme: ThemeMode): string;
	getIconIDByFileName(fileName: string, theme: ThemeMode): string;
	getIconNameByFileName(fileName: string): VSCodeFileIconName;
	getFolderIconID(isOpen: boolean, theme: ThemeMode): string;
}

export class VSCodeFileIconFactory implements IVSCodeFileIconFactory {
	public readonly component: IconComponent = Icon;
	public readonly defaultIcon: VSCodeFileIconName = DEFAULT_ICON;

	getIconID(name: VSCodeFileIconName, theme: ThemeMode): string {
		const mapping: { light: string; dark: string } = VSCODE_ICON_MAP[name];
		const iconName: string = theme === 'dark' ? mapping.dark : mapping.light;
		return toIconifyID(iconName);
	}

	getDefaultIconID(theme: ThemeMode): string {
		return this.getIconID(this.defaultIcon, theme);
	}

	getIconIDByFileName(fileName: string, theme: ThemeMode): string {
		const iconName: VSCodeFileIconName = this.getIconNameByFileName(fileName);
		return this.getIconID(iconName, theme);
	}

	getIconNameByFileName(fileName: string): VSCodeFileIconName {
		const lowerFileName: string = fileName.toLowerCase();

		const filenameIcon: VSCodeFileIconName | undefined = FILENAME_TO_ICON[lowerFileName];
		if (filenameIcon !== undefined) {
			return filenameIcon;
		}

		const lastDotIndex: number = fileName.lastIndexOf('.');
		if (lastDotIndex !== -1) {
			const extension: string = fileName.slice(lastDotIndex).toLowerCase();
			const extensionIcon: VSCodeFileIconName | undefined = EXTENSION_TO_ICON[extension];
			if (extensionIcon !== undefined) {
				return extensionIcon;
			}
		}

		return this.defaultIcon;
	}

	getFolderIconID(isOpen: boolean, theme: ThemeMode): string {
		const iconName: VSCodeFileIconName = isOpen ? 'folder-open' : 'folder';
		return this.getIconID(iconName, theme);
	}

	getThemedIconID(name: VSCodeFileIconName): ThemedIconID {
		const lightID: string = this.getIconID(name, 'light');
		const darkID: string = this.getIconID(name, 'dark');
		return {
			light: lightID,
			dark: darkID
		};
	}

	getAllIconNames(): ReadonlyArray<VSCodeFileIconName> {
		return Object.keys(VSCODE_ICON_MAP) as VSCodeFileIconName[];
	}

	hasIcon(name: string): name is VSCodeFileIconName {
		return name in VSCODE_ICON_MAP;
	}
}

export function createVSCodeFileIconFactory(): IVSCodeFileIconFactory {
	return new VSCodeFileIconFactory();
}
