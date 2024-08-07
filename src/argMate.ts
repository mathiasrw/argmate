#!/usr/bin/env node

// @ts-ignore
import {ArgMateParams, ArgMateConfig, ArgMateArgInfoConfig} from './types.d.js';
// @ts-ignore
export {ArgMateParams, ArgMateConfig, ArgMateArgInfoConfig} from './types.d.js';

// @ts-ignore
export {compileConfig, precompileConfig} from './compileConfig.ts';

// @ts-ignore
export {argInfo} from './argService.ts';

// @ts-ignore
import {argService} from './argService.ts';

// @ts-ignore
import argEngine from './argEngine.ts';

export default function argMate(args: string[], params?: ArgMateParams, conf?: ArgMateConfig) {
	return argService(argEngine, args, params, conf);
}
