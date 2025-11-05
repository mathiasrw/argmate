/**
 * Manual Type Inference Test File
 *
 * This file is used to manually verify that type inference is working correctly.
 * Open this file in your IDE and hover over variables to see their inferred types.
 *
 * You can also intentionally create type errors to verify the system catches them.
 */

import argMate from '../src/argMate';

// =============================================================================
// Example 1: Shorthand syntax - {foo: 10} = {foo: {default: 10}}
// =============================================================================

const result1 = argMate(['--foo', '42'], {
	foo: 10, // shorthand for {default: 10}
	bar: false,
	name: 'test',
} as const);

// Hover over result1 to see the inferred type:
// {foo: number, bar: boolean, name: string, _: string[]}

// These should work (all have defaults, so all are required):
const foo1: number = result1.foo;
const bar1: boolean = result1.bar;
const name1: string = result1.name;
const rest1: string[] = result1._; // _ is always present

// These should error (uncomment to test):
// const foo1Wrong: string = result1.foo;  // Type 'number | undefined' is not assignable to type 'string'
// const unknown1 = result1.doesNotExist;  // Property 'doesNotExist' does not exist

// =============================================================================
// Example 2: Explicit type configuration
// =============================================================================

const result2 = argMate(['--count', '5', '--verbose'], {
	count: {type: 'int'},
	verbose: {type: 'boolean'},
	output: {type: 'string'},
} as const);

// Hover over result2 to see the inferred type:
// {count?: number, verbose?: boolean, output?: string, _: string[]}

const count2: number | undefined = result2.count;
const verbose2: boolean | undefined = result2.verbose;

// =============================================================================
// Example 3: Mandatory fields (no default)
// =============================================================================

const result3 = argMate(['--required', 'value'], {
	required: {type: 'string', mandatory: true},
	optional: {type: 'string'},
} as const);

// Hover over result3 to see the inferred type:
// {required: string, optional?: string, _: string[]}

const required3: string = result3.required; // NOT optional!
const optional3: string | undefined = result3.optional; // IS optional

// =============================================================================
// Example 4: Fields with defaults (always present)
// =============================================================================

const result4 = argMate([], {
	port: {default: 8080},
	host: {default: 'localhost'},
	debug: {default: false},
} as const);

// Hover over result4 to see the inferred type:
// {port: number, host: string, debug: boolean, _: string[]}

// Fields with defaults are always present (required, not optional)
const port4: number = result4.port;
const host4: string = result4.host;
const debug4: boolean = result4.debug;

// =============================================================================
// Example 5: Mixed mandatory and optional with defaults
// =============================================================================

const result5 = argMate(['--userId', '123'], {
	userId: {type: 'int', mandatory: true},
	retries: {type: 'int', default: 3},
	timeout: {type: 'int'},
} as const);

// Hover over result5 to see the inferred type:
// {userId: number, retries: number, timeout?: number, _: string[]}

const userId5: number = result5.userId; // Required (mandatory: true)
const retries5: number = result5.retries; // Required (has default)
const timeout5: number | undefined = result5.timeout; // Optional (no default, not mandatory)

// =============================================================================
// Example 6: Array types
// =============================================================================

const result6 = argMate(['--tags', 'a', '--tags', 'b'], {
	tags: {type: 'string[]'},
	scores: {type: 'number[]'},
} as const);

// Hover over result6 to see the inferred type:
// {tags?: string[], scores?: number[], _: string[]}

const tags6: string[] | undefined = result6.tags;
const scores6: number[] | undefined = result6.scores;

// =============================================================================
// Example 6b: Array defaults with as const
// =============================================================================

const result6b = argMate([], {
	tags: ['default1', 'default2'],
	priorities: [1, 2, 3],
} as const);

// Hover over result6b to see the inferred type:
// {tags: string[], priorities: number[], _: string[]}

const tags6b: string[] = result6b.tags; // Required (has default)
const priorities6b: number[] = result6b.priorities; // Required (has default)

// These should be fully mutable despite as const:
result6b.tags.push('new tag'); // ✅ Works
result6b.tags[0] = 'modified'; // ✅ Works

// =============================================================================
// Example 7: No config (dynamic object)
// =============================================================================

const result7 = argMate(['--anything', '--goes']);

// Hover over result7 to see the inferred type:
// {[key: string]: any, _: string[]}

// This allows any property:
const anything7 = result7.anything;
const goes7 = result7.goes;
const whatever7 = result7.whatever;

// =============================================================================
// Example 8: Empty config
// =============================================================================

const result8 = argMate(['--test'], {} as const);

// Hover over result8 to see the inferred type:
// {_: string[]}

// Only the _ property exists in the type
// const test8 = result8.test;  // Error: Property 'test' does not exist

// =============================================================================
// Example 9: Complex real-world example
// =============================================================================

const realWorldConfig = {
	// Database
	dbHost: 'localhost',
	dbPort: 5432,
	dbName: {type: 'string', mandatory: true},

	// Server
	port: 3000,
	host: '0.0.0.0',

	// Features
	verbose: false,
	debug: false,
	logLevel: 'info',

	// Optional
	configFile: {type: 'string'},
	envFile: {type: 'string'},
} as const;

const realWorld = argMate(['--dbName', 'mydb', '--verbose'], realWorldConfig);

// Type should be:
// {
//   dbHost: string, dbPort: number, dbName: string,
//   port: number, host: string,
//   verbose: boolean, debug: boolean, logLevel: string,
//   configFile?: string, envFile?: string,
//   _: string[]
// }

const dbName9: string = realWorld.dbName; // Required (mandatory: true)
const port9: number = realWorld.port; // Required (has default)
const configFile9: string | undefined = realWorld.configFile; // Optional (no default, not mandatory)

// =============================================================================
// Type Error Examples (uncomment to verify errors)
// =============================================================================

/*
// Example 1: Wrong type
const wrongType = argMate(['--count', '5'], {count: 10} as const);
const wrong1: string = wrongType.count;  // Error: Type 'number | undefined' is not assignable to type 'string'

// Example 2: Unknown property
const strictConfig = argMate(['--foo', 'bar'], {foo: ''} as const);
const unknown = strictConfig.doesNotExist;  // Error: Property 'doesNotExist' does not exist

// Example 3: Mandatory field treated as optional
const mandatory = argMate(['--id', '1'], {id: {type: 'int', mandatory: true}} as const);
const maybeId: number | undefined = mandatory.id;  // This works but...
const definitelyId: number = mandatory.id;  // ...this is the correct type!
*/

console.log('✅ All type checks passed! Open this file in your IDE to see inferred types.');
