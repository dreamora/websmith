/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import type { CompileFragment, CompilerAddon, CompilerOptions } from "./compiler";
import {
    AddonRegistry,
    CompilationConfig,
    CompilationContext,
    CompilationHost,
    Compiler,
    createSharedHost,
    DefaultReporter,
    NoReporter,
    resolveCompilationConfig,
    resolveProjectConfig,
    resolveTargets,
    tsDefaults,
    tsLibDefaults,
    updateCompilerOptions,
} from "./compiler";
import {
    createBrowserSystem,
    createCompileHost,
    createSystem,
    createVersionedFiles,
    getVersionedFile,
    readFiles,
    recursiveFindByFilter,
} from "./environment";

export {
    AddonRegistry,
    CompilationConfig,
    CompilationContext,
    Compiler,
    CompilerAddon,
    createBrowserSystem,
    createCompileHost,
    CompilationHost,
    createSharedHost,
    createSystem,
    createVersionedFiles,
    DefaultReporter,
    getVersionedFile,
    NoReporter,
    readFiles,
    recursiveFindByFilter,
    resolveCompilationConfig,
    resolveProjectConfig,
    resolveTargets,
    tsDefaults,
    tsLibDefaults,
    updateCompilerOptions,
};
export type { CompileFragment, CompilerOptions };
