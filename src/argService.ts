import type {
	ArgMateConfig,
	ArgMateEngineConfig,
	ArgMateInfoConfig,
	ArgMateSettings,
	ArgMateResponse,
} from './types.js';

import {argInfoFormat, type Engine} from './helpText.js';

import {configPreprocessing} from './compileConfig.js';

let parameterConfig_: ArgMateConfig | undefined;

let engineSettings_: ArgMateSettings | undefined;

export function argService<const Config extends ArgMateConfig>(
	engine: (
		args: string[],
		argProcessObj?: ArgMateEngineConfig
	) => ArgMateResponse<Config> | undefined,
	args: string[],
	parameterConfig?: Config,
	engineSettings?: ArgMateSettings
): ArgMateResponse<Config> {
	if (!parameterConfig && !engineSettings) return engine(args) as ArgMateResponse<Config>;

	parameterConfig_ = parameterConfig || {};
	engineSettings_ = engineSettings || {};

	return engine(
		args,
		configPreprocessing(
			parameterConfig_,
			engineSettings_.argInfoOnError ? withInfo(engine, engineSettings_) : engineSettings_
		)
	) as ArgMateResponse<Config>;
}

// The help for the parameters of an input error goes below its message, so a program that shows the message
// shows the help too. An error with no parameter in the config, like a name that is not there, gets none.
function withInfo(engine: Engine, settings: ArgMateSettings): ArgMateSettings {
	const {error} = settings;
	return {
		...settings,
		error: e => {
			const names = [e.key, e.with].filter(Boolean).map(name => '--' + name);
			// An empty `include` means all the parameters
			const info = names.length
				? argInfo(engine, {include: names, showIntro: false, showOutro: false})
				: '';
			if (info) e.message += '\n\n' + ('' + info).trimEnd();
			if (error) return error(e);
			throw Object.assign(new Error(e.message), e);
		},
	};
}

// The help of the last parse when `options` has no `config`. A config that is given is the whole config: the
// parameters of the last parse are not in its help.
/** #__PURE__ */ export function argInfo(
	engine: Engine,
	options: ArgMateInfoConfig = {}
): ReturnType<typeof argInfoFormat> {
	return argInfoFormat(
		{
			...options,
			config: options.config ?? parameterConfig_ ?? {},
			settings: options.settings ?? engineSettings_ ?? {},
		},
		engine
	);
}
