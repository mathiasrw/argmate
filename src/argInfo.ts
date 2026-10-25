import type {ArgMateConfig, ArgMateInfoConfig} from './types.js';
import {tableLayout, camelToKebab, toArray, formatIntroOutro} from './formatArgInfo.js';

export interface ArgMateHelpConfig {
	intro?: any;
	outro?: any;
}

export function argInfoFormat(
	infoConfig: ArgMateInfoConfig = {},
	helpConfig: ArgMateHelpConfig = {},
	parameterConfig: ArgMateConfig = {}
) {
	const s = {width: 100, format: 'cli', showIntro: true, showOutro: true, ...infoConfig};

	// JSON format
	if (s.format === 'json') {
		return {
			...(s.showIntro && helpConfig.intro ? {intro: helpConfig.intro} : {}),
			params: JSON.parse(JSON.stringify(parameterConfig)),
			...(s.showOutro && helpConfig.outro ? {outro: helpConfig.outro} : {}),
		};
	}

	// Build param rows (shared between CLI and markdown)
	const rows = Object.entries(parameterConfig)
		.filter(([, v]) => v && typeof v === 'object')
		.map(([key, val]: [string, any]) => {
			const names = [...toArray(val.alias), key]
				.map(camelToKebab)
				.sort((a, b) => a.length - b.length);
			const short = names.shift() || '';
			const long = names;
			const desc = val.description || val.describe || val.desc || '';
			const valid = val.validate || val.valid;
			const meta = valid?.length
				? `[${valid.join('|')}${val.default !== undefined ? `=${val.default}` : ''}]`
				: val.type || val.default !== undefined
					? `[${val.type || 'boolean'}${val.default !== undefined ? `=${val.default}` : ''}]`
					: '';
			return {short, long, desc, meta};
		});

	// CLI format
	if (s.format === 'cli') {
		let out = formatIntroOutro(s.preIntro);
		if (s.showIntro) out += formatIntroOutro(helpConfig.intro);

		const tableData = rows.map(r => [
			r.short,
			r.long.join(', '),
			r.desc + (r.meta ? ` ${r.meta}` : ''),
		]);
		if (tableData.length)
			out += tableLayout(tableData, {maxWidth: s.width, left: '  ', join: '   ', right: ''});

		if (s.showOutro) out += formatIntroOutro(helpConfig.outro);
		out += formatIntroOutro(s.postOutro);
		return out;
	}

	// Markdown format
	if (s.format === 'markdown') {
		let md = formatIntroOutro(s.showIntro ? helpConfig.intro : '');
		md += '## Options\n\n| Key  | Alias and effect |\n| ---- | ------ |\n';
		md +=
			rows
				.map(
					r =>
						`| \`${r.short}\` | ${r.long.map(n => `**\`${n}\`**`).join(' ')} ${r.desc}${r.meta ? ' ' + r.meta : ''} |`
				)
				.join('\n') + '\n';
		if (s.showOutro) md += formatIntroOutro(helpConfig.outro);
		return md;
	}

	return '';
}

export default argInfoFormat;
