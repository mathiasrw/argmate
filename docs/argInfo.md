# ArgInfo Documentation

## Overview

The `argInfo` system provides comprehensive help text generation for CLI tools built with ArgMate. It supports multiple output formats (CLI, JSON, Markdown) and handles parameter definitions, descriptions, and formatting automatically.

## Function Call Flow

```
argInfo() [argService.ts]
    ↓
argInfoFormat() [argInfo.ts]
    ↓
formatArgInfo() + tableLayout() [formatArgInfo.ts]
```

## API Functions

### 1. `argInfo(infoConfig?, config?, settings?)`

**Main entry point** - exported from `argService.ts`

**Parameters:**
- `infoConfig?: ArgMateInfoConfig` - Display formatting options
- `config?: ArgMateConfig` - Parameter definitions (and optionally `intro`/`outro`)
- `settings?: ArgMateSettings` - Engine behavior settings (rarely used directly)

**Returns:** Formatted help text (string) or JSON object

### 2. `argInfoFormat(infoConfig, helpConfig, config)`

**Core formatter** - in `argInfo.ts`

**Parameters:**
- `infoConfig: ArgMateInfoConfig` - Display configuration (width, format, etc.)
- `helpConfig: ArgMateHelpConfig` - Help text (intro, outro)
- `config: ArgMateConfig` - Parameter definitions (i.e. `ArgMateConfig` without `intro`/`outro`)

**Returns:** Formatted help text or structured data

### 3. `formatArgInfo(data, settings?)`

**Table formatter** - in `formatArgInfo.ts`

**Parameters:**
- `data: Record<string, ParamDef>` - Parameter definitions
- `settings?: FormatArgInfoConfig` - Table layout options

**Returns:** Formatted CLI table

## Consistent Parameter Order

The ArgMate codebase now uses a **consistent parameter order** across all functions:

```
(args, config, settings)
```

- **args**: Command line arguments (for parsing functions)
- **config**: Parameter definitions (and optionally `intro`/`outro`)
- **settings**: Engine behavior configuration

This order is maintained in:
- `argMate(args, config, settings)`
- `argEngine(args, config, settings)`
- `argInfo(infoConfig, config, settings)`

## Parameter Types

### Display Configuration (`ArgMateInfoConfig`)

```typescript
interface ArgMateInfoConfig {
    width?: number;           // Max line width (default: 100)
    format?: 'cli' | 'markdown' | 'json';  // Output format
    preIntro?: TextBlock;     // Text before intro
    showIntro?: boolean;      // Show intro section (default: true)
    showOutro?: boolean;      // Show outro section (default: true)
    postOutro?: TextBlock;    // Text after outro
}
```

### Help Configuration (`ArgMateHelpConfig`)

Used for help text only:

```typescript
interface ArgMateHelpConfig {
    intro?: any;        // Introduction text
    outro?: any;        // Conclusion text
}
```

### Parameter Definitions (`ArgMateConfig`)

Used for parameter definitions:

```typescript
interface ArgMateConfig {
    [key: string]: ParameterConfig;  // Parameter definitions
}

```typescript
interface ParameterConfig {
    alias?: string | string[];     // Short aliases
    describe?: string;             // Parameter description
    type?: string;                 // Data type ('string', 'number', 'boolean', etc.)
    default?: any;                 // Default value
    valid?: any[] | Function;      // Valid values or validation function
    mandatory?: boolean;           // Required parameter
    conflict?: string | string[];  // Conflicting parameters
}
```

### Engine Settings (`ArgMateSettings`)

```typescript
interface ArgMateSettings {
    allowUnknown?: boolean;       // Allow unknown parameters
    autoCamelKebabCase?: boolean; // Auto-convert camelCase to kebab-case
    allowNegatingFlags?: boolean; // Allow --no-flag syntax
    // ... other engine settings
}
```

## Usage Examples

### Basic CLI Help with Global State

```typescript
import { argMate, argInfo } from 'argmate';

// Set up global state
argMate('--help'.split(' '), {
    version: {
        alias: 'v',
        describe: 'Show version information'
    },
    help: {
        alias: 'h', 
        describe: 'Display help message'
    }
}, {
    intro: 'MyTool v1.0.0',
    outro: 'Visit https://example.com for more info'
});

// Generate help text using stored state
const help = argInfo();
console.log(help);
```

### Direct Call with Parameters

```typescript
const help = argInfo(
    { format: 'cli', width: 80 },  // Display config
    {
        intro: 'Tool Description',
        outro: 'Additional info',
        version: {
            alias: 'v',
            describe: 'Print version'
        },
        output: {
            alias: 'o',
            describe: 'Output file',
            type: 'string',
            default: 'output.txt'
        }
    }
);
```

### Different Output Formats

```typescript
// CLI format (default)
const cliHelp = argInfo({ format: 'cli' }, config);

// JSON format
const jsonHelp = argInfo({ format: 'json' }, config);
// Returns: { intro: "...", params: {...}, outro: "..." }

// Markdown format
const mdHelp = argInfo({ format: 'markdown' }, config);
// Returns: Markdown table with parameter descriptions
```

## Parameter Processing Flow

1. **Parameter Collection**: All parameter definitions are gathered from the `config` object (excluding `intro`/`outro`)
2. **Name Processing**: Parameter names are converted from camelCase to kebab-case
3. **Alias Sorting**: Short flags (single character) are separated from long flags
4. **Type Information**: Default values and types are formatted for display
5. **Table Generation**: Parameters are formatted into columns for CLI output
6. **Format Application**: Final output is generated based on requested format

## Text Block Formatting

`intro` and `outro` support flexible text formats:

```typescript
// Simple string
intro: 'MyTool v1.0.0'

// Array of strings
intro: ['Line 1', 'Line 2']

// Array of [label, value] pairs
intro: [
    ['Version:', '1.0.0'],
    ['Author:', 'Developer Name']
]
```

## Internal Helper Functions

### Utility Functions (`formatArgInfo.ts`)

- `camelToKebab(str)` - Convert `parameterName` to `--parameter-name`
- `toArray(val)` - Normalize values to arrays
- `formatIntroOutro(content)` - Format text blocks consistently
- `tableLayout(data, config)` - Generate CLI tables with proper spacing

### Table Layout

The table formatter automatically:
- Calculates optimal column widths
- Wraps long text to fit within `maxWidth`
- Aligns columns properly
- Handles multi-line descriptions

## API Consistency Achieved

✅ **Parameter Order**: All functions now use `(config, settings)` order  
✅ **Type Names**: Consistent use of `ArgMateInfoConfig`, `ArgMateHelpConfig`, `ArgMateConfig`, `ArgMateSettings`  
✅ **No More Confusion**: Clear separation between display config, help config, and parameter config  
✅ **Clean Separation**: Each parameter has a single, clear purpose

## Clean API Design

The confusing issue of passing `ArgMateConfig` twice has been resolved:

**Before (Confusing):**
```typescript
argInfoFormat(infoConfig, config, params)  // config and params both ArgMateConfig?!
```

**After (Clear):**
```typescript
argInfoFormat(infoConfig, helpConfig, params)
// - infoConfig: Display formatting (width, format, etc.)
// - helpConfig: Help text only (intro, outro)  
// - params: Parameter definitions only
```

The API is now elegant, consistent, and intuitive across the entire ArgMate codebase.
