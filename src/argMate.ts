import type {ArgMateConfig, ArgMateResponse, ArgMateSettings, StrictConfig} from './types.js';

export {configPreprocessing, precompileConfig} from './compileConfig.js';

export {argInfo} from './argService.js';

import {argService} from './argService.js';

import argEngine from './argEngine.js';

export {argEngine};

export default function argMate<const Config extends ArgMateConfig | undefined = undefined>(
	args: string[],
	parameterConfig?: Config & StrictConfig<Config>,
	engineSettings?: ArgMateSettings
): ArgMateResponse<Config> {
	return argService(
		argEngine,
		args,
		parameterConfig as Config,
		engineSettings
	) as ArgMateResponse<Config>;
}
