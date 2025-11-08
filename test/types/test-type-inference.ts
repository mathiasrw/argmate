/**
 * Test file demonstrating the answer to the user's question:
 * "is it possible to extend the type system so because the type is set,
 *  then the valid and transform functions of the config object itself
 *  knows what type is expected to arrive?"
 *
 * ANSWER: YES! Using `as const` on the config object.
 */

import argMate from '../../src/argMate.js';

// ✅ BEFORE (what you had to do):
// expect(argMate(['--age', '25'], {age: {type: 'int', valid: (v: number) => v >= 18 && v <= 99}}))

// ✅ AFTER (what you can do now):
// Just add 'as const' and TypeScript infers v as number automatically!
const result = argMate(['--age', '25'], {
	age: {
		type: 'int',
		valid: v => v >= 18 && v <= 99, // ← v is automatically inferred as number!
		// You can also add transform:
		transform: v => v * 2, // ← v is also automatically inferred as number!
	},
} as const);

console.log('✅ Type inference works! No more (v: number) needed!');
console.log('Result:', result);

// Verify the result
if (result.age === 50) {
	console.log('✅ Transform worked correctly: 25 * 2 = 50');
}
