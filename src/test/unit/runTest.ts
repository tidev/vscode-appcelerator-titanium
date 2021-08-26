import * as path from 'path';

import { getCommonFixturesDirectory } from '../common/utils';
import { runTests } from '@vscode/test-electron';

async function main (): Promise<void> {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');

		// The path to test runner
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname);

		// The folder we want to use as our test workspace
		const testWorkspace = path.join(getCommonFixturesDirectory(), 'alloy-project');

		// Download VS Code, unzip it and run the integration test
		await runTests({ extensionDevelopmentPath, extensionTestsPath, launchArgs: [ testWorkspace, '--disable-extensions' ] });
	} catch (err) {
		// tslint:disable-next-line:no-console
		console.error('Failed to run tests');
		process.exit(1);
	}
}

main();
