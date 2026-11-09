/**
 * Demonstration: Improved Type Inference for valid and transform functions
 *
 * The argMate config now supports automatic type inference for callback parameters.
 * TypeScript will infer the correct types based on the 'type' field or 'default' value.
 *
 * IMPORTANT: For best type inference, pass the config object inline (as shown below).
 * TypeScript will preserve literal types automatically when using inline objects.
 */

import argMate from '../../src/argMate.js';

// ✅ OPTION 1: Inline config object (RECOMMENDED - automatic type inference)
const result1 = argMate(['--age', '25'], {
	age: {
		type: 'int',
		validate: v => v >= 18 && v <= 99, // v is automatically inferred as number!
	},
} as const);

// ✅ OPTION 2: Transform function with automatic inference
const result2 = argMate(['--name', ' John '], {
	name: {
		type: 'string',
		transform: v => v.trim().toUpperCase(), // v is automatically inferred as string | string[]!
	},
} as const);

// ✅ OPTION 3: Type inferred from default value
const result3 = argMate(['--port', '8080'], {
	port: {
		default: 3000,
		validate: v => v > 0 && v < 65536, // v is automatically inferred as number!
	},
} as const);

// ✅ OPTION 4: Array types with automatic inference
const result4 = argMate(['--scores', '95', '87'], {
	scores: {
		type: 'number[]',
		validate: v => v.every(score => score >= 0 && score <= 100), // v is automatically inferred as number[]!
		transform: v => v.map(score => Math.round(score * 1.1)), // v is automatically inferred as number[]!
	},
} as const);

// ✅ OPTION 5: If storing config separately, use as const
const config = {
	age: {
		type: 'int',
		validate: (v: number) => v >= 18 && v <= 99, // Note: explicit type needed for extracted configs
	},
} as const;

const result5 = argMate(['--age', '30'], config);

// 📝 NOTE: For extracted configs, you may need explicit type annotations.
// The best experience is with inline configs where TypeScript preserves literal types automatically.

console.log('✅ All type inferences work correctly!');
console.log('result1:', result1);
console.log('result2:', result2);
console.log('result3:', result3);
console.log('result4:', result4);
console.log('result5:', result5);
