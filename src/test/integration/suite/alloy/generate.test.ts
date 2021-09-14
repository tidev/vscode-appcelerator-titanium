import { AlloyGenerate } from '../../util/alloy-generate';
import { VSBrowser, WebDriver, EditorView, Workbench, InputBox } from 'vscode-extension-tester';
import { dismissNotifications } from '../../util/common';
import { expect } from 'chai';
import { copy, pathExistsSync, remove, readFileSync } from 'fs-extra';
import * as path from 'path';
import * as tmp from 'tmp';
import { getCommonAlloyProjectDirectory } from '../../../common/utils';

describe('Alloy component generation', function () {
	this.timeout(30000);

	const projectDirectory = getCommonAlloyProjectDirectory();
	let browser: VSBrowser;
	let driver: WebDriver;
	let generator: AlloyGenerate;
	let tempDirectory: tmp.DirResult;

	before(async function () {
		this.timeout(180000);
		browser = VSBrowser.instance;
		driver = browser.driver;
		const editorView = new EditorView();
		await editorView.closeAllEditors();
		await browser.waitForWorkbench();
		await dismissNotifications();
		generator = new AlloyGenerate(browser);
		tempDirectory = tmp.dirSync();
		await generator.reset();
		await copy(projectDirectory, tempDirectory.name);
		await generator.openFolder(tempDirectory.name);
		await driver.sleep(1000);
		await generator.waitForEnvironmentDetectionCompletion();
	});

	after(async function () {
		if (tempDirectory) {
			await remove(tempDirectory.name);
		}
	});

	// alloy generate controller creates all 3 files
	it('should be able to generate a controller and related files', async function () {
		await generator.generateComponent('controller', 'test1');

		for (const [ folder, fileType ] of Object.entries({ controllers: '.js', styles: '.tss', views: '.xml' })) {
			const file = path.join(tempDirectory.name, 'app', folder, `test1${fileType}`);
			expect(pathExistsSync(file)).to.equal(true, `${file} did not exist`);
		}
	});

	// alloy generate style only creates a style
	it('should be able to generate a style', async function () {
		await generator.generateComponent('style', 'test2');

		const file = path.join(tempDirectory.name, 'app', 'styles', 'test2.tss');
		expect(pathExistsSync(file)).to.equal(true, `${file} did not exist`);
	});

	// alloy generate view generates view and a style
	it('should be able to generate a view and related files', async function () {
		await generator.generateComponent('view', 'test3');

		for (const [ folder, fileType ] of Object.entries({ styles: '.tss', views: '.xml' })) {
			const file = path.join(tempDirectory.name, 'app', folder, `test3${fileType}`);
			expect(pathExistsSync(file)).to.equal(true, `${file} did not exist`);
		}
	});

	it('should prompt if already exists', async function () {
		const workbench = new Workbench();
		await workbench.executeCommand('Titanium: Generate Alloy controller');
		await generator.setName('existing-file', 'controller');

		const input = await InputBox.create();

		const placeHolderText = await input.getPlaceHolder();
		expect(placeHolderText).to.include('existing-file already exists. Overwrite it?', 'Did not prompt to force creation');

		await input.setText('No');
		await input.confirm();

		for (const [ folder, fileType ] of Object.entries({ controllers: '.js', styles: '.tss', views: '.xml' })) {
			const file = path.join(tempDirectory.name, 'app', folder, `existing-file${fileType}`);
			expect(pathExistsSync(file)).to.equal(true, `${file} did not exist`);
			expect(readFileSync(file, 'utf8')).to.contain('// this file already existed', `${file} did not match expected contents`);
		}
	});
});
