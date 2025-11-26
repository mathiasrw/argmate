# Type Inference for `valid` and `transform` Functions

## The Problem

Previously, when using `valid` and `transform` callback functions, you had to manually specify type annotations:

```typescript
argMate(['--age', '25'], {
  age: {
    type: 'int',
    valid: (v: number) => v >= 18 && v <= 99  // ❌ Had to specify v: number
  }
})
```

## The Solution

**YES!** The type system has been extended so that `valid` and `transform` functions automatically infer their parameter types based on the `type` field.

### Usage: Add `as const`

Simply add `as const` to your config object:

```typescript
argMate(['--age', '25'], {
  age: {
    type: 'int',
    valid: v => v >= 18 && v <= 99  // ✅ v is automatically inferred as number!
  }
} as const)
```

## How It Works

The type system now uses discriminated unions that map each type to its corresponding TypeScript type:

- `type: 'int' | 'number' | 'float' | 'hex'` → `v: number`
- `type: 'string' | 'array'` → `v: string | string[]`
- `type: 'boolean'` → `v: boolean`
- `type: 'number[]' | 'int[]' | 'float[]' | 'hex[]'` → `v: number[]`
- `type: 'string[]'` → `v: string[]`

When you use `as const`, TypeScript preserves the literal type `'int'` instead of widening it to `string`, which allows the discriminated union to match the correct branch and infer the proper type.

## Examples

### ✅ With explicit type field

```typescript
const result = argMate(['--age', '25'], {
  age: {
    type: 'int',
    valid: v => v >= 18 && v <= 99,        // v: number
    transform: v => v * 2                   // v: number
  }
} as const);
```

### ✅ With default value (type inferred from default)

```typescript
const result = argMate(['--port', '8080'], {
  port: {
    default: 3000,
    valid: v => v > 0 && v < 65536         // v: number (inferred from default)
  }
} as const);
```

### ✅ With array types

```typescript
const result = argMate(['--scores', '95', '87'], {
  scores: {
    type: 'number[]',
    valid: v => v.every(score => score >= 0),    // v: number[]
    transform: v => v.map(score => score * 1.1)  // v: number[]
  }
} as const);
```

### ✅ With string transforms

```typescript
const result = argMate(['--name', ' John '], {
  name: {
    type: 'string',
    transform: v => v.trim().toUpperCase()  // v: string | string[]
  }
} as const);
```

## Important Notes

1. **`as const` is required** for the type inference to work when passing the config inline
2. **Inline configs work best** - TypeScript automatically preserves literal types
3. **For extracted configs**, you may still need explicit type annotations:

```typescript
// For extracted configs, explicit types may be needed
const config = {
  age: {
    type: 'int',
    valid: (v: number) => v >= 18 && v <= 99  // Explicit type needed here
  }
} as const;

argMate(['--age', '30'], config);
```

## Migration

To migrate existing code:

**Before:**
```typescript
argMate(['--age', '25'], {age: {type: 'int', valid: (v: number) => v >= 18}})
```

**After:**
```typescript
argMate(['--age', '25'], {age: {type: 'int', valid: v => v >= 18}} as const)
```

Simply remove the type annotation and add `as const` to the config object!
