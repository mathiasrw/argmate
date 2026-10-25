// Checks that each variant gives the result of the engine as it is now, for the same input.
// It compares the result, or the message of the error, for each combination of input, config and settings.
import {configPreprocessing} from '../../src/compileConfig.ts';

const variants = ['this', 'param', 'tail', 'hot'];
const load = async (name: string) => (await import(`./dist/${name}.js`)).default;

const inputs = [
	[],
	['a', 'b'],
	['--'],
	['a', '--', '-b', '--c'],
	['--full'],
	['--full=-fullval'],
	['--no-full5=ful--lval-5'],
	['--full='],
	['--full=', 'next'],
	['-s'],
	['-s1234'],
	['--s1234=3423'],
	['-s=-sh--ortval'],
	['-s='],
	['-abc='],
	['-abc=5'],
	['-multi'],
	['-no-noabc'],
	['-no-n'],
	['-no-bca=66'],
	['--no-n-o--abc'],
	['-'],
	['---x'],
	['--foo-bar', '--fooBar=1', '--a.b.c=5'],
	[
		'--file',
		'a.txt',
		'--port=8080',
		'-vv',
		'-t',
		'x',
		'--tag',
		'y',
		'--name',
		' bob ',
		'--no-color',
	],
	['-f', 'a', '--port', '0x1F', '--ratio', '1e3', '--hex', 'ff', '--ints', '1', '--ints', '2'],
	['-f', 'a', '--port', 'abc'],
	['-f', 'a', '--port', '-5'],
	['-f', 'a', '--ratio', 'x'],
	['-f', 'a', '--hex', 'zz'],
	['-f', 'a', '--verbose=3', '-v'],
	['-f', 'a', '--verbose=x'],
	['-f', 'a', '--color=no', '--debug=yes'],
	['-f', 'a', '--color=maybe'],
	['-f', 'a', '--no-color=yes'],
	['-f', 'a', '--no-port'],
	['-f', 'a', '--level', 'high'],
	['-f', 'a', '--level', 'none'],
	['-f', 'a', '--email', 'a@b.dk', '--email', 'bad'],
	['-f', 'a', '--name', 'boom'],
	['-f', 'a', '--one', '--two'],
	['-f', 'a', '--unknown', '--other=5', '--bool=true', '--off=off'],
	['-f'],
	['--port', '5'],
	['-f', 'a', '-d', '-t', 'x', '-t', 'y', 'rest', '--', '--tail'],
	['-f', 'a', '--nums', '1.5', '--nums', '2', '--list', 'q'],
	['-f', 'a', '-p8080'],
	['-f', 'a', '-xp8080'],
];

const configs: (object | undefined)[] = [
	undefined,
	{},
	{
		file: {type: 'string', alias: 'f', mandatory: true},
		port: {type: 'int', alias: 'p', default: 80, validate: (v: number) => v > 0},
		verbose: {type: 'count', alias: 'v'},
		tag: {type: 'string[]', alias: 't'},
		name: {
			type: 'string',
			transform: (v: string) => {
				if ('boom' === v) throw new Error('bang');
				return v.trim();
			},
		},
		color: {type: 'boolean', default: true},
		ratio: {type: 'number'},
		debug: {type: 'boolean', alias: 'd'},
		hex: {type: 'hex'},
		ints: {type: 'int[]'},
		nums: {type: 'number[]', default: [7, 8]},
		list: ['a', 'b'],
		level: {validate: ['low', 'high']},
		email: {type: 'string[]', validate: /@/},
		one: {conflict: ['two']},
		two: {},
		fooBar: {type: 'int'},
	},
];

const settingsList = [
	{},
	{allowUnknown: false},
	{allowNegatingFlags: false},
	{allowKeyNumValues: false},
	{allowBoolString: false},
	{autoCamelKebabCase: false},
	{outputAlias: true},
	{outputInflate: true},
	{greedy: true},
	{strict: true},
	// An `error` and a `panic` that return: the engine must stop and return that value
	{error: (msg: string) => 'error: ' + msg, panic: (msg: string) => 'panic: ' + msg},
];

function result(engine: Function, args: string[], config: object | undefined, settings: object) {
	try {
		const engineConfig =
			undefined === config && 0 === Object.keys(settings).length
				? undefined
				: configPreprocessing(config || {}, settings);
		return JSON.stringify(engine(args, engineConfig));
	} catch (thrown) {
		// The message of a TypeError has the names of the variables, and the minifier gives each build other names
		if (thrown instanceof TypeError) return 'throws: TypeError';
		return 'throws: ' + (thrown instanceof Error ? thrown.message : String(thrown));
	}
}

const now = await load('now');
let cases = 0;
let differences = 0;
for (const variant of variants) {
	const engine = await load(variant);
	for (const config of configs) {
		for (const settings of settingsList) {
			for (const args of inputs) {
				cases++;
				const expected = result(now, args, config, settings);
				const actual = result(engine, args, config, settings);
				if (expected === actual) continue;
				differences++;
				console.log(`${variant}: ${JSON.stringify(args)} settings ${JSON.stringify(settings)}`);
				console.log(`  now:     ${expected}\n  variant: ${actual}`);
			}
		}
	}
}
console.log(`${cases} cases, ${differences} differences`);
if (differences) process.exit(1);
