// Functions that the two engines can share. They get what they use as arguments.
// @ts-nocheck
import {re} from '../../src/common.js';

const hasProp = Object.prototype.hasOwnProperty;

// A phase gives OK, or it gives the value that `error` or `panic` returned. The engine returns that value.
export const OK = {};

export function defaults(output, parameterConfig, complexDefault) {
	for (const [key, value] of Object.entries(complexDefault)) {
		if (!hasProp.call(parameterConfig, key)) continue;
		if (undefined === output[key] || !output[key].length) {
			output[key] = value;
		}
	}
}

export function validate(output, parameterConfig, validate, error) {
	for (const key of validate) {
		if (undefined === output[key]) continue;

		const param = parameterConfig[key];
		let help = '';

		if ('function' === typeof param.validate) {
			if (param.validate(output[key])) continue;
		} else if (param.validate instanceof RegExp) {
			if (
				(Array.isArray(output[key]) ? output[key] : [output[key]]).every(
					v => -1 < String(v).search(param.validate)
				)
			)
				continue;
			help = '. The value must match ' + param.validate;
		} else {
			if (param.validate.includes(output[key])) continue;
			help = '. Please use one of the following values: ' + JSON.stringify(param.validate);
		}

		return error(
			`The value provided for the parameter '${key}' is not valid: '${output[key]}'` + help
		);
	}
	return OK;
}

export function transform(output, parameterConfig, transform, error, panic) {
	for (const key of transform) {
		if (undefined === output[key]) continue;
		const fn = parameterConfig[key].transform;
		if ('function' !== typeof fn) {
			return panic(`The "transform" property of '${key}' parameter must be a function`);
		}
		try {
			output[key] = fn(output[key]);
		} catch (e) {
			return error(
				`The transform for '${key}' threw: ${e instanceof Error ? e.message : String(e)}`
			);
		}
	}
	return OK;
}

export function mandatory(output, parameterConfig, mandatory, error) {
	for (const key of mandatory) {
		if (undefined === output[key])
			return error(
				`The parameter '${key}' is mandatory.${parameterConfig[key]?.alias?.length ? ` You can also use an alias: ${parameterConfig[key].alias.join(', ')}` : ''}`
			);
	}
	return OK;
}

export function conflict(parameterConfig, conflict, inputLog, error) {
	for (const conflictingKey of conflict) {
		if (!inputLog.includes(conflictingKey)) continue;
		const conflicting = parameterConfig[conflictingKey]?.conflict?.find(value =>
			inputLog.includes(value)
		);
		if (conflicting) {
			return error(`The parameter '${conflictingKey}' conflicts with '${conflicting}'`);
		}
	}
	return OK;
}

// The number for a value of a number type. `undefined`: the type is not a number type
export function toNumber(type, VAL) {
	switch (type) {
		case 'number':
		case 'float':
		case 'number[]':
		case 'float[]':
			return +VAL;

		case 'int':
		case 'int[]': {
			const data = +VAL | 0;
			return data + '' !== VAL && !re.isHexPrefix.test(VAL) ? Number.NaN : data;
		}

		case 'hex':
		case 'hex[]':
			return re.isHex.test(VAL) ? Number.parseInt(VAL, 16) : Number.NaN;
	}
}
