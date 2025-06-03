import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as glob from '@actions/glob';
import * as io from '@actions/io';
import { Octokit } from '@octokit/action';
import { Context } from './context.js';
export declare type AsyncFunctionArguments = {
    context: Context;
    core: typeof core;
    github: InstanceType<typeof Octokit>;
    octokit: InstanceType<typeof Octokit>;
    exec: typeof exec;
    glob: typeof glob;
    io: typeof io;
    require: NodeRequire;
    __original_require__: NodeRequire;
};
export declare function callAsyncFunction<T>(args: AsyncFunctionArguments, source: string): Promise<T>;
