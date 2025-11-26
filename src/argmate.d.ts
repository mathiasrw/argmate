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
	config?: Config,
	settings?: ArgMateSettings
): ArgMateResponse<Config>;

export function configPreprocessing(
	config: ArgMateConfig,
	settings: EngineSettings,
	precompile: boolean
): ArgMateEngineConfig | string;

export function argEngine<Config extends ArgMateConfig>(
	config: ArgMateEngineConfig & {config: Config}
): ArgMateResponse<Config>;

export function argInfoFormat(
	infoConfig: ArgMateInfoConfig,
	config: ArgMateConfig,
	settings: ArgMateSettings
): string;

export function argInfo(
	infoConfig: ArgMateInfoConfig,
	settings?: ArgMateSettings,
	config?: ArgMateConfig
): string;
