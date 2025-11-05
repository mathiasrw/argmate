// @ts-ignore
import {ArgMateConfig, ArgMateSettings, ArgMateArgInfoConfig} from './types.js';

/** #__PURE__ */ export default function formatArgInfo(
	infoConfig: ArgMateArgInfoConfig = {
		width: 100,
		format: 'cli',
		preIntro: '',
		showIntro: true,
		showOutro: true,
		postOutro: '',
	},
	settings: ArgMateSettings = {},
	config: ArgMateConfig
) {
	debugger;

	let info: any = {};
	if (infoConfig.showIntro && settings.intro) {
		info.intro = settings.intro;
	}

	info.config = JSON.parse(JSON.stringify(config));

	if (infoConfig.showOutro && settings.outro) {
		info.outro = settings.outro;
	}

	if ('json' === infoConfig.format) return info;

	// todo: format details for cli
	if ('cli' === infoConfig.format) return JSON.stringify(info, null, 2);

	// todo: format details for markdown
	if ('markdown' === infoConfig.format) return 'md not supported yet';
}
