// A small example that `bun run dev` runs again after each change in src/ or test/, to see that argmate still works.
// It parses a typical command line with both engines and says if the result is the expected one.
import argMate, {argInfo} from '../../src/argMate.ts';
import argMateMini from '../../src/argMateMini.ts';

const config = {
	name: {type: 'string', describe: 'Your name'},
	port: {type: 'int', alias: 'p', default: 80, describe: 'The port'},
	verbose: {type: 'count', alias: 'v', describe: 'More output'},
	tag: {type: 'string[]', alias: 't', describe: 'A tag. Can repeat'},
	debug: {type: 'boolean', alias: 'd', describe: 'Debug mode'},
} as const;

const args = ['--name=foo', '-p8080', '-vv', '--tag', 'a', '-t', 'b', '-d', 'a.txt', 'b.txt'];
const expected = {
	_: ['a.txt', 'b.txt'],
	name: 'foo',
	port: 8080,
	verbose: 2,
	tag: ['a', 'b'],
	debug: true,
};

console.log(`\n${new Date().toLocaleTimeString()}  argmate ${args.join(' ')}\n`);

for (const [name, parse] of [
	['full', argMate],
	['mini', argMateMini],
] as const) {
	try {
		const result = parse(args, config);
		const same = JSON.stringify(result) === JSON.stringify({...result, ...expected});
		console.log(`${same ? 'OK       ' : 'DIFFERENT'} ${name}  ${JSON.stringify(result)}`);
	} catch (err) {
		console.log(`ERROR     ${name}  ${err instanceof Error ? err.message : err}`);
	}
}

argMate([], config);
console.log('\n' + argInfo());
