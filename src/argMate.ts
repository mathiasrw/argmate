import type {
	ArgMateConfig,
	ArgMateInfoConfig,
	ArgMateResponse,
	ArgMateSettings,
	StrictConfig,
} from './types.js';

export {configPreprocessing, precompileConfig} from './compileConfig.js';

import {argInfo as info, argService} from './argService.js';

import argEngine from './argEngine.js';

export {argEngine};

/** #__PURE__ */ export function argInfo(options?: ArgMateInfoConfig) {
	return info(argEngine, options);
}

export default function argMate<const Config extends ArgMateConfig | undefined = undefined>(
	args: string[],
	parameterConfig?: Config & StrictConfig<Config>,
	engineSettings?: ArgMateSettings
): ArgMateResponse<Config> {
	try {
		return argService(
			argEngine,
			args,
			parameterConfig as Config,
			engineSettings
		) as ArgMateResponse<Config>;
	} catch (err) {
		if (err instanceof Error && Error.captureStackTrace) Error.captureStackTrace(err, argMate);
		throw err;
	}
}
