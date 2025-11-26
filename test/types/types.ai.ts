/**
 * Comprehensive test to verify all types are mutable (not readonly)
 *
 * If your IDE shows any errors in this file, the type system needs more work.
 * If there are no errors, the type system is working correctly.
 */

import argMate from '../../src/argMate';

// ============================================================================
// Test 1: result1 - Shorthand syntax should produce mutable types
// ============================================================================

const result1 = argMate(['--foo', '42'], {
	foo: 10,
	bar: false,
	name: 'test',
} as const);

// Type test: All fields have defaults, so all are required
type Test1Foo = typeof result1.foo; // Should be: number
type Test1Bar = typeof result1.bar; // Should be: boolean

// Runtime test: Properties should be assignable
const test1Assignment: {foo: number; bar: boolean; name: string; _: string[]} = result1;

// ============================================================================
// Test 2: result2 - Explicit type config should produce mutable types
// ============================================================================

const result2 = argMate(['--count', '5', '--verbose'], {
	count: {type: 'int'},
	verbose: {type: 'boolean'},
	output: {type: 'string'},
} as const);

// Type test
type Test2Count = typeof result2.count; // Should be: number | undefined
type Test2Verbose = typeof result2.verbose; // Should be: boolean | undefined

// Runtime test
const test2Assignment: {count?: number; verbose?: boolean; output?: string; _: string[]} = result2;

// ============================================================================
// Test 3: result3 - Mandatory fields should be required
// ============================================================================

const result3 = argMate(['--required', 'value'], {
	required: {type: 'string', mandatory: true},
	optional: {type: 'string'},
} as const);

// Type test: required should be string (NOT string | undefined)
type Test3Required = typeof result3.required; // Should be: string
type Test3Optional = typeof result3.optional; // Should be: string | undefined

// This should work (required is string, not optional)
const requiredValue: string = result3.required;

// ============================================================================
// Test 4: result4 - Defaults should produce mutable types
// ============================================================================

const result4 = argMate([], {
	port: {default: 8080},
	host: {default: 'localhost'},
	debug: {default: false},
} as const);

// Type test: All fields have defaults, so all are required
type Test4Port = typeof result4.port; // Should be: number
type Test4Host = typeof result4.host; // Should be: string

// Runtime test
const test4Assignment: {port: number; host: string; debug: boolean; _: string[]} = result4;

// ============================================================================
// Test 5: result5 - Mixed mandatory and optional
// ============================================================================

const result5 = argMate(['--userId', '123'], {
	userId: {type: 'int', mandatory: true},
	retries: {type: 'int', default: 3},
	timeout: {type: 'int'},
} as const);

// Type test: userId and retries are required (retries has default)
type Test5UserId = typeof result5.userId; // Should be: number
type Test5Retries = typeof result5.retries; // Should be: number

// These should work (userId is mandatory, retries has default)
const userIdValue: number = result5.userId;
const retriesValue: number = result5.retries;

// Runtime test
const test5Assignment: {userId: number; retries: number; timeout?: number; _: string[]} = result5;

// ============================================================================
// Test 6: result6 - Array types should be MUTABLE
// ============================================================================

const result6 = argMate(['--tags', 'a', '--tags', 'b'], {
	tags: {type: 'string[]'},
	scores: {type: 'number[]'},
} as const);

// Type test: Arrays should be string[] and number[], NOT readonly string[] or readonly number[]
type Test6Tags = typeof result6.tags; // Should be: string[] | undefined
type Test6Scores = typeof result6.scores; // Should be: number[] | undefined

// CRITICAL TEST: These operations should work (arrays are MUTABLE)
if (result6.tags) {
	result6.tags.push('new tag'); // ✅ Should work
	result6.tags[0] = 'modified'; // ✅ Should work
	result6.tags.splice(0, 1); // ✅ Should work
	result6.tags = ['completely', 'new']; // ✅ Should work
}

if (result6.scores) {
	result6.scores.push(100); // ✅ Should work
	result6.scores[0] = 999; // ✅ Should work
	result6.scores.splice(0, 1); // ✅ Should work
	result6.scores = [1, 2, 3]; // ✅ Should work
}

// Runtime test
const test6Assignment: {tags?: string[]; scores?: number[]; _: string[]} = result6;

// ============================================================================
// Test 6b: Array defaults with as const - CRITICAL TEST
// ============================================================================

const result6b = argMate([], {
	tags: ['default1', 'default2'],
	priorities: [1, 2, 3],
} as const);

// Type test: Arrays with defaults are required and mutable
type Test6bTags = typeof result6b.tags; // Should be: string[] (NOT readonly, NOT optional)
type Test6bPriorities = typeof result6b.priorities; // Should be: number[] (NOT readonly, NOT optional)

// CRITICAL TEST: These operations MUST work (arrays are MUTABLE and REQUIRED)
result6b.tags.push('new tag'); // ✅ MUST work
result6b.tags[0] = 'modified'; // ✅ MUST work
result6b.tags.splice(0, 1); // ✅ MUST work
result6b.tags = ['new', 'array']; // ✅ MUST work

result6b.priorities.push(4); // ✅ MUST work
result6b.priorities[0] = 99; // ✅ MUST work
result6b.priorities.splice(0, 1); // ✅ MUST work
result6b.priorities = [10, 20]; // ✅ MUST work

// Runtime test
const test6bAssignment: {tags: string[]; priorities: number[]; _: string[]} = result6b;

// ============================================================================
// Type assertion tests - these will fail at compile time if types are wrong
// ============================================================================

// Helper to check if a type is a mutable array (not a readonly array or tuple)
// This uses assignability in both directions to check for exact mutability
type IsMutableArray<T> = T extends any[] ? (any[] extends T ? true : false) : false;

// Alternative check: can we assign any[] to T?
// If T is readonly, this will be false
type CanPushToArray<T> = T extends any[]
	? T extends readonly any[]
		? readonly any[] extends T
			? false
			: true
		: true
	: false;

// Simpler check: just verify the types are exactly what we expect
type Check1 = NonNullable<typeof result6.tags> extends string[] ? true : false; // Should be: true
type Check2 = NonNullable<typeof result6.scores> extends number[] ? true : false; // Should be: true
type Check3 = NonNullable<typeof result6b.tags> extends string[] ? true : false; // Should be: true
type Check4 = NonNullable<typeof result6b.priorities> extends number[] ? true : false; // Should be: true

// Compile-time assertions (will fail if types are wrong)
const _check1: Check1 extends true ? true : never = true;
const _check2: Check2 extends true ? true : never = true;
const _check3: Check3 extends true ? true : never = true;
const _check4: Check4 extends true ? true : never = true;

console.log('✅ All type mutability checks passed!');
console.log('   - All properties are writable');
console.log('   - All arrays are mutable (not readonly)');
console.log('   - Mandatory fields are required');
console.log('   - Fields with defaults are required');
console.log('   - Fields without defaults (and not mandatory) are optional');
