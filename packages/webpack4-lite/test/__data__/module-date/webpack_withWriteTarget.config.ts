import { resolve } from "path";
import { WebsmithLitePlugin } from "../../../src";

const sourceDir = resolve(__dirname, "src");

module.exports = {
    target: "web",
    devtool: "source-map",
    mode: "development",
    entry: {
        main: resolve(sourceDir, "index.tsx"),
        functions: resolve(sourceDir, "functions", "getDate.ts"),
    },
    output: {
        path: resolve(__dirname, ".build/lib"),
        publicPath: "/",
    },
    resolve: {
        extensions: [".js", ".ts", ".tsx"],
    },
    plugins: [
        new WebsmithLitePlugin({
            project: resolve(__dirname, "tsconfig.json"),
            config: resolve(__dirname, "websmith.config.json"),
            targets: "WriteOnly",
            webpackTarget: "WriteOnly",
        }),
    ],
    module: {
        rules: [
            {
                test: /\.[j|t]sx?$/,
                include: [sourceDir],
                exclude: [/\.spec\.tsx?$/, /node_modules/],
                use: ["ts-loader", WebsmithLitePlugin.loader + ".ts"],
            },
        ],
    },
};
