#!/usr/bin/env node

// @ts-ignore
import {ArgMateParams, ArgMateConfig, ArgMateArgInfoConfig} from './types.js';

// @ts-ignore
import formatArgInfo from './argInfo.js';

// @ts-ignore
import {compileConfig} from './compileConfig.js';

var params_;

var conf_;

export function argService(engine, args: string[], params?: ArgMateParams, conf?: ArgMateConfig) {
	if (!params && !conf) return engine(args);

	if (params) params_ = JSON.stringify(params);

	if (conf) conf_ = {...conf};

	return engine(args, compileConfig(params || {}, conf || {}));
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
