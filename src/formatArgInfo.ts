// The layout of the help: text broken at a width, and tables whose last column wraps

// A cell of a row. An array is split into columns, and a string in the same place of another row spans them.
export type Cell = string | string[];

// The lines of a text, broken at spaces so no line is longer than `width`. A word longer than `width` gets a line
// of its own, as breaking a word or a flag makes it wrong to copy.
export function wrap(text: string, width: number): string[] {
	const lines: string[] = [];
	for (const paragraph of text.split('\n')) {
		let line = '';
		for (const word of paragraph.split(' ')) {
			if (!line) line = word;
			else if (line.length + 1 + word.length <= width) line += ' ' + word;
			else {
				lines.push(line);
				line = word;
			}
		}
		lines.push(line);
	}
	return lines;
}

const longestWord = (text: string) => Math.max(...text.split(/\s+/).map(word => word.length));

// The lines of each row. The columns line up over all the rows, also when other lines are between them. Two spaces
// are between the columns of a split cell and three between cells. The last cell wraps in the width that is left.
// When that is less than `minColumnWidth`, or less than the longest word of the cell, the cell goes on the lines below
// its row, with an empty line before and after the row: a column of a word or two on each line is harder to read.
export function table(
	rows: Cell[][],
	width: number,
	minColumnWidth = 30,
	indent = '  '
): string[][] {
	if (!rows.length) return [];
	const last = Math.max(...rows.map(row => row.length)) - 1;

	const parts: number[] = [];
	for (const row of rows)
		row.forEach((cell, i) => {
			parts[i] = Math.max(parts[i] || 1, Array.isArray(cell) ? cell.length : 1);
		});

	const widths = parts.map(n => Array(n).fill(0));
	for (const row of rows)
		row.forEach((cell, i) => {
			if (Array.isArray(cell))
				cell.forEach((text, j) => {
					widths[i][j] = Math.max(widths[i][j], text.length);
				});
			else if (i !== last && 1 === parts[i]) widths[i][0] = Math.max(widths[i][0], cell.length);
		});

	// A column with no text takes no room, and neither does the space after it
	const span = (i: number) => {
		const used = widths[i].filter(n => n);
		return used.length ? used.reduce((a, b) => a + b) + 2 * (used.length - 1) : 0;
	};
	// A string that spans the columns of a cell widens the last of them when it is longer than all of them
	for (const row of rows)
		row.forEach((cell, i) => {
			if (i === last || Array.isArray(cell) || cell.length <= span(i)) return;
			// The last column with text, as `findLastIndex` is not in Node 16
			let j = widths[i].length - 1;
			while (0 < j && !widths[i][j]) j--;
			widths[i][j] += cell.length - span(i);
		});

	const fixed = (cell: Cell, i: number) =>
		Array.isArray(cell)
			? cell
					.filter((_, j) => widths[i][j])
					.map((text, j) => text.padEnd(widths[i].filter(n => n)[j]))
					.join('  ')
			: cell.padEnd(span(i));
	const shown = Array.from({length: last}, (_, i) => i).filter(i => span(i));

	let start = indent.length;
	for (const i of shown) start += span(i) + 3;
	const below = rows.map(
		row =>
			0 < shown.length &&
			'string' === typeof row[last] &&
			(width - start < minColumnWidth || width - start < longestWord(row[last] as string))
	);

	return rows.map((row, r) => {
		const cells = shown.filter(i => i < row.length).map(i => fixed(row[i], i));
		const before = indent + cells.join('   ') + (last < row.length && shown.length ? '   ' : '');
		const cell = row[last];
		if (undefined === cell) return [before.trimEnd()];
		if (Array.isArray(cell)) return [(before + fixed(cell, last)).trimEnd()];
		// The empty lines show where a row with its text below it starts and ends
		if (below[r])
			return [
				...(0 < r && !below[r - 1] ? [''] : []),
				before.trimEnd(),
				...wrap(cell, width - indent.length - 6).map(line => indent + '      ' + line),
				...(r < rows.length - 1 ? [''] : []),
			];
		const pad = ' '.repeat(start);
		return wrap(cell, width - start).map((line, n) => ((n ? pad : before) + line).trimEnd());
	});
}
