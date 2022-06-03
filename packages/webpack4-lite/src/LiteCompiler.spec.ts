/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

/* eslint-disable no-console */
import { Reporter } from "@quatico/websmith-api";
import { AddonRegistry, CompilerOptions, NoReporter } from "@quatico/websmith-compiler";
import { resolve } from "path";
import ts from "typescript";
import { LiteCompiler } from "./LiteCompiler";
import { PluginOptions } from "./WebsmithLitePlugin";

class TestCompiler extends LiteCompiler {
    private sys: ts.System | undefined;

    constructor(options: CompilerOptions, pluginOptions?: PluginOptions, webpackTarget = "*") {
        super(options, pluginOptions, webpackTarget);
        this.sys = ts.sys;
    }

    public setProgram(program: ts.Program): this {
        super.program = program;
        return this;
    }

    public setSystem(system: ts.System | undefined): this {
        this.sys = system;
        return this;
    }

    public getSystem(): ts.System {
        return this.sys as any;
    }

    public stubEmitSourceFile(func: (fileName: string, content: string, target: string) => string) {
        super.emitSourceFile = func;
    }
}
let testObj: TestCompiler;
let expected: string;
let reporter: Reporter;

beforeEach(() => {
    expected = resolve("./__data__/one.ts");
    reporter = new NoReporter();
});

describe("LiteCompiler", () => {
    beforeEach(() => {
        testObj = new TestCompiler(
            {
                addons: new AddonRegistry({ addonsDir: "./addons", reporter: reporter, system: ts.sys }),
                buildDir: resolve("./__data__/.build"),
                project: { declaration: true, target: 99, noEmitOnError: true },
                reporter,
                targets: [],
                tsconfig: { options: {}, fileNames: [expected], errors: [] },
                debug: true,
                sourceMap: false,
                watch: false,
            },
            undefined,
            "*"
        );
    });

    it("should return the program", () => {
        const expected = {} as ts.Program;
        testObj.setProgram(expected);

        const actual = testObj.getProgram();

        expect(actual).toBe(expected);
    });

    it("should throw error in build w/o system", () => {
        testObj.setSystem(undefined);

        expect(() => testObj.build("./src/one.ts", "")).toThrow(new Error("TsCompiler.build() not called with ts.sys as the active ts.System"));
    });

    it('should provide transpiled compilation fragment w/ build, default config, "*" target and source code', () => {
        const target = jest.fn().mockReturnValue("expected");
        testObj.stubEmitSourceFile(target);

        const actual = testObj.build("expected.ts", "expected");

        expect(actual).toBe("expected");
        expect(target).toHaveBeenCalledWith("expected.ts", "expected", "*");
    });

    it("should fail with invalid source code", () => {
        const actual = testObj.build(expected, "const () => 1;");

        expect(actual).toBe("const () => 1;");
    });
});
