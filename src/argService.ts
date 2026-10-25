import type {
	ArgMateConfig,
	ArgMateEngineConfig,
	ArgMateInfoConfig,
	ArgMateSettings,
	ArgMateResponse,
} from './types.js';

import {argInfoFormat, type ArgMateHelpConfig} from './argInfo.js';

import {configPreprocessing} from './compileConfig.js';

let parameterConfig_: ArgMateConfig | undefined;

let engineSettings_: ArgMateSettings | undefined;

export function argService<const Config extends ArgMateConfig>(
	engine: (
		args: string[],
		argProcessObj?: ArgMateEngineConfig
	) => ArgMateResponse<Config> | undefined,
	args: string[],
	parameterConfig?: Config,
	engineSettings?: ArgMateSettings
): ArgMateResponse<Config> {
	if (!parameterConfig && !engineSettings) return engine(args) as ArgMateResponse<Config>;

	parameterConfig_ = parameterConfig || {};
	engineSettings_ = engineSettings || {};

	return engine(
		args,
		configPreprocessing(parameterConfig || {}, engineSettings || {})
	) as ArgMateResponse<Config>;
}

/** #__PURE__ */ export function argInfo(
	infoConfig: ArgMateInfoConfig = {},
	parameterConfig?: ArgMateConfig,
	engineSettings?: ArgMateSettings
) {
	const _mergedEngineSettings = {...(engineSettings_ || {}), ...(engineSettings || {})};
	const mergedParameterConfig = {...(parameterConfig_ || {}), ...(parameterConfig || {})};

	// Extract help text (intro, outro) from parameterConfig, and keep the rest as parameter definitions
	const {intro, outro, ...paramConfig} = mergedParameterConfig;
	const helpConfig: ArgMateHelpConfig = {intro, outro};

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
		helpConfig,
		paramConfig
	);
}
