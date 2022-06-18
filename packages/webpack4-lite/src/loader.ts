/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { createOptions } from "@quatico/websmith-cli";
import { CompilerOptions } from "@quatico/websmith-compiler";
import webpack from "webpack";
import { getInstanceFromCache, setInstanceInCache } from "./instance-cache";
import { LiteCompiler } from "./LiteCompiler";
import { WebsmithLoaderContext } from "./WebsmithLitePlugin";

export default function loader(this: WebsmithLoaderContext, content: string): void {
    console.error(`Plugin Config: ${JSON.stringify(this.pluginConfig)}`);
    const compilerOptions: CompilerOptions = createOptions(this.pluginConfig);
    const instance = initializeInstance(this, compilerOptions);
    const fragment = buildTargets(compilerOptions, instance, this.resourcePath, content);

    if (!this._module.buildMeta !== undefined) {
        this._module.buildMeta.magellanPluginVersion = instance.version;
    }

    setInstanceInCache(this._compiler, this, instance);

    this.callback(undefined, fragment);
}

export const initializeInstance = (loaderInstance: WebsmithLoaderContext, options: CompilerOptions): LiteCompiler => {
    const compiler = loaderInstance._compiler || ({} as webpack.Compiler);
    let instance: LiteCompiler | undefined = getInstanceFromCache(compiler, loaderInstance);
    if (!instance) {
        instance = new LiteCompiler(options);
        setInstanceInCache(compiler, loaderInstance, instance);
    }

    return instance;
};

const buildTargets = (_compilerOptions: CompilerOptions, compiler: LiteCompiler, resourcePath: string, content: string): string => {
    return compiler.build(resourcePath, content);
};
