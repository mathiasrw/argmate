function breakLines(text: string, columnWidth: number): string[] {
	const regex = new RegExp(`([^\\s].{0,${columnWidth - 1}})(?:[\\s]|$)`, 'g');
	const lines = ('' + text).split('\n');
	return lines.flatMap(l => l.match(regex) || []);
}

function minimizeLineBreaks(data: string[][], maxWidth = 120): number[] {
	const numColumns = data[0].length;
	const columnWidths = Array(numColumns).fill(0);
	const columnMinWidths = Array(numColumns).fill(0);
	let longestWord = 0;

	// Step 1: Calculate the Initial Minimum Widths and Column Widths
	data.forEach(row => {
		row.forEach((cell, i) => {
			cell ||= '';
			const longestWordInCell = Math.max(...cell.split(' ').map(word => word.length));
			longestWord = Math.max(longestWord, longestWordInCell);
			columnMinWidths[i] = Math.max(columnMinWidths[i], longestWordInCell);
			columnWidths[i] = Math.max(columnWidths[i], cell.length, columnMinWidths[i]);
		});
	});

	// Throw an error if the longest word is greater than maxWidth
	if (longestWord > maxWidth) {
		throw new Error('Longest word exceeds maxWidth.');
	}

	// Calculate initial total width and overflow
	const totalWidth = columnWidths.reduce((a, b) => a + b, 0);
	let overflow = totalWidth - maxWidth;

	// Step 2: Adjust the column widths if there's an overflow
	while (overflow > 0) {
		for (let i = 0; i < numColumns && overflow > 0; i++) {
			if (columnWidths[i] > columnMinWidths[i]) {
				columnWidths[i]--;
				overflow--;
			}
		}
	}

	// Now, the sum of columnWidths should not exceed maxWidth and should respect columnMinWidths.
	return columnWidths;
}

function tupple(row: string[], widths: number[]): string[][] {
	const fields = row.map((v, i) => breakLines(v, widths[i]));

	let active = true;
	const lines: any[] = [];
	for (let i = 0; active; i++) {
		active = false;
		const line: string[] = [];
		fields.forEach((f, j) => {
			if (i < f.length) {
				active = true;
				line.push(f[i].padEnd(widths[j], ' '));
				return;
			}
			line.push(' '.padEnd(widths[j], ' '));
		});
		lines.push(line);
	}
	lines.pop();
	return lines;
}

export interface TableLayoutConfig {
	maxWidth?: number;
	left?: string;
	join?: string;
	right?: string;
}

export function tableLayout(data: string[][], conf_: TableLayoutConfig = {}): string {
	const conf = {
		maxWidth: 120,
		left: '  ',
		join: '   ',
		right: '  ',
		...conf_,
	};
	const numColumns = data[0]?.length || 1;
	const workingWidth =
		conf.maxWidth - conf.left.length - conf.join.length * (numColumns - 1) - conf.right.length;

	const optimizedWidths = minimizeLineBreaks(data, workingWidth);

	const table = data.map(t => tupple(t, optimizedWidths));

	let ascii = '';

	table.forEach(r => {
		r.forEach(f => {
			ascii += conf.left;
			ascii += f.join(conf.join);
			ascii += conf.right;
			ascii += '\n';
		});
		ascii += '\n\n';
	});

	return ascii;
}

export interface FormatArgInfoConfig {
	maxWidth?: number;
	left?: string;
	join?: string;
	right?: string;
}

export interface ParamDef {
	alias?: string | string[];
	default?: any;
	description?: string;
	describe?: string;
	desc?: string;
	type?: string;
}

/**
 * Formats argument definitions into a formatted CLI help table.
 * @param data - Object with param names as keys and ParamDef as values
 * @param settings_ - Table layout configuration
 */
export default function formatArgInfo(
	data: Record<string, ParamDef>,
	settings_: FormatArgInfoConfig = {}
): string {
	const settings = {
		maxWidth: 120,
		left: '    ',
		join: '    ',
		right: ' ',
		...settings_,
	};

	const tableData: string[][] = [];

	for (const key in data) {
		const val = data[key];
		const aliases = Array.isArray(val.alias) ? val.alias : val.alias ? [val.alias] : [];
		const allNames = [...aliases, key].sort((a, b) => b.length - a.length).map(camelToKebab);

		const shortFlag = allNames.pop() || '';
		const longFlags =
			allNames.join(', ') + (val.default !== undefined ? `\n[=${val.default}]` : '');
		const description =
			(val.description || val.describe || val.desc || '') + (val.type ? ` [${val.type}]` : '');

		tableData.push([shortFlag, longFlags, description]);
	}

	return tableLayout(tableData, settings);
}

export function camelToKebab(str: string): string {
	if (str.length === 1) return '-' + str;
	return '--' + str.replace(/([A-Z])/g, (_, c, i) => (i ? '-' : '') + c).toLowerCase();
}

export function toArray(val: any): any[] {
	if (Array.isArray(val)) return val;
	if (val) return [val];
	return [];
}

export function formatIntroOutro(content: any): string {
	if (!content) return '';
	if (typeof content === 'string') return content + '\n';

	return (
		content.map((item: any) => (Array.isArray(item) ? item.join('  ') : item)).join('\n') + '\n'
	);
}
