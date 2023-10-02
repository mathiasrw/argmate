#!/usr/bin/env node

import engine from './engine';
import formatParamInfo from './helpText';

let params: any = {};

let conf = {
	panic: msg => {
		throw msg;
	},
	error: msg => {
		throw msg;
	},
	allowUnknown: true,
	no: true,
};

export default function argMate(args, params_, conf_ = conf) {
	args = args || [];
	params = params_ || {};
	conf = {...conf, ...conf_};

	return engine(args, params, conf);
}

export function helpText(settings: any = {}) {
	debugger;
	return formatParamInfo(params, conf, {
		...{
			width: 100,
			format: 'cli',
			voidIntro: false,
			voidOutro: false,
		},
		...settings,
	});
}
