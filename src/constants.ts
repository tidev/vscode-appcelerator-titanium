export const ExtensionName = 'titanium';
export const ExtensionId = 'tidev.titanium-sdk';

export enum VSCodeCommands {
	OpenFolder = 'vscode.openFolder',
	ReportIssue = 'vscode.openIssueReporter',
	SetContext = 'setContext',
	OpenSettings = 'workbench.action.openSettings'
}

export enum GlobalState {
	Enabled = 'titanium:enabled',
	Liveview = 'titanium:liveview',
	Running = 'titanium:build:running',
	LastUpdateCheck = 'titanium:update:lastCheck',
	HasUpdates = 'titanium:update:hasUpdates',
	RefreshEnvironment = 'titanium:environment:refresh',
	MissingTooling = 'titanium:toolingMissing',
	NotTitaniumProject = 'titanium:notProject',
	NeedsTrustedWorkspace = 'titanium:needsTrustedWorkspace',
	EnvironmentIssues = 'titanium:environmentIssues'
}

export enum WorkspaceState {
	LastBuildState = 'lastRunOptions',
	LastPackageState = 'lastDistOptions',
	LastKeystorePath = 'lastKeystorePath',
	LastCreationPath = 'lastCreationPath',
	LastAndroidDebug = 'lastAndroidDebugOptions',
	LastiOSDebug = 'lastiOSDebugOptions',
	RecentBuilds = 'recentBuilds'
}
