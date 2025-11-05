#!/usr/bin/env node

// @ts-ignore
import {ArgMateConfig, ArgMateSettings, ArgMateArgInfoConfig} from './types.js';

// @ts-ignore
import formatArgInfo from './argInfo.js';

// @ts-ignore
import {compileConfig} from './compileConfig.js';

var config_: ArgMateConfig | undefined;

var settings_: ArgMateSettings | undefined;

export function argService(
	engine,
	args: string[],
	config?: ArgMateConfig,
	settings?: ArgMateSettings
) {
	if (!config && !settings) return engine(args);

	config_ = config ? {...config} : {};
	settings_ = settings ? {...settings} : {};

	return engine(args, compileConfig(config || {}, settings || {}));
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
