/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { readFileSync } from "fs";
import webpack, { Compiler, Stats } from "webpack";
import { contribute } from "./CompilationQueue";
import uPath from "./Upath";
import Compilation = webpack.compilation.Compilation;

export interface PluginArguments {
    addons?: string;
    addonsDir?: string;
    buildDir?: string;
    config: string;
    debug?: boolean;
    project?: string;
    sourceMap?: boolean;
    targets?: string;
    webpackTarget?: string;
}

export type PluginOptions = PluginArguments & {
    warn?: (err: Error) => void;
    error?: (err: Error) => void;
};

export type WebsmithLoaderContext = webpack.loader.LoaderContext & { pluginConfig: PluginOptions };

export class WebsmithLitePlugin {
    public static loader = uPath.join(__dirname, "loader");
    public static PLUGIN_NAME = "WebsmithLitePlugin";

    constructor(protected config: PluginOptions) {
        this.config = { ...this.config, webpackTarget: this.config.webpackTarget ?? "*" };
    }

    public apply(compiler: Compiler): void {
        const compilationQueueContributor = contribute();
        compiler.hooks.beforeRun.tap(WebsmithLitePlugin.PLUGIN_NAME, () => {
            compilationQueueContributor.inProgress();
        });
        compiler.hooks.watchRun.tap(WebsmithLitePlugin.PLUGIN_NAME, () => {
            compilationQueueContributor.inProgress();
        });
        compiler.hooks.done.tap(WebsmithLitePlugin.PLUGIN_NAME, () => {
            compilationQueueContributor.done();
        });

        compiler.hooks.thisCompilation.tap(WebsmithLitePlugin.PLUGIN_NAME, compilation => this.tapCompilation(compilation));

        compiler.hooks.done.tapAsync(WebsmithLitePlugin.PLUGIN_NAME, (stats, callback) => {
            callback();
            if (compiler.options.watch) {
                displayDone(stats);
            }
        });
    }

    private tapCompilation(compilation: Compilation) {
        compilation.hooks.normalModuleLoader.tap(WebsmithLitePlugin.PLUGIN_NAME, (loaderContext: WebsmithLoaderContext) => {
            const websmithConfig = readFileSync(this.config.config).toString();
            const config = {
                ...JSON.parse(websmithConfig),
                // ...this.config,
                config: "websmith.config.json",

                ...(loaderContext._module && { warn: (err: Error) => loaderContext._module?.addWarning(err) }),
                ...(loaderContext._module && { error: (err: Error) => loaderContext._module?.addError(err) }),
            };

            console.error(`Plugin Config: ${JSON.stringify(config)}`);
            loaderContext.pluginConfig = config;

            // if (loaderContext) {
            //     const instance: LiteCompiler =
            //         getInstanceFromCache(compilation.compiler, loaderContext) ??
            //         new LiteCompiler(createOptions(config), config, this.config.webpackTarget);
            //     setInstanceInCache(compilation.compiler, loaderContext, instance);
            // }
            // return loaderContext._module;
        });
    }
}

const displayDone = (stats: Stats) => {
    if (!stats.hasErrors() && stats.startTime && stats.endTime) {
        const timeInSec = (stats.endTime - stats.startTime) / 1000;
        // eslint-disable-next-line no-console
        console.info(`✨  Done in ${timeInSec}s.\n`);
    }
};
