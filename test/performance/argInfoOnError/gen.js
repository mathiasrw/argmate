// Writes dist/precompiled.js and dist/precompiledHelp.js: the precompiled config as a program ships it, a module
// with the object as text. In precompiledHelp.js the `error` function has the help row of each parameter, as
// `precompileConfig` with `argInfoOnError` would write it: the rows of the full table, so two rows line up.
import {mkdirSync, writeFileSync} from 'node:fs';
import {argInfo, precompileConfig} from '../shared/dist/argMate.js';

process.chdir(import.meta.dirname);
const {config} = await import('./config.js');
const text = precompileConfig(config());
const lines = (
	'' + argInfo({config: config(), showIntro: false, showOutro: false, width: 100})
).split('\n');
const rows = {};
for (const key in config())
	rows[key] = lines.find(line => line.includes('--' + key + ' ') || line.endsWith('--' + key));
const error = `"error": (e)=>{const r=${JSON.stringify(rows)},t=[e.key,e.with].filter(k=>r[k]).map(k=>r[k]);if(t.length)e.message+='\\n\\nOptions:\\n'+t.join('\\n');throw Object.assign(Error(e.message),e)},\n    "panic"`;
const at = /"error": [\s\S]*?,\n\s*"panic"/;
if (!at.test(text)) throw new Error('No error function in the precompiled config');
mkdirSync('dist', {recursive: true});
writeFileSync('dist/precompiled.js', 'export default ' + text + ';\n');
writeFileSync('dist/precompiledHelp.js', 'export default ' + text.replace(at, error) + ';\n');
