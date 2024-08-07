#!/usr/bin/env node

// @ts-ignore
import {ArgMateParams, ArgMateConfig} from './types.js';

// @ts-ignore
export {compileConfig, precompileConfig} from './compileConfig.js';

// @ts-ignore
export {argInfo} from './argService.js';

// @ts-ignore
import {argService} from './argService.js';

// @ts-ignore
import argEngine from './argEngine.js';

export default function argMate(args: string[], params?: ArgMateParams, conf?: ArgMateConfig) {
	return argService(argEngine, args, params, conf);
}
