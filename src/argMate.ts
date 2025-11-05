#!/usr/bin/env node

// @ts-ignore
import {ArgMateConfig, ArgMateSettings} from './types.js';

// @ts-ignore
export {compileConfig, precompileConfig} from './compileConfig.js';

// @ts-ignore
export {argInfo} from './argService.js';

// @ts-ignore
import {argService} from './argService.js';

// @ts-ignore
import argEngine from './argEngine.js';

export {argEngine};

export default function argMate(
	args: string[],
	config?: ArgMateConfig,
	settings?: ArgMateSettings
) {
	return argService(argEngine, args, config, settings);
}
