/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { existsSync } from "fs";
import { resolve } from "path";
import webpack, { Configuration, Stats } from "webpack";
import { WebsmithLitePlugin } from "../src";

export const createWebpackCompiler = (
    options: Configuration,
    projectDir: string,
    callback: (stats: Stats | undefined, errors?: string[]) => void
) => {
    options = {
        ...{
            entry: {
                main: existsSync(resolve(projectDir, "src", "index.ts"))
                    ? resolve(projectDir, "src", "index.ts")
                    : resolve(projectDir, "src", "index.tsx"),
                functions: resolve(projectDir, "src", "functions", "getDate.ts"),
            },
            output: {
                path: resolve(projectDir, ".build", "lib"),
            },
            plugins: [
                new WebsmithLitePlugin({
                    addonsDir: resolve(__dirname, "..", "addons", "lib"),
                    config: resolve(projectDir, "websmith.config.json"),
                    project: resolve(projectDir, "tsconfig.json"),
                    webpackTarget: "*",
                }),
            ],
            mode: "development",
            resolve: {
                extensions: [".js", ".ts", ".tsx"],
            },
            module: {
                rules: [
                    {
                        test: /\.tsx?$/,
                        include: [resolve(projectDir, "src")],
                        exclude: [/\.spec\.tsx?$/, /node_modules/],
                        loader: `${WebsmithLitePlugin.loader}.ts`,
                    },
                ],
            },
        },
        ...options,
    };

    webpack(options, (err: Error | undefined, stats: Stats | undefined) => {
        let errors: string[] = [];
        if (err || (stats && stats.hasErrors())) {
            errors = err ? [err.message] : stats?.toJson("errors-only").errors ?? [];
        }
        callback(stats, errors);
    });
};
