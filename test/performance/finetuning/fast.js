// 4G: is the result of a parse in dictionary mode? Node only.
//   node --allow-natives-syntax fast.js <bundle folder>
import path from 'node:path';
import {scenarios} from '../shared/scenarios.js';

const dir = process.argv[2];
const {default: argMate} = await import(path.join(dir, 'argMate.js'));
const fast = new Function('o', 'return %HasFastProperties(o)');
for (const [name, {args, config, precompiled}] of Object.entries(scenarios)) {
	if (precompiled) continue;
	const out = config ? argMate(args, config) : argMate(args);
	console.log(
		name.padEnd(8),
		'keys',
		String(Object.keys(out).length).padStart(3),
		'fast properties:',
		fast(out)
	);
}
