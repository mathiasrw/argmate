# Makes the variants that come from other files, thus the code that is not part of the test is the same in all of them.
#   param.ts  from this.ts: the state is an argument (`fn(s)`), not `this` (`fn.call(s)`)
#   tail.ts   from src/argEngine.ts: the phases after the loop are shared functions
#   hot.ts    from tail.ts: the number conversion in the loop is a shared function also
import re, sys, os
here = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(here, '..', '..', 'src', 'argEngine.ts')

def one(s, old, new):
    assert s.count(old) == 1, (old[:60], s.count(old))
    return s.replace(old, new)

# --- param.ts
s = open(os.path.join(here, 'this.ts')).read()
s, n = re.subn(r'function (\w+)\(this: any\)', r'function \1(s)', s); assert n == 19, n
s, n = re.subn(r'\b(\w+)\.call\(s\)', r'\1(s)', s); assert n == 19, n
s = re.sub(r'\bthis\.', 's.', s)
s = one(s, "// Variant `this`: each functionality of the full engine is a function of its own.\n// The functions share the state of the parse through `this`, thus they take no arguments.",
        "// Variant `param`: the same as `this.ts`, but each function gets the state of the parse as its one argument.\n// Made by make-variants.py from this.ts. Do not edit.")
assert 'this' not in s.replace('`this`', '').replace('this.ts', ''), 'this is left'
open(os.path.join(here, 'param.ts'), 'w').write(s)

# --- tail.ts
s = open(src).read()
a = s.index("\tfor (const [key, value] of Object.entries(complexDefault)) {")
b = s.index("\tif (outputAlias) {")
tail = """\tdefaults(output, parameterConfig, complexDefault);

	let exit = validatePhase(output, parameterConfig, validate, error);
	if (OK !== exit) return exit;
	exit = transformPhase(output, parameterConfig, transform, error, panic);
	if (OK !== exit) return exit;
	exit = mandatoryPhase(output, parameterConfig, mandatory, error);
	if (OK !== exit) return exit;
	exit = conflictPhase(parameterConfig, conflict, inputLog, error);
	if (OK !== exit) return exit;

"""
s = s[:a] + tail + s[b:]
s = one(s, "import {re} from './common.js';", """import {re} from '../../src/common.js';
import {
	OK,
	defaults,
	validate as validatePhase,
	transform as transformPhase,
	mandatory as mandatoryPhase,
	conflict as conflictPhase,
	toNumber,
} from './shared.js';""")
s = one(s, "import type {ArgMateConfig, ArgMateEngineConfig, ArgMateResponse} from './types.js';",
        "// Variant `tail`: the loop is the code of src/argEngine.ts. The phases after the loop are shared functions.\n// Made by make-variants.py from src/argEngine.ts. Do not edit.\n// @ts-nocheck\nimport type {ArgMateConfig, ArgMateEngineConfig, ArgMateResponse} from '../../src/types.js';")
open(os.path.join(here, 'tail.ts'), 'w').write(s.replace("\ttoNumber,\n", ""))

# --- hot.ts
a = s.index("\t\tlet data = 0;\n\n\t\tswitch (theType) {")
b = s.index("\t\tif (Number.isNaN(data) || !Number.isFinite(data))")
hot = """\t\tif ('string' === theType) {
			output[theKey] = VAL;
			continue;
		}

		if ('array' === theType || 'string[]' === theType) {
			(output[theKey] as unknown[]).push(VAL);
			continue;
		}

		const data = toNumber(theType, VAL);

		if (undefined === data)
			return panic(`Parameter '${KEY}' configuration has an invalid type: '${theType}'`);

"""
s = s[:a] + hot + s[b:]
s = one(s, "// Variant `tail`: the loop is the code of src/argEngine.ts. The phases after the loop are shared functions.",
        "// Variant `hot`: the same as `tail.ts`, and the number conversion in the loop is a shared function also.")
open(os.path.join(here, 'hot.ts'), 'w').write(s)
print('made param.ts, tail.ts, hot.ts')
