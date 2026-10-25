import type {ArgMateConfig, ArgMateSettings} from './types.js';

export {configPreprocessing, precompileConfig} from './compileConfig.js';

export {argInfo} from './argService.js';

import {argService} from './argService.js';

import argEngineMini from './argEngineMini.js';

export {argEngineMini as argEngine};

export default function argMate(
	args: string[],
	parameterConfig?: ArgMateConfig,
	engineSettings?: ArgMateSettings
) {
	return argService(argEngineMini, args, parameterConfig, engineSettings);
}
