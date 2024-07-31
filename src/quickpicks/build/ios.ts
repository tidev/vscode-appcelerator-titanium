import { ExtensionContainer } from '../../container';
import { Target } from '../..//types/cli';
import { IosCert, IosCertificateType, IosProvisioningType, ProvisioningProfile } from '../../types/common';
import { quickPick, CustomQuickPick } from '../common';
import { deviceQuickPick, DeviceQuickPickItem } from './common';
import * as vscode from 'vscode';
export async function selectiOSCertificate (buildType: string): Promise<IosCert> {
	const certificateType: IosCertificateType = buildType === 'run' ? 'developer' : 'distribution';
	let organizationName = '';
	const certificates: any[] = [];
	const configs = vscode.workspace.getConfiguration('titanium.ios');
	const organizations = JSON.parse(configs.organizations);
	ExtensionContainer.environment.iOSCertificates(certificateType).forEach(cert => {
		let organization = cert.name.split('(')[1];
		organization = organization.split(')')[0];
		organizations.forEach((company: { id: string; name: string; }) => {
			if (company.id === organization) {
				organizationName = '-> ' + company.name;
			}
		});
		const certificate = {
			description: `Expires: ${new Date(cert.after).toLocaleString('en-US')}`,
			label: cert.name + organizationName,
			pem: cert.pem,
			id: cert.fullname
		};
		certificates.push(certificate);
	});
	const choice = await quickPick(certificates, { placeHolder: 'Select certificate' });

	const certificate = ExtensionContainer.environment.iOSCertificates(certificateType).find(cert => cert.pem === choice.pem);

	if (!certificate) {
		throw new Error(`Unable to resolve certificate ${choice.label}`);
	}

	return certificate;
}

export async function selectiOSProvisioningProfile (certificate: IosCert, target: Target, appId: string): Promise<ProvisioningProfile> {
	let deployment: IosProvisioningType = 'development';
	if (target === 'dist-adhoc') {
		deployment = 'distribution';
	} else if (target === 'dist-appstore' || target === 'dist-macappstore') {
		deployment = 'appstore';
	}
	const profiles = ExtensionContainer.environment.iOSProvisioningProfiles(deployment, certificate, appId);
	const choices = profiles.map(({ expirationDate, name, uuid }) => ({
		description: uuid,
		detail: `Expires: ${new Date(expirationDate).toLocaleString('en-US')}`,
		label: name,
		uuid,
		id: uuid
	}));
	const choice = await quickPick(choices, { placeHolder: 'Select provisioning profile' });

	const profile = profiles.find(p => p.uuid === choice.uuid);

	if (!profile) {
		throw new Error(`Unable to resolve provisioning profile ${choice.label}`);
	}

	return profile;
}

export function selectiOSDevice (): Promise<DeviceQuickPickItem> {
	const devices = ExtensionContainer.environment.iOSDevices().map(device => ({ id: device.udid, label: device.name, udid: device.udid }));
	return deviceQuickPick(devices, { placeHolder: 'Select device' });
}

export function selectiOSSimulatorVersion (): Promise<CustomQuickPick> {
	const versions = ExtensionContainer.environment.iOSSimulatorVersions().map(version => ({ id: version, label: version }));
	return quickPick(versions, { placeHolder: 'Select simulator version' });
}

export async function selectiOSSimulator (iOSVersion?: string): Promise<DeviceQuickPickItem> {
	if (!iOSVersion) {
		iOSVersion = (await selectiOSSimulatorVersion()).label;
	}
	if (!ExtensionContainer.environment.iOSSimulatorVersions().includes(iOSVersion)) {
		throw new Error(`iOS Version ${iOSVersion} does not exist`);
	}
	const simulators = ExtensionContainer.environment.iOSSimulators()[iOSVersion].map(({ name, udid }) => ({ label: `${name} (${iOSVersion})`, id: udid, udid, version: iOSVersion }));
	return deviceQuickPick(simulators, { placeHolder: 'Select simulator' });
}
