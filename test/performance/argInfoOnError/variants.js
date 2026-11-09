// The variants that are timed. `gen.js` writes the precompiled configs to dist/ first.
import argMate, {argEngine, argInfo} from '../shared/dist/argMate.js';
import precompiled from './dist/precompiled.js';
import precompiledHelp from './dist/precompiledHelp.js';
import {args, config} from './config.js';

export const variants = {
	// The setting is off
	plain: () => argMate(args, config()),
	// The help is made only on an error, as argMate does it
	onError: () => argMate(args, config(), {argInfoOnError: true}),
	// The help made before each parse, as a config step that makes it up front would
	upFront: () => {
		argInfo({config: config(), showIntro: false, showOutro: false});
		return argMate(args, config());
	},
	// The engine with a precompiled config, as a program ships it
	precompiled: () => argEngine(args, precompiled),
	// The same, where the precompiled config also has the help rows
	precompiledHelp: () => argEngine(args, precompiledHelp),
};
