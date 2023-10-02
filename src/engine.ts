const re = {
	kebab: /([a-z0-9]|(?=[A-Z]))([A-Z])/g,
	arrayType: /array|string\[\]|number\[\]|int\[\]|float\[\]|hex\[\]/,
	paramTokens:
		/^(?<stop>--)$|^--(?<nofull>no-)?(?<full>.*?)(=(?<fullVal>.*))?$|^-(?<noshort>no-)?(?<short>[^-])(=(?<shortVal>.*))?$|^-(?<nomulti>no-)?(?<multi>[^-=][^=]+?)?$/i,
};

export default function engine(args, params, conf) {
	let unknown: string[] = [];
	let result: any = {
		_: [],
	};

	Object.keys(params).forEach(key => {
		// If only default value is provided, then make object with correct type
		if (params[key] === null || typeof params[key] !== 'object' || Array.isArray(params[key])) {
			params[key] = {
				default: params[key],
				type: findType(params[key]),
			};
		}

		params[key].key = key;
		params[key].alias = params[key].alias || [];
		params[key].conflict = params[key].conflict || [];
		params[key].type = params[key].type?.toLowerCase() || findType(params[key]) || 'boolean';

		if (undefined !== params[key].default) {
			result[key] = params[key].default;
		}

		if (params[key].type.match(re.arrayType)) {
			if (undefined === result[key]) result[key] = [];

			if (!Array.isArray(result[key])) result[key] = [result[key]];
		}

		if ('count' == params[key].type) {
			result[key] = 0;
		}

		let kebab = key.replace(re.kebab, '$1-$2').toLowerCase();
		if (kebab !== key) {
			params[key].alias.push(kebab);
		}

		params[key].alias?.forEach(alias => (params[alias] = params[key]));

		//params[key].conflict?.forEach(alias => (params[alias] = params[key]));
	});

	while (args.length) {
		let val: string = '' + args.shift();

		if (!val.startsWith('-')) {
			result['_'].push(val);
			continue;
		}
		let token = val.match(re.paramTokens)?.groups;

		if (undefined === token) return conf.panic('Grups not returned');

		if (undefined !== token.stop) {
			result['_'] = result['_'].concat(args);
			args = [];
			break;
		}

		if (undefined !== token.multi) {
			args = args = token.multi
				.split('')
				.map(v => (conf.no && token?.nomulti ? '-no-' : '-') + v)
				.concat(args);
			continue;
		}

		let key = token.short ?? token.full;
		let keyVal = token.shortVal ?? token.fullVal;
		let no = token.noshort ?? token.nofull;

		if (undefined === key) return conf.panic(`Key undefined "${key}"`);

		if (undefined === params[key]) {
			unknown.push(key);
			if (undefined !== keyVal) {
				// @ts-ignore
				result[key] = +keyVal == keyVal ? +keyVal : keyVal;
			} else {
				result[key] = !no;
			}
			continue;
		}

		if (undefined !== keyVal) {
			args.unshift(keyVal);
		}

		if ('boolean' === params[key].type) {
			result[params[key].key] = !no;
			continue;
		}

		if (no) return conf.error(`Can't negate "${key}" as the type is "${params[key].type}"`);

		if ('count' === params[key].type) {
			result[params[key].key]++;
			continue;
		}

		val = args.shift();

		if (undefined === val)
			return conf.error(`Expected one more parameter to fill the value of "${key}"`);
		let num = 0;
		switch (params[key].type) {
			case 'string':
				result[params[key].key] = val;
				break;
			case 'number':
			case 'float':
				num = +val;
				if (isNaN(num) || !isFinite(num))
					return conf.error(`The value of "${key}" is not a number: "${val}"`);
				result[params[key].key] = num;
				break;
			case 'int':
				num = +val | 0;

				if (isNaN(num) || !isFinite(num))
					return conf.error(`The value of "${key}" is not an integer: "${val}"`);
				result[params[key].key] = num;
				break;
			case 'hex':
				num = parseInt(val, 16);

				if (isNaN(num) || !isFinite(num))
					return conf.error(`The value of "${key}" is not a valid hex number: "${val}"`);
				result[params[key].key] = num;
				break;
			case 'array':
			case 'string[]':
				result[params[key].key].push(val);
				break;
			case 'number[]':
			case 'float[]':
				num = +val;
				if (isNaN(num) || !isFinite(num))
					return conf.error(`The value of "${key}" is not a number: "${val}"`);
				result[params[key].key].push(num);
				break;
			case 'int[]':
				num = +val | 0;
				if (isNaN(num) || !isFinite(num))
					return conf.error(`The value of "${key}" is not a number: "${val}"`);
				result[params[key].key].push(num);
				break;
			case 'hex[]':
				num = parseInt(val, 16);
				if (isNaN(num) || !isFinite(num))
					return conf.error(`The value of "${key}" is not a valid hex number: "${val}"`);
				result[params[key].key].push(num);

			default:
				return conf.panic(
					`The parameter "${key}" is configures with an invalid type: "${params[key].type}"`
				);
		}
	}

	if (unknown.length && !conf.allowUnknown)
		return conf.error(JSON.stringify({'Invalid parameters': unknown}));

	// todo: check for conflict

	// todo: check for mandatorymandatory: true;

	// todo: implement valid: a function that will check if the value is valid.

	return result;
}

function findType(val) {
	if (null === val || undefined === val) return void 0;

	let type = typeof val;
	let isArray = Array.isArray(val);

	if (isArray && val.length > 0) {
		type = typeof val;
	}

	switch (type) {
		case 'boolean':
		case 'number':
		case 'boolean':
			return type + (isArray ? '[]' : '');
		default:
			return 'string' + (isArray ? '[]' : '');
	}
}
