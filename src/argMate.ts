#!/usr/bin/env node

// @ts-ignore
//export {ArgMateParams, ArgMateConfig, ArgMateHelpTextConfig} from './types.d.ts';

// @ts-ignore
import {ArgMateParams, ArgMateConfig} from './types.d.ts';

import {engine} from './engine';

import formatParamInfo from './helpText';

let params_;

let conf_;

export default function argMate(
	args: string[],
	params: ArgMateParams = {},
	conf: ArgMateConfig = {}
) {
	params_ = JSON.stringify(params);
	conf_ = conf;

	return engine(args, params, conf);
}

export function helpText(settings: any = {}) {
	return formatParamInfo(JSON.parse(params_), conf_, {
		...{
			width: 100,
			format: 'cli',
			voidIntro: false,
			voidOutro: false,
		},
		...settings,
	});
}
