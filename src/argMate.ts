#!/usr/bin/env node

import type {ArgMateConfig, ArgMateResponse, ArgMateSettings} from './types.js';

export {configPreprocessing, precompileConfig} from './compileConfig.js';

export {argInfo} from './argService.js';

import {argService} from './argService.js';

import argEngine from './argEngine.js';

export {argEngine};

export default function argMate<const Config extends ArgMateConfig | undefined = undefined>(
	args: string[],
	config?: Config,
	settings?: ArgMateSettings
): ArgMateResponse<Config> {
	return argService(argEngine, args, config, settings) as ArgMateResponse<Config>;
}
