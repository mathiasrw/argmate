#!/usr/bin/env node

import {ArgMateConfig, ArgMateSettings, InferArgMateResult} from './types.js';

export {compileConfig, precompileConfig} from './compileConfig.js';

export {argInfo} from './argService.js';

import {argService} from './argService.js';

import argEngine from './argEngine.js';

export {argEngine};

export default function argMate<const Config extends ArgMateConfig | undefined = undefined>(
	args: string[],
	config?: Config,
	settings?: ArgMateSettings
): InferArgMateResult<Config> {
	return argService(argEngine, args, config, settings) as InferArgMateResult<Config>;
}
