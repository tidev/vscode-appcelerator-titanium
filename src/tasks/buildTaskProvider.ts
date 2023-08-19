import * as vscode from 'vscode';
import * as path from 'path';
import * as semver from 'semver';
import { CommandTaskProvider, TitaniumTaskBase, TitaniumTaskDefinitionBase, TitaniumBuildBase } from './commandTaskProvider';
import { selectBuildTarget } from '../quickpicks/build/common';
import { TaskExecutionContext, debugSessionInformation, DEBUG_SESSION_VALUE } from './tasksHelper';
import { Helpers } from './helpers/';
import { platforms } from '../utils';
import { TaskPseudoTerminal } from './taskPseudoTerminal';
import { Platform } from '../types/common';
import { Command } from './commandBuilder';
import { getValidWorkspaceFolders, promptForWorkspaceFolder } from '../quickpicks';
import { ExtensionContainer } from '../container';
import { DevelopmentTarget } from '../types/cli';

export interface BuildTask extends TitaniumTaskBase {
	definition: BuildTaskDefinitionBase;
}

export interface AppBuildTask extends BuildTask {
	definition: AppBuildTaskDefinitionBase;
}

export interface AppBuildTaskDefinitionBase extends TitaniumTaskDefinitionBase {
	titaniumBuild: AppBuildTaskTitaniumBuildBase;
}

export interface ModuleBuildTask extends BuildTask {
	definition: ModuleBuildTaskDefinitionBase;
}

export interface ModuleBuildTaskDefinitionBase extends TitaniumTaskDefinitionBase {
	titaniumBuild: ModuleBuildTaskTitaniumBuildBase;
}

export interface BuildTaskDefinitionBase extends TitaniumTaskDefinitionBase {
	titaniumBuild: AppBuildTaskTitaniumBuildBase | ModuleBuildTaskTitaniumBuildBase;
}

export interface BuildTaskTitaniumBuildBase extends TitaniumBuildBase {
	buildOnly?: boolean;
	projectType?: 'app' | 'module';
}

export interface AppBuildTaskTitaniumBuildBase extends BuildTaskTitaniumBuildBase {
	deviceId?: string;
	target?: DevelopmentTarget;
	projectType?: 'app';
	liveview?: boolean;
	deployType?: 'development' | 'test';
	debugPort?: number;
	debug?: boolean;
}

export interface ModuleBuildTaskTitaniumBuildBase extends BuildTaskTitaniumBuildBase {
	deviceId?: string;
	target?: DevelopmentTarget;
	projectType?: 'module';
}

function sdkSupportsModuleBuildTargets (): boolean {
	const sdk = ExtensionContainer.environment.selectedSdk();

	if (sdk && semver.gte(sdk.version, '12.1.0')) {
		return true;
	}

	return false;
}

export class BuildTaskProvider extends CommandTaskProvider {

	public constructor (helpers: Helpers) {
		super('titanium-build', helpers);
	}

	public override async provideTasks(): Promise<vscode.Task[]> {
		const tasks: vscode.Task[] = [];

		for (const platform of platforms()) {
			for (const { folder } of await getValidWorkspaceFolders()) {
				const name = `Debug ${platform}`;
				const definition: BuildTaskDefinitionBase = {
					type: 'titanium-build',
					titaniumBuild: {
						platform: platform as Platform,
						projectType: 'app',
						projectDir: folder.uri.fsPath,
						liveview: false
					},
					label: name,
					name,
					isBackground: true
				};

				tasks.push(this.createTask(
					name,
					vscode.TaskScope.Workspace,
					definition
				));
			}
		}
		return tasks;
	}

	public override async resolveTask (task: TitaniumTaskBase): Promise<vscode.Task> {
		// Run through create task
		return this.createTask(
			task.name,
			task.scope || vscode.TaskScope.Workspace,
			task.definition
		);
	}

	public async resolveTaskInformation (context: TaskExecutionContext, task: BuildTask): Promise<Command> {
		const { definition } = task;

		if (!definition.titaniumBuild.projectDir) {
			const folderDetectOptions = { apps: true, modules: true };

			if (definition.titaniumBuild.projectType === 'app') {
				folderDetectOptions.modules = false;
			} else if (definition.titaniumBuild.projectType === 'module') {
				folderDetectOptions.apps = false;
			}
			const { folder } = await promptForWorkspaceFolder(folderDetectOptions);
			definition.titaniumBuild.projectDir = folder.uri.fsPath;
		}

		const helper = this.getHelper(definition.titaniumBuild.platform);

		if (!definition.titaniumBuild.projectType) {
			definition.titaniumBuild.projectType = await helper.determineProjectType(definition.titaniumBuild.projectDir, definition.titaniumBuild.platform);
		}

		if (definition.titaniumBuild.projectType === 'app') {

			if (definition.titaniumBuild.debug) {
				const buildData = debugSessionInformation.get(DEBUG_SESSION_VALUE);
				if (buildData) {
					definition.titaniumBuild.target = buildData.targetId;
					definition.titaniumBuild.deviceId = buildData.deviceId;
				}
			}

			if (!definition.titaniumBuild.target) {
				definition.titaniumBuild.target = (await selectBuildTarget(definition.titaniumBuild.platform)).id as 'device' | 'emulator' | 'simulator';
			}

			return helper.resolveAppBuildCommandLine(context, task.definition.titaniumBuild);
		} else if (definition.titaniumBuild.projectType === 'module') {

			definition.titaniumBuild.projectDir = path.join(definition.titaniumBuild.projectDir, definition.titaniumBuild.platform);

			if (!definition.titaniumBuild.target && sdkSupportsModuleBuildTargets()) {
				definition.titaniumBuild.target = (await selectBuildTarget(definition.titaniumBuild.platform)).id as 'device' | 'emulator' | 'simulator';
			}
			return helper.resolveModuleBuildCommandLine(context, task.definition.titaniumBuild);
		} else {
			throw new Error(`Unknown project type ${definition.titaniumBuild.projectType}`);
		}

	}

	protected async executeTaskInternal (context: TaskExecutionContext, task: BuildTask): Promise<void> {
		const buildInfo = await this.resolveTaskInformation(context, task);

		await context.terminal.executeCommand(buildInfo, context.folder, context.cancellationToken);
	}

	private createTask(name: string, folder: vscode.WorkspaceFolder|vscode.TaskScope, definition: BuildTaskDefinitionBase): vscode.Task {

		if (definition.titaniumBuild.projectType === 'app' && name.toLowerCase().includes('debug')) {
			definition.titaniumBuild.liveview = false;
			definition.titaniumBuild.debug = true;
			definition.isBackground = true;
			definition.problemMatchers = '$ti-app-launch';
		}

		const task = new vscode.Task(definition, folder, name, 'Titanium');

		if (definition.titaniumBuild.projectType === 'app' && name.toLowerCase().includes('debug')) {
			// When we're using the task for debugging, we require "$ti-app-launch"
			// problem matcher to notify when the app has launched (and the task has completed),
			// that problem matcher only works if the task is a background task
			task.problemMatchers.push('$ti-app-launch');
			task.isBackground = true;
		}

		task.execution = new vscode.CustomExecution((resolvedDefinition) => Promise.resolve(new TaskPseudoTerminal(this, task as TitaniumTaskBase, resolvedDefinition as BuildTaskDefinitionBase)));

		return task;
	}
}
