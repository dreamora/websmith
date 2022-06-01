/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { lstatSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { createWebpackCompiler } from "../test/webpack-utils";

const projectDir = resolve(__dirname, "..", "test", "__data__", "module-date");

afterEach(() => {
    rmSync(resolve(projectDir, ".build"), { recursive: true, force: true });
});

describe("WebsmithLitePlugin", () => {

    it("should rebundle the file in watch mode w/ the file content change", async () => {
        const target = resolve(projectDir, ".build", "lib", "main.js");

        const { compiler } = await createWebpackCompiler({ ...require(join(projectDir, "webpack.config.ts")), watch: true }, projectDir);

        const expected = lstatSync(resolve(projectDir, ".build", "lib", "main.js")).mtimeMs;
        writeFileSync(target, readFileSync(target).toString());

        expect(lstatSync(resolve(projectDir, ".build", "lib", "main.js")).mtimeMs).toBeGreaterThan(expected);

        compiler.close(() => undefined);
    });

    it("should rebundle the file in watch mode w/ the file content change and writeFile", async () => {
        const target = resolve(projectDir, ".build", "lib", "main.js");

        const { compiler } = await createWebpackCompiler({ ...require(join(projectDir, "webpack_withWriteTarget.config.ts")), watch: true }, projectDir);

        const expected = lstatSync(resolve(projectDir, ".build", "lib", "main.js")).mtimeMs;
        writeFileSync(target, readFileSync(target).toString());

        expect(lstatSync(resolve(projectDir, ".build", "lib", "main.js")).mtimeMs).toBeGreaterThan(expected);

        compiler.close(() => undefined);
    });
});
