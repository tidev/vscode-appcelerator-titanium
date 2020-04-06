import { TaskDefinitionBase, TaskExecutionContext, AppBuildTaskDefinitionBase } from '../tasksHelper';
import { selectiOSDevice, selectiOSSimulator, selectiOSCodeSigning } from '../../quickpicks';
import { getCorrectCertificateName } from '../../utils';
import project from '../../project';
import { IosCertificateType } from '../../types/common';
import { TaskHelper } from './base';
import { CommandBuilder } from '../commandBuilder';

export interface IosAppBuildDefinition extends AppBuildTaskDefinitionBase {
	certificate?: string;
	provisioningProfile?: string;
	target?: 'device' | 'simulator';
	platform: 'ios';
}

export class IosHelper extends TaskHelper {

	public async resolveAppBuildCommandLine (context: TaskExecutionContext, definition: IosAppBuildDefinition): Promise<string> {
		const builder = CommandBuilder.create('appc', 'run');

		this.resolveCommonAppOptions(context, definition, builder);

		let deviceId: string|undefined = definition.deviceId;
		if (!deviceId) {
			if (definition.target === 'device') {
				const deviceInfo = await selectiOSDevice();
				deviceId = deviceInfo.udid;
			} else if (definition.target === 'simulator') {
				const simulatorInfo = await selectiOSSimulator();
				deviceId = simulatorInfo.udid;
			} else {
				throw new Error(`Invalid build target ${definition.target}`);
			}
		}

		builder.addOption('--target', definition.target as string);
		builder.addOption('--device-id', deviceId);

		if (definition.platform === 'ios' && definition.target === 'device') {
			const codeSigning = await selectiOSCodeSigning('run', definition.target, project.appId()!);
			definition.certificate =  getCorrectCertificateName(codeSigning.certificate.label, project.sdk()[0], IosCertificateType.developer);
			definition.provisioningProfile = codeSigning.provisioningProfile.uuid;

			builder.addQuotedOption('--developer-name', definition.certificate);
			builder.addOption('--pp-uuid', definition.provisioningProfile);
		}

		return builder.resolve();
	}

	public async resolveModuleBuildCommandLine (context: TaskExecutionContext, definition: TaskDefinitionBase): Promise<string> {
		const builder = CommandBuilder.create('appc', 'run');

		this.resolveCommonOptions(context, definition, builder);

		builder.addFlag('--build-only');

		return builder.resolve();
	}
}

export const iOSHelper = new IosHelper();
