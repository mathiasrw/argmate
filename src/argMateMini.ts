import type {ArgMateConfig, ArgMateInfoConfig, ArgMateResponse, ArgMateSettings} from './types.js';

export {configPreprocessing, precompileConfig} from './compileConfig.js';

import {argInfo as info, argService} from './argService.js';

import argEngineMini from './argEngineMini.js';

export {argEngineMini as argEngine};

/** #__PURE__ */ export function argInfo(options?: ArgMateInfoConfig) {
	return info(argEngineMini, options);
}

export default function argMate(
	args: string[],
	parameterConfig?: ArgMateConfig,
	engineSettings?: ArgMateSettings
): ArgMateResponse<ArgMateConfig> {
	try {
		return argService(argEngineMini, args, parameterConfig, engineSettings);
	} catch (err) {
		if (err instanceof Error && Error.captureStackTrace) Error.captureStackTrace(err, argMate);
		throw err;
	}
}
