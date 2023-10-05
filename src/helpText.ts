// @ts-ignore
import {ArgMateParams, ArgMateConfig, ArgMateHelpTextConfig} from './types.js';

export default function formatParamInfo(
	params: ArgMateParams,
	conf: ArgMateConfig = {},
	settings: ArgMateHelpTextConfig = {
		width: 100,
		format: 'cli',
		voidIntro: false,
		voidOutro: false,
	}
) {
	debugger;

	let info: any = {};
	if (!settings.voidIntro && conf.intro) {
		info.intro = conf.intro;
	}

	info.params = JSON.parse(JSON.stringify(params));

	if (!settings.voidOutro && conf.outro) {
		info.outro = conf.outro;
	}

	if ('json' === settings.format) return info;

	// todo: format details for cli
	if ('cli' === settings.format) return JSON.stringify(info, null, 2);

	// todo: format details for markdown
	if ('markdown' === settings.format) return 'md not supported yet';
}
