const fs = require('fs-extra');
const path = require('path');
const packageJson = require('../package.json');
const existing = require('../package.nls.json');

function handleStringEdit (str, obj, key) {
	if (!obj[key] || obj[key]?.startsWith('%')) {
		return;
	}
	existing[str] = obj[key];
	obj[key] = `%${str}%`;
}

const { contributes: { commands, configuration, debuggers, taskDefinitions, views, viewsWelcome } } = packageJson;

for (let i = 0; i < commands.length; i++) {
	const command = commands[i];
	const leading = 'titanium.commands';
	const suffix = command.command.replace('titanium.', '');
	const cmdString = `${leading}.${suffix}`;

	handleStringEdit(`${cmdString}.title`, command, 'title');
	handleStringEdit(`${cmdString}.description`, command, 'description');
}

for (const [ key, value ] of Object.entries(configuration.properties)) {
	const leading = 'titanium.config';
	const suffix = key.replace('titanium.', '');
	const configString = `${leading}.${suffix}`;

	handleStringEdit(configString, value, 'description');
}

for (const [ key, value ] of Object.entries(debuggers[0].configurationAttributes.launch.properties)) {
	handleStringEdit(`titanium.debug.${key}`, value, 'description');
}

for (let i = 0; i < taskDefinitions.length; i++) {
	const { type, properties: { titaniumBuild } } = taskDefinitions[i];
	const leading = `titanium.tasks.${type}`;

	handleStringEdit(`${leading}.titaniumBuild`, titaniumBuild, 'description');

	for (const [ key, value ] of Object.entries(titaniumBuild.properties)) {
		let str = `${leading}.${key}`;
		handleStringEdit(str, value, 'description');

		if (value.type === 'object' || value.properties) {
			for (const [ k, v ] of Object.entries(value.properties)) {
				str = `${str}.${k}`;
				handleStringEdit(str, v, 'description');
			}
		}
	}
}

for (const value of views.titanium) {
	handleStringEdit(value.id, value, 'name');
}

for (const value of viewsWelcome) {
	const when = value.when.split(':')[1];
	handleStringEdit(`${value.view}.${when}`, value, 'contents');
}

fs.writeJsonSync(path.join(__dirname, '..', 'package.json'), packageJson, { spaces: 2 });
fs.writeJsonSync(path.join(__dirname, '..', '../package.nls.json'), existing, { spaces: 2 });
