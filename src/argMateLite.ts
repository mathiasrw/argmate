#!/usr/bin/env node

// @ts-ignore
//export {ArgMateParams, ArgMateConfig, ArgMateParamInfoConfig} from './types.d.ts';
// @ts-ignore
import {ArgMateParams, ArgMateConfig, ArgMateParamInfoConfig} from './types.js';

// @ts-ignore
import {configPrep} from './configPrep.js';

// @ts-ignore
import paramEngine from './paramEngineLite.js';

// @ts-ignore
import formatParamInfo from './formatParamInfo.js';

let params_ = {};

let conf_ = {};

export default function argMate(args: string[], params?: ArgMateParams, conf?: ArgMateConfig) {
	if (!params && !conf) return paramEngine(args);

	if (params) params_ = params;

	if (conf) conf_ = conf;

	return paramEngine(args, configPrep(params || {}, conf || {}));
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
		params || JSON.parse(JSON.stringify(params_))
	);
}
