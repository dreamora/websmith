/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import webpack from "webpack";
import { LiteCompiler } from "./LiteCompiler";
import { WebsmithLoaderContext } from "./WebsmithLitePlugin";

const cache: WeakMap<webpack.Compiler, Map<string, LiteCompiler>> = new WeakMap();

export function getInstanceFromCache(compiler: webpack.Compiler, loader: WebsmithLoaderContext): LiteCompiler | undefined {
    let instances = cache.get(compiler);
    if (!instances) {
        instances = new Map();
        cache.set(compiler, instances);
    }

    return instances.get(getCacheName(loader));
}

export function setInstanceInCache(compiler: webpack.Compiler, loader: WebsmithLoaderContext, instance: LiteCompiler) {
    const instances = cache.get(compiler) ?? new Map<string, LiteCompiler>();
    instances.set(getCacheName(loader), instance);
    cache.set(compiler, instances);
}

export const getCacheName = (loader: WebsmithLoaderContext) => `websmith-lite-${loader._compilation?.hash ?? ""}`;
