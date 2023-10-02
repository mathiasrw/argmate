export default function formatParamInfo(
	params,
	conf: any = {},
	settings = {
		width: 100,
		format: 'cli',
		voidIntro: false,
		voidOutro: false,
	}
) {
	debugger;

	let txt = '';
	if (!settings.voidIntro && conf.intro) {
		txt += conf.intro + '\n\n';
	}
	// todo: format details for markdown
	// todo: format details for cli

	txt += JSON.stringify({params}, null, 2);

	if (!settings.voidOutro && conf.outro) {
		txt += '\n\n' + conf.outro;
	}
	return txt;
}
