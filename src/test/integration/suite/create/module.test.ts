import { expect } from 'chai';
import { EditorView, VSBrowser } from 'vscode-extension-tester';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as tmp from 'tmp';
import { Project } from '../../util/project';
import { dismissNotifications } from '../../util/common';

describe('Module creation', function () {
	this.timeout(30000);

	let browser: VSBrowser;
	let creator: Project;
	let tempDirectory: tmp.DirResult;

	before(async function () {
		this.timeout(180000);
		browser = VSBrowser.instance;
		const editorView = new EditorView();
		await editorView.closeAllEditors();
		await browser.waitForWorkbench();
		tempDirectory = tmp.dirSync();
		await dismissNotifications();
		creator = new Project(browser);
		await creator.reset();
		await creator.waitForGetStarted();
	});

	afterEach(async function () {
		if (tempDirectory) {
			await fs.remove(tempDirectory.name);
		}
	});

	it('should be able to create a module project', async function () {
		this.timeout(90000);

		const name = 'vscode-e2e-test-module';

		await creator.createModule({
			id: 'com.axway.e2e',
			folder: tempDirectory.name,
			name,
			platforms: [ 'android', 'ios' ],
			codeBases: {
				android: 'kotlin',
				ios: 'swift'
			}
		});

		const projectPath = path.join(tempDirectory.name, name);
		expect(fs.existsSync(projectPath)).to.equal(true);
		expect(fs.existsSync(path.join(projectPath, 'android'))).to.equal(true);
		expect(fs.existsSync(path.join(projectPath, 'ios'))).to.equal(true);
	});

	it('should only enable selected platforms', async function () {
		this.timeout(90000);

		const name = 'vscode-e2e-test-module';

		await creator.createModule({
			id: 'com.axway.e2e',
			folder: tempDirectory.name,
			name,
			platforms: [ 'android' ],
			codeBases: {
				android: 'kotlin'
			}
		});

		const projectPath = path.join(tempDirectory.name, name);
		expect(fs.existsSync(projectPath)).to.equal(true);
		expect(fs.existsSync(path.join(projectPath, 'android'))).to.equal(true);
		expect(fs.existsSync(path.join(projectPath, 'ios'))).to.equal(false);
	});
});
