#!/usr/bin/env node

import {ArgMateConfig, ArgMateSettings} from './types.js';

export {compileConfig, precompileConfig} from './compileConfig.js';

export {argInfo} from './argService.js';

import {argService} from './argService.js';

import argEngineMini from './argEngineMini.js';

export default function argMate(
	args: string[],
	config?: ArgMateConfig,
	settings?: ArgMateSettings
) {
	return argService(argEngineMini, args, config, settings);
}
