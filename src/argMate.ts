#!/usr/bin/env node

// @ts-ignore
//export {ArgMateParams, ArgMateConfig, ArgMateParamInfoConfig} from './types.d.ts';

// @ts-ignore
import {ArgMateParams, ArgMateConfig, ArgMateParamInfoConfig} from './types.d.ts';

import {engine} from './engine';

// @ts-ignore
import formatParamInfo from './paramInfo.ts';

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

export function paramInfo(
	settings: ArgMateParamInfoConfig = {},
	conf: ArgMateConfig = {},
	params?: ArgMateParams
) {
	return formatParamInfo(
		{
			...{
				preIntro: '',
				showIntro: true,
				showOutrp: true,
				postOutro: '',
				format: 'cli',
				width: 100,
			},
			...settings,
		},
		{...conf_, ...conf},
		params || JSON.parse(params_)
	);
}
