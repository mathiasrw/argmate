import type {
	ArgMateConfig,
	ArgMateEngineConfig,
	ArgMateInfoConfig,
	ArgMateResponse,
	ArgMateSettings,
	EngineSettings,
} from './types.js';

export default function argMate<const Config extends ArgMateConfig | undefined = undefined>(
	args: string[],
	parameterConfig?: Config,
	engineSettings?: ArgMateSettings
): ArgMateResponse<Config>;

export function configPreprocessing(
	parameterConfig: ArgMateConfig,
	engineSettings: EngineSettings,
	precompile: boolean
): ArgMateEngineConfig | string;

export function argEngine<Config extends ArgMateConfig>(
	parameterConfig: ArgMateEngineConfig & {parameterConfig: Config}
): ArgMateResponse<Config>;

export function argInfoFormat(
	infoConfig: ArgMateInfoConfig,
	parameterConfig: ArgMateConfig,
	engineSettings: ArgMateSettings
): string;

export function argInfo(
	infoConfig: ArgMateInfoConfig,
	engineSettings?: ArgMateSettings,
	parameterConfig?: ArgMateConfig
): string;
