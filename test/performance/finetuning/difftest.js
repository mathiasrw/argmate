// A differential test: two builds of argmate get the same random config, settings and arguments, and must give the same result
// or the same error, key order included.
//   node difftest.js <bundle folder A> <bundle folder B> [argMate.js|argMateMini.js] [cases]
import {writeFileSync} from 'node:fs';
import path from 'node:path';

const [dirA, dirB, file = 'argMate.js', count = '300000'] = process.argv.slice(2);
const a = (await import(path.resolve(dirA, file))).default;
const b = (await import(path.resolve(dirB, file))).default;
const mini = file.includes('Mini');

let seed = 20261102;
const rand = n => {
	seed = (seed * 1103515245 + 12345) & 0x7fffffff;
	return seed % n;
};
const pick = list => list[rand(list.length)];
const chance = n => 0 === rand(n);

const names = [
	'a',
	'b',
	'c',
	'x',
	'verbose',
	'dry-run',
	'dryRun',
	'port',
	'name',
	'file',
	'q',
	'⚾',
	'n5',
];
const types = [
	undefined,
	undefined,
	'string',
	'int',
	'float',
	'number',
	'hex',
	'boolean',
	'bool',
	'count',
	'string[]',
	'int[]',
	'boolean[]',
	'array',
];

// A spec is plain data, so each engine gets a config of its own with functions that have not been shared
const spec = () => {
	const params = {};
	const used = new Set();
	for (let i = 0, n = 1 + rand(5); i < n; i++) {
		const name = pick(names);
		if (used.has(name)) continue;
		used.add(name);
		const p = {};
		const type = pick(types);
		if (type) p.type = type;
		if (chance(3)) p.alias = pick(['a', 'b', 'v', 'p', 'z', 'dry']);
		if (chance(4)) p.default = pick([1, 'x', true, 0, 'yes']);
		if (chance(5)) p.mandatory = true;
		if (chance(5)) p.validate = pick(['gt0', 'not3', 'list', 'regex']);
		if (chance(6)) p.transform = true;
		if (chance(7)) p.conflict = pick(names);
		if (chance(7)) p.demand = pick(names);
		if (!mini && chance(9)) p.spot = pick([1, 2, -1]);
		if (!mini && chance(9)) p[pick(['next', 'last'])] = pick([1, 2, -1]);
		params[name] = chance(8) ? pick([1, 'x', true, false, null, [1, 2]]) : p;
	}
	return params;
};
const build = s => {
	const config = {};
	for (const [name, p] of Object.entries(s)) {
		if (null === p || 'object' !== typeof p || Array.isArray(p)) {
			config[name] = p;
			continue;
		}
		const q = {...p};
		if (q.validate)
			q.validate = {gt0: v => v > 0, not3: v => 3 !== v, list: ['x', 'y', 1], regex: /^[a-z]+$/}[
				q.validate
			];
		if (q.transform) q.transform = v => (typeof v === 'string' ? v.trim() : v);
		config[name] = q;
	}
	return config;
};
const settingsList = [
	{},
	{},
	{},
	{allowUnknown: false},
	{strict: true},
	{allowNegatingFlags: false},
	{allowAssign: false},
	{allowAutoNumbers: false},
	{autoCamelKebabCase: false},
	{outputAlias: true},
	{outputInflate: true},
	{greedy: true},
	{allowKeyNumValues: false},
];

const flagNames = [...names, 'v', 'p', 'z', 'dry', 'zz', 'no', 'no-a', 'file2', 'dry-run-now'];
const values = [
	'5',
	'-5',
	'1.5',
	'0x1f',
	'ff',
	'yes',
	'no',
	'x',
	'y',
	' bob ',
	'',
	'8080',
	'007',
	'1e3',
	'-',
	'--',
	'=',
	'é',
	'😀',
	'true',
	'false',
	'3',
];
const token = () => {
	const name = pick(flagNames);
	switch (rand(14)) {
		case 0:
			return '-' + name;
		case 1:
		case 2:
			return '--' + name;
		case 3:
			return '--no-' + name;
		case 4:
			return '--' + name + '=' + pick(values);
		case 5:
			return '-' + name + '=' + pick(values);
		case 6:
			return (
				'-' +
				pick([
					'abc',
					'ab',
					'vv',
					'vvv',
					'a5',
					'a55',
					'q1',
					'xyz',
					'file',
					'dry-run',
					'5',
					'55',
					'5a5',
				])
			);
		case 7:
			return pick(['--', '-', '---x', '--=x', '-=x', '- ', '--no-', '--a-', '--a--b', '-a-b']);
		default:
			return pick(values);
	}
};

let different = 0;
let errors = 0;
const run = (parse, s, settings, args) => {
	try {
		const out = parse(args.slice(), build(s), {...settings});
		return 'OK ' + JSON.stringify(out) + ' ' + Object.keys(out).join();
	} catch (e) {
		errors++;
		return (
			'ERR ' +
			e?.code +
			' ' +
			e?.message +
			' ' +
			JSON.stringify(
				e && {key: e.key, alias: e.alias, value: e.value, with: e.with, withAlias: e.withAlias}
			)
		);
	}
};
const total = +count;
for (let i = 0; i < total; i++) {
	const s = spec();
	// The mini engine does not obey allowAssign (item 27 of todo-mini.md) and never returns for `-5a5` with it off
	const settings = pick(mini ? settingsList.filter(x => !('allowAssign' in x)) : settingsList);
	const args = [];
	for (let j = 0, n = rand(9); j < n; j++) args.push(token());
	// The last case is kept in a file, so an input that never returns can be found
	if (process.env.LAST_CASE)
		writeFileSync(process.env.LAST_CASE, JSON.stringify({i, s, settings, args}));
	const ra = run(a, s, settings, args);
	if (process.env.LAST_CASE) writeFileSync(`${process.env.LAST_CASE}.a`, String(i));
	const rb = run(b, s, settings, args);
	if (ra !== rb && different++ < 8)
		console.log(
			'DIFFERENT\n  config',
			JSON.stringify(s),
			'\n  settings',
			JSON.stringify(settings),
			'\n  args',
			JSON.stringify(args),
			'\n  A:',
			ra,
			'\n  B:',
			rb
		);
}
console.log(`${file}: ${total} cases, ${errors / 2} gave an error, ${different} different`);
