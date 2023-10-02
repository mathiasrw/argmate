let params = {
	help: {
		alias: ['h'],
		callback: () => {
			console.log(helpText());
		},
	},
	version: {
		alias: ['v'],
	},
};

let conf = {
	panic: (msg){ throw msg; },
	error: (msg){ throw msg },
	allowUnknowns: true
}

let args = [];

let unknown = [];

let result = {
	'_': []
};

const re = {
	kebab: /([a-z0-9]|(?=[A-Z]))([A-Z])/g,
	arrayType: /array|string\[\]|number\[\]|int\[\]|float\[\]/,
	paramTokens: /^(?<stop>--)$|^--(?<nofull>no-)?(?<full>.*?)(=(?<fullVal>.*))?$|^-(?<noshort>no-)?(?<short>[^-])(=(?<shortVal>.*))?$|^-(?<nomulti>no-)?(?<multi>[^-].+?)(=(?<multiVal>.*))?$/i,
};

/*
--full
--full=fullval
-s
-s=shortval
-multi
-multi=multitval
-no-noabc
-no-a
--no-noabc

*/
export default function argMate(args_, params_ = params, conf_ = conf) {
	args = args_ ?? [];
	params = params_;
	conf = conf_;
	result = [];

	Object.keys(params).forEach(key => {
		params[key].key = key
		params[key].alias = params[key].alias || [];
		params[key].conflict = params[key].conflict || [];
		params[key].type = params[key].type.toLowerCase() || 'boolean';

		if (undefined !== params[key].default) {
			result[key] = params[key].default;
		}

		if (params[key].type.match(arrayType)) {
			if (undefined === result[key]) result[key] = [];

			if (!Array.isArray(result[key])) result[key] = [result[key]];
		}

		if ('count' = params[key].type) {
			result[key] = 0;
		}

		let kebab = key.replace(re.kebab, '$1-$2').toLowerCase();
		if (kebab !== key) {
			params[key].alias.push(kebab);
		}

		params[key].alias?.forEach(alias => params[alias] = params[key])

		params[key].conflict?.forEach(alias => params[alias] = params[key])

	});


	let lastKey = '';
	while (args.length) {
		let val = args.shift();

		if (!val.startsWith('-')) {
			result['_'].push(val)
			continue;
		}
		let token = val.match(re.paramTokens)

		if (token.stop !== undefined) {
			result['_'].concat(args)
			args = []
			continue;
		}

		if (token.multi !== undefined) {
			if (token.multiVal !== undefined) args.unshift(token.multiVal)
			args = [].concat(token.multi.split('').map(v => (token.nomulti ? '-no-' : '-') + v), args)
			continue;
		}

		let key = token.short ?? token.full
		let keyVal = token.shortVal ?? token.fullVal
		let no = token.shortVal ?? token.fullVal

		if (key === undefined) return conf.panic(`Key undefined "${key}"`)

		if (keyVal !== undefined) {
			args.unshift(keyVal)
		}

		if (undefined === params[key]) {
			unknown.push(key);
			continue;
		}

		if ('boolean' === params[key].type) {
			result[params[key].key] = !no;
			continue;
		}

		if (no) return conf.panic(`Cant negate "${key}" as the type is "${params[key].type}"`)

		if ('count' === params[key].type) {
			result[params[key].key]++;
			continue;
		}

		val = args.shift();

		if (undefined === val) return conf.panic(`Expected one more parameter to fill the value of "${key}"`)

		switch (params[lastKey].type) {
			case 'string': result[params[lastKey].key] = val; break;
			case 'number': result[params[lastKey].key] = +val; break;
			case 'int': result[params[lastKey].key] = parseInt(val); break;
			case 'float': result[params[lastKey].key] = parseFloat(val); break;
			case 'array': case 'string[]': result[params[lastKey].key].push(val); break;
			case 'number[]': result[params[lastKey].key].push(+val); break;
			case 'int[]': result[params[lastKey].key].push(parseInt(val)); break;
			case 'float[]': result[params[lastKey].key].push(parseFloat(val)); break;
			default: return conf.panic(`Invalid type: "${params[lastKey].type}"`)
		}
	}



	if (unknown.length && !conf.allowUnknowns) return conf.error(JSON.stringify({ 'Invalid parameters': unknown }))


	// todo: check for conflict 


	return result;
}

export function helpText(input = params) {
	// todo: format details for cli
	return JSON.stringify(input);
}
