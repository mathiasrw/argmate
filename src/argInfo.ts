// The `argmate/info` entry: the help with no parser
import type {ArgMateInfoConfig} from './types.js';
import argEngineMini from './argEngineMini.js';
import {argInfoFormat} from './helpText.js';

export {argInfoFormat};

// The entry has no parser of its own, so the mini engine reads the words of `include` and `exclude`
export default function argInfo(options?: ArgMateInfoConfig) {
	return argInfoFormat(options, argEngineMini);
}
