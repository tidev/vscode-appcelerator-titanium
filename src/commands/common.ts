import { MessageOptions, window } from 'vscode';

export interface InteractionChoice {
	title: string;
	run (): void;
}

export enum Commands {
	Build = 'titanium.build.run',
	CheckForUpdates = 'titanium.updates.checkAll',
	Clean = 'titanium.clean',
	ClearRecentBuilds = 'titanium.explorer.clearRecent',
	CreateApp = 'titanium.create.application',
	CreateKeystore = 'titanium.create.keystore',
	CreateModule = 'titanium.create.module',
	Debug = 'titanium.build.debug',
	DisableLiveView = 'titanium.build.setLiveViewDisabled',
	EnableLiveView = 'titanium.build.setLiveViewEnabled',
	ExtractStyle = 'titanium.extractToTss',
	FixEnvironmentIssues = 'titanium.environment.fixIssues',
	GenerateAlloyController = 'titanium.alloy.generate.controller',
	GenerateAlloyMigration = 'titanium.alloy.generate.migration',
	GenerateAlloyModel = 'titanium.alloy.generate.model',
	GenerateAlloyStyle = 'titanium.alloy.generate.style',
	GenerateAlloyView = 'titanium.alloy.generate.view',
	GenerateAlloyWidget = 'titanium.alloy.generate.widget',
	GenerateTask = 'titanium.task.generate',
	ImportSettings = 'titanium.import.settings',
	ImportKeystoreData = 'titanium.import.keystore',
	InstallAllUpdates = 'titanium.updates.installAll',
	InstallUpdate = 'titanium.updates.install',
	InsertCommandId = 'titanium.insertCodeAction',
	InsertI18nStringCommandId = 'titanium.insertI18nStringCodeAction',
	OpenAllRelatedFiles = 'titanium.alloy.open.allRelatedFiles',
	OpenRelatedController = 'titanium.alloy.open.relatedController',
	OpenRelatedStyle = 'titanium.alloy.open.relatedStyle',
	OpenRelatedView = 'titanium.alloy.open.relatedView',
	OpenReleaseNotes = 'titanium.updates.openReleaseNotes',
	OpenUrl = 'titanium.openUrl',
	Package = 'titanium.package.run',
	Rebuild = 'titanium.build.rebuild',
	RefreshExplorer = 'titanium.explorer.refresh',
	RefreshHelp = 'titanium.helpExplorer.refresh',
	SelectUpdates = 'titanium.updates.select',
	SetLogLevel = 'titanium.build.setLogLevel',
	ShowOutputChannel = 'titanium.showOutputChannel',
	StopBuild = 'titanium.build.stop',
	ShowUpdates = 'titanium.updates.reveal',
}

export class UserCancellation extends Error {
	constructor () {
		super('User cancelled');
	}
}

export class InteractionError extends Error {
	public messageOptions: MessageOptions = { modal: false };
	public interactionChoices: InteractionChoice[] = [];
}

export async function handleInteractionError (error: InteractionError): Promise<void> {
	const actionToTake = await window.showErrorMessage(error.message, error.messageOptions, ...error.interactionChoices);
	if (actionToTake) {
		actionToTake.run();
	}
}
