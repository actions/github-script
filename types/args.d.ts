/// <reference types="node" />
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import type { context, getOctokit } from '@actions/github';
import * as glob from '@actions/glob';
import * as io from '@actions/io';
export type AsyncFunctionArguments = {
    context: typeof context;
    core: typeof core;
    github: ReturnType<typeof getOctokit>;
    octokit: ReturnType<typeof getOctokit>;
    getOctokit: typeof getOctokit;
    exec: typeof exec;
    glob: typeof glob;
    io: typeof io;
    require: NodeJS.Require;
    __original_require__: NodeJS.Require;
};
