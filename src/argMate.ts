#!/usr/bin/env node

import {ArgMateConfig, ArgMateSettings} from './types.js';

export {compileConfig, precompileConfig} from './compileConfig.js';

export {argInfo} from './argService.js';

import {argService} from './argService.js';

import argEngine from './argEngine.js';

export {argEngine};

export default function argMate(
	args: string[],
	config?: ArgMateConfig,
	settings?: ArgMateSettings
) {
	return argService(argEngine, args, config, settings);
}
