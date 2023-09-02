const fs = require('fs-extra');
const path = require('path');
const primary = require('../package.nls.json');

const regexp = /package.nls.(\w+).json/;
const others = fs.readdirSync(path.join(__dirname, '..')).filter(item => regexp.test(item));
const missing = {};
const values = Object.entries(primary);

for (const file of others) {
	const [ , lang ] = regexp.exec(file);
	missing[lang] = {};
	const contents = fs.readJsonSync(path.join(__dirname, '..', file));

	for (const [ key, value ] of values) {
		if (!contents[key]) {
			missing[lang][key] = value;
		}
	}
}

console.log(JSON.stringify(missing, null, 2));
