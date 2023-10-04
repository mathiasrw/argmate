#!/usr/bin/env node

// @ts-ignore
//export {ArgMateParams, ArgMateConfig, ArgMateHelpTextConfig} from './types.d.ts';

// @ts-ignore
import {ArgMateParams, ArgMateConfig} from './types.d.ts';

import {engine} from './engine';

import formatParamInfo from './helpText';

let params;

let conf;

export default function argMate(
	args: string[],
	params_: ArgMateParams = {},
	conf_: ArgMateConfig = {}
) {
	params = params_;
	conf = conf_;

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
