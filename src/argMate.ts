#!/usr/bin/env node

// @ts-ignore
//export {ArgMateParams, ArgMateConfig, ArgMateArgInfoConfig} from './types.d.ts';

// @ts-ignore
import {ArgMateParams, ArgMateConfig, ArgMateArgInfoConfig} from './types.js';

// @ts-ignore
import formatArgInfo from './argInfo.js';

// @ts-ignore
import {configPrep} from './configPrep.js';

// @ts-ignore
import argEngine from './argEngine.js';

export {argEngine, configPrep};

var params_;

var conf_;

export default function argMate(args: string[], params: ArgMateParams, conf: ArgMateConfig) {
	if (!params && !conf) return argEngine(args);

	if (params) params_ = JSON.stringify(params);

	if (conf) conf_ = {...conf};

	return argEngine(args, configPrep(params || {}, conf || {}));
}

export function argInfo(
	settings: ArgMateArgInfoConfig = {},
	conf: ArgMateConfig = {},
	params?: ArgMateParams
) {
	return formatArgInfo(
		{
			preIntro: '',
			showIntro: true,
			showOutro: true,
			postOutro: '',
			format: 'cli',
			width: 100,
			...settings,
		},
		{...conf_, ...conf},
		params || JSON.parse(params_)
	);
}
