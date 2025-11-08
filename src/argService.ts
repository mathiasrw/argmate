#!/usr/bin/env node

import type {
	ArgMateConfig,
	ArgMateEngineConfig,
	ArgMateInfoConfig,
	ArgMateSettings,
} from './types.js';

import argInfoFormat from './argInfo.js';

import {configPreprocessing} from './compileConfig.js';

var config_: ArgMateConfig | undefined;

var settings_: ArgMateSettings | undefined;

export function argService(
	engine: (args: string[], argProcessObj?: ArgMateEngineConfig) => {[key: string]: any} | void,
	args: string[],
	config?: ArgMateConfig,
	settings?: ArgMateSettings
): {[key: string]: any} {
	if (!config && !settings) return engine(args) as {[key: string]: any};

	config_ = config ? {...config} : {};
	settings_ = settings ? {...settings} : {};

	return engine(args, configPreprocessing(config || {}, settings || {})) as {[key: string]: any};
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
