#!/usr/bin/env node

import {ArgMateConfig, ArgMateSettings, ArgMateArgInfoConfig, ArgProcessObj} from './types.js';

import formatArgInfo from './argInfo.js';

import {compileConfig} from './compileConfig.js';

var config_: ArgMateConfig | undefined;

var settings_: ArgMateSettings | undefined;

export function argService(
	engine: (args: string[], argProcessObj?: ArgProcessObj) => {[key: string]: any} | void,
	args: string[],
	config?: ArgMateConfig,
	settings?: ArgMateSettings
): {[key: string]: any} {
	if (!config && !settings) return engine(args) as {[key: string]: any};

	config_ = config ? {...config} : {};
	settings_ = settings ? {...settings} : {};

	return engine(args, compileConfig(config || {}, settings || {})) as {[key: string]: any};
}

/** #__PURE__ */ export function argInfo(
	infoConfig: ArgMateArgInfoConfig = {},
	settings?: ArgMateSettings,
	config?: ArgMateConfig
) {
	return formatArgInfo(
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
