/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { ErrorMessage, Generator, Processor, Reporter, TargetConfig } from "@quatico/websmith-api";
import type { CompilationConfig, CompilerOptions } from "@quatico/websmith-compiler";
import {
    CompilationContext,
    CompilationHost,
    CompilerAddon,
    createSharedHost,
    DefaultReporter,
    recursiveFindByFilter,
} from "@quatico/websmith-compiler";
import { dirname, extname, join } from "path";
import ts from "typescript";
import uPath from "./Upath";
import { PluginOptions } from "./WebsmithLitePlugin";

export class LiteCompiler {
    public contextMap!: Map<string, CompilationContext>;
    public version: number;

    public fragment?: string;
    public pluginConfig: PluginOptions;
    private configPath!: string;

    protected program?: ts.Program;
    private system!: ts.System;
    private compilationHost!: CompilationHost;
    private langService!: ts.LanguageService;
    private reporter!: Reporter;

    constructor(private options: CompilerOptions, pluginOptions?: PluginOptions, protected webpackTarget: string = "*") {
        this.version = 0;
        this.contextMap = new Map();
        this.system = ts.sys;
        this.setOptions(options);
        this.pluginConfig = pluginOptions ?? { config: "", webpackTarget };
        this.createTargetContextsIfNecessary();
        this.webpackTarget = this.getFragmentTarget(this.webpackTarget);
        if (this.pluginConfig.targets && this.pluginConfig.targets.length > 1) {
            this.reporter.reportDiagnostic(new ErrorMessage(`Multiple targets are not supported.`));
        }
    }

    public getProgram(): ts.Program | undefined {
        if (!this.program) {
            this.program = this.langService.getProgram();
        }

        return this.program;
    }

    protected getSystem(): ts.System {
        return this.system;
    }

    public build(resourcePath: string, content: string): string {
        if (this.getSystem() !== ts.sys) {
            throw new Error("TsCompiler.build() not called with ts.sys as the active ts.System");
        }

        const fileName = uPath.normalize(resourcePath);

        const result = this.emitSourceFile(fileName, content, this.webpackTarget);

        this.fragment = result;
        return result;
    }

    protected emitSourceFile(fileName: string, content: string, target: string): string {
        const ctx = this.contextMap.get(target);

        if (ctx) {
            this.compilationHost.setLanguageHost(ctx.getLanguageHost());
            ctx.getGenerators().forEach((cur: Generator) => cur(fileName, content));
            ctx.getProcessors().forEach((cur: Processor) => (content = cur(fileName, content)));
        }
        return content;
    }

    private getFragmentTarget(webpackTarget: string): string {
        const fragmentTargets = this.getNonWritingTargets();
        if (fragmentTargets.length === 0) {
            const error = `No writeFile: false targets found for "${webpackTarget}"`;
            // eslint-disable-next-line no-console
            this.pluginConfig.warn?.(new Error(error));

            const writingTargets = this.getWritingTargets();
            if (writingTargets.includes(webpackTarget) || webpackTarget == "*") {
                return writingTargets.length > 0 ? writingTargets[0] : webpackTarget;
            }
            const noTargetError = `No target found for "${webpackTarget}"`;
            if (this.pluginConfig.error) {
                this.pluginConfig.error?.(new Error(noTargetError));
            }
            throw new Error(noTargetError);
        }

        const target = fragmentTargets.length === 0 || fragmentTargets.includes(webpackTarget) ? webpackTarget : fragmentTargets[0];
        fragmentTargets
            .filter((cur: string) => cur !== target)
            .forEach((target: string) => {
                this.pluginConfig.warn?.(new Error(`Target "${target}" is not used by the WebsmithPlugin.`));
            });

        return target;
    }

    protected createTargetContextsIfNecessary(): this {
        // eslint-disable-next-line no-console
        this.options.targets.forEach((target: string) => {
            if (this.contextMap.has(target)) {
                return;
            }

            const { buildDir, config, project, tsconfig } = this.options;
            const { options, config: targetConfig } = getTargetConfig(target, config);

            const ctx = new CompilationContext({
                buildDir,
                project: { ...project, ...options },
                projectDir: dirname(config?.configFilePath ?? tsconfig.raw?.configFilePath ?? this.system.getCurrentDirectory()),
                system: this.getSystem(),
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                program: this.program!,
                tsconfig: { ...tsconfig, options: { ...project, ...options } },
                rootFiles: this.getRootFiles(),
                reporter: this.reporter,
                config: targetConfig,
                target,
            });
            this.options.addons.getAddons(target).forEach((addon: CompilerAddon) => {
                addon.activate(ctx);
            });
            this.contextMap.set(target, ctx);
        });
        return this;
    }

    private setOptions(options: CompilerOptions): this {
        this.options = options;
        if (!this.options?.targets || this.options.targets.length === 0) {
            options.targets = ["*"];
        }

        this.reporter = options.reporter ?? new DefaultReporter(this.getSystem());
        this.compilationHost = new CompilationHost(createSharedHost(this.getSystem()) as ts.LanguageServiceHost);
        this.langService = ts.createLanguageService(this.compilationHost, ts.createDocumentRegistry());

        if (!options.debug) {
            // eslint-disable-next-line no-console
            console.debug = () => undefined;
            // eslint-disable-next-line no-console
            console.log = () => undefined;
        }

        return this;
    }

    private getRootFiles(): string[] {
        return this.options?.tsconfig?.fileNames
            ? this.options.tsconfig.fileNames
            : recursiveFindByFilter(this.getSystem().resolvePath(join(dirname(this.configPath), "./src")), (path: string) =>
                  ["ts", "tsx", "js", "jsx"].some(it => extname(path).includes(it))
              );
    }

    private getNonWritingTargets(): string[] {
        return this.options.targets.filter((cur: string) => !getTargetConfig(cur, this.options.config).writeFile);
    }

    private getWritingTargets(): string[] {
        return this.options.targets.filter((cur: string) => getTargetConfig(cur, this.options.config).writeFile);
    }
}

const getTargetConfig = (target: string, config?: CompilationConfig): TargetConfig => {
    if (config) {
        const { targets = {} } = config;
        return targets[target] ?? {};
    }
    return {};
};
