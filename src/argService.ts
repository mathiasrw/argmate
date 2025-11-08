#!/usr/bin/env node

import type {
	ArgMateConfig,
	ArgMateEngineConfig,
	ArgMateInfoConfig,
	ArgMateSettings,
	ArgMateResponse,
} from './types.js';

import argInfoFormat from './argInfo.js';

import {configPreprocessing} from './compileConfig.js';

let config_: ArgMateConfig | undefined;

let settings_: ArgMateSettings | undefined;

export function argService<const Config extends ArgMateConfig>(
	engine: (
		args: string[],
		argProcessObj?: ArgMateEngineConfig
	) => ArgMateResponse<Config> | undefined,
	args: string[],
	config?: Config,
	settings?: ArgMateSettings
): ArgMateResponse<Config> {
	if (!config && !settings) return engine(args) as ArgMateResponse<Config>;

	config_ = config ? {...config} : {};
	settings_ = settings ? {...settings} : {};

	return engine(args, configPreprocessing(config || {}, settings || {})) as ArgMateResponse<Config>;
}

/** #__PURE__ */ export function argInfo(
	infoConfig: ArgMateInfoConfig = {},
	settings?: ArgMateSettings,
	config?: ArgMateConfig
) {
	return argInfoFormat(
		{
			preIntro: '',
			showIntro: true,
			showOutro: true,
			postOutro: '',
			format: 'cli',
			width: 100,
			...infoConfig,
		},
		{...(settings_ || {}), ...(settings || {})},
		{...(config_ || {}), ...(config || {})}
	);
}
