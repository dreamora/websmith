/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
/* eslint-disable no-console */

import { WarnMessage } from "@quatico/websmith-api";
import { Compiler, CompilerAddon, createBrowserSystem, NoReporter } from "@quatico/websmith-core";
import { Command } from "commander";
import path, { join, normalize, resolve } from "path";
import ts from "typescript";
import { addCompileCommand, hasInvalidTargets } from "./command";
import { createOptions } from "./options";

let testSystem: ts.System;
let origCwd: string;

beforeAll(() => {
    origCwd = process.cwd();
    process.chdir(join(__dirname, ".."));
});
beforeEach(() => {
    testSystem = createBrowserSystem({}, ts.sys.useCaseSensitiveFileNames);
    testSystem.createDirectory("./addons");
    testSystem.writeFile("./tsconfig.json", "{}");

    // TODO: Find a better approach. We need to do this with the virtual test system to ensure, that we do not use the websmith tsconfig.json as they will resolve dozens to hundreds of filenames
    let testDir = normalize(join(process.cwd(), "test"));
    if (!testDir.includes(join("compiler", "test"))) {
        testDir = testDir.replace(testDir.slice(testDir.indexOf("test")), join("packages", "compiler", testDir.slice(testDir.indexOf("test"))));
    }
});

afterAll(() => {
    process.chdir(origCwd);
});

describe("addCompileCommand", () => {
    it("should create additionalArguments map w/ unknown argument", () => {
        const target = new Compiler(createOptions({}, new NoReporter()));
        const testObj = addCompileCommand(new Command(), target);

        testObj.parse(
            [
                "--unknown",
                '{"key1":13, "key2":{"key1":"expected", "key2":false}}',
                "--port",
                "3000",
                "--hostname",
                "http://localhost",
                "--booleanFlag",
            ],
            { from: "user" }
        );

        expect(target.getOptions().additionalArguments).toEqual(
            new Map<string, unknown>([
                ["unknown", { key1: 13, key2: { key1: "expected", key2: false } }],
                ["port", 3000],
                ["hostname", "http://localhost"],
                ["booleanFlag", true],
            ])
        );
    });

    it("should yield default options w/o config and CLI arguments", () => {
        const target = new Compiler(createOptions({}, new NoReporter()));

        addCompileCommand(new Command(), target).parse([], { from: "user" });

        const actual = target.getOptions();

        expect(actual.addons).toEqual(
            expect.objectContaining({
                availableAddons: new Map(),
            })
        );
        expect(actual.buildDir).toEqual(expect.stringContaining(path.sep));
        expect(actual.watch).toBe(false);
        expect(actual.config).toBeUndefined();
        expect(actual.debug).toBe(false);
        const compilerOptions = {
            allowJs: true,
            allowSyntheticDefaultImports: true,
            alwaysStrict: true,
            configFilePath: resolve("tsconfig.json"),
            declaration: true,
            declarationMap: true,
            downlevelIteration: true,
            emitDecoratorMetadata: true,
            esModuleInterop: true,
            experimentalDecorators: true,
            importHelpers: true,
            incremental: true,
            inlineSources: undefined,
            lib: ["lib.es2015.d.ts", "lib.es2016.d.ts", "lib.es2017.d.ts", "lib.esnext.d.ts", "lib.dom.d.ts"],
            module: 1,
            moduleResolution: 2,
            noEmit: false,
            noEmitOnError: true,
            noImplicitAny: true,
            noImplicitReturns: true,
            noImplicitThis: true,
            noUnusedLocals: true,
            outDir: join(__dirname, "..", "bin"),
            pretty: true,
            removeComments: false,
            resolveJsonModule: true,
            skipLibCheck: false,
            sourceMap: false,
            strict: true,
            strictBindCallApply: true,
            strictFunctionTypes: true,
            strictNullChecks: true,
            strictPropertyInitialization: true,
            target: 99,
            types: ["node", "jest"],
            useUnknownInCatchVariables: true,
        };
        expect(actual.project).toEqual(compilerOptions);

        expect({ wildcardDirectories: {}, ...actual.tsconfig }).toEqual({
            options: compilerOptions,
            errors: [],
            typeAcquisition: {
                include: [],
                exclude: [],
                enable: false,
            },
            fileNames: [
                `${join(__dirname, "CompilerArguments.ts")}`,
                `${join(__dirname, "bin.ts")}`,
                `${join(__dirname, "command.ts")}`,
                `${join(__dirname, "compiler-system.ts")}`,
                `${join(__dirname, "find-config.ts")}`,
                `${join(__dirname, "index.ts")}`,
                `${join(__dirname, "options.ts")}`,
            ],
            compileOnSave: false,
            projectReferences: undefined,
            raw: {
                compileOnSave: undefined,
                compilerOptions: {
                    module: "CommonJS",
                    noEmit: false,
                    outDir: "./bin",
                },
                exclude: ["src/**/*.spec.ts"],
                extends: "../../tsconfig.json",
                include: ["src/**/*.ts"],
            },
            watchOptions: undefined,
            wildcardDirectories: {[join(__dirname, "..", "src").toLowerCase()]:1},
        });
        expect(actual.reporter).toBeDefined();
        expect(actual.sourceMap).toBe(false);
        expect(actual.targets).toEqual(["*"]);
        expect(actual.watch).toBe(false);
    });

    it("should set config option w/ --config cli argument", () => {
        testSystem.writeFile("./expected/websmith.config.json", "{}");
        const target = new Compiler(createOptions({}, new NoReporter()), testSystem);

        addCompileCommand(new Command(), target).parse(["--config", "./expected/websmith.config.json"], { from: "user" });

        expect(target.getOptions().config?.configFilePath).toEqual(expect.stringContaining("/expected/websmith.config.json"));
    });

    it("should set project option w/ --project cli argument", () => {
        testSystem.writeFile("expected/tsconfig.json", "{}");
        const target = new Compiler(createOptions({}, new NoReporter()), testSystem);

        addCompileCommand(new Command(), target).parse(["--project", "expected/tsconfig.json"], { from: "user" });

        expect(target.getOptions().project.configFilePath).toEqual(expect.stringContaining("/expected/tsconfig.json"));
    });

    it("should set sourceMap option w/ --sourceMap cli argument", () => {
        const target = new Compiler(createOptions({}, new NoReporter()));

        addCompileCommand(new Command(), target).parse(["--sourceMap"], { from: "user" });

        expect(target.getOptions().sourceMap).toBe(true);
    });

    it("should set debug compiler option w/ --debug cli argument", () => {
        const target = new Compiler(createOptions({}, new NoReporter()));

        addCompileCommand(new Command(), target).parse(["--debug"], { from: "user" });

        expect(target.getOptions().debug).toBe(true);
    });

    // FIXME: This test is failing because the compiler watch support is broken.
    it.skip("should set watch compiler option w/ --watch cli argument", () => {
        const target = new Compiler(createOptions({}, new NoReporter()));

        addCompileCommand(new Command(), target).parse(["--watch"], { from: "user" });

        expect(target.getOptions().watch).toBe(true);
    });

    it("should execute compile w/o --watch cli argument", () => {
        const target = new Compiler(createOptions({}, new NoReporter()));
        target.compile = jest.fn();

        addCompileCommand(new Command(), target).parse([], { from: "user" });

        expect(target.compile).toHaveBeenCalled();
    });

    it("should set transpileOnly option w/ --transpileOnly cli argument", () => {
        testSystem.writeFile("expected/tsconfig.json", "{}");
        const target = new Compiler(createOptions({}, new NoReporter()), testSystem);

        addCompileCommand(new Command(), target).parse(["--transpileOnly"], { from: "user" });

        expect(target.getOptions().transpileOnly).toBe(true);
    });

    // FIXME: This test requires a decision regarding our explicit logic for additional cmdline arguments - do provide them through the CompilerOptions or do we reject them.
    it.skip("should inform CLI user about tsconfig usage for unsupported command line arguments", () => {
        console.error = line => {
            throw new Error(line.toString());
        };
        const target = new Compiler(createOptions({}, new NoReporter()));

        expect(() => addCompileCommand(new Command(), target).parse(["--debug", "--allowJs", "--strict"], { from: "user" })).toThrow(
            `Unknown Argument "--allowJs".` + `\nIf this is a tsc command, please configure it in your typescript configuration file.\n`
        );
    });
});

describe("addCompileCommand#addons", () => {
    it("should show warning w/ --addonsDir cli argument and non-existing path", () => {
        const target = new Compiler(createOptions({}, new NoReporter()));
        target.getReporter().reportDiagnostic = jest.fn();

        addCompileCommand(new Command(), target).parse(["--addonsDir", "./unknown"], { from: "user" });

        expect(target.getReporter().reportDiagnostic).toHaveBeenCalledWith(new WarnMessage('Addons directory "./unknown" does not exist.'));
    });

    it("should add addon name to addons w/ --addons cli argument and known name", () => {
        testSystem.writeFile("./addons/expected/addon.ts", "export const activate = () => {};");
        jest.mock(
            "/addons/expected/addon",
            () => {
                return { activate: jest.fn() };
            },
            { virtual: true }
        );

        const target = new Compiler(createOptions({}, new NoReporter()), testSystem);

        addCompileCommand(new Command(), target).parse(["--addons", "expected"], { from: "user" });

        expect(
            target
                .getOptions()
                .addons.getAddons()
                .map((it: CompilerAddon) => it.name)
        ).toEqual(["expected"]);
    });

    it("should add addon name to addons w/ --addons cli argument and multiple known names", () => {
        testSystem.writeFile("./addons/zip/addon.ts", "export const activate = () => {};");
        testSystem.writeFile("./addons/zap/addon.ts", "export const activate = () => {};");
        testSystem.writeFile("./addons/zup/addon.ts", "export const activate = () => {};");
        jest.mock(
            "/addons/zip/addon",
            () => {
                return { activate: jest.fn() };
            },
            { virtual: true }
        );

        jest.mock(
            "/addons/zap/addon",
            () => {
                return { activate: jest.fn() };
            },
            { virtual: true }
        );

        jest.mock(
            "/addons/zup/addon",
            () => {
                return { activate: jest.fn() };
            },
            { virtual: true }
        );

        const target = new Compiler(createOptions({}, new NoReporter()), testSystem);

        addCompileCommand(new Command(), target).parse(["--addons", "zip, zap, zup"], { from: "user" });

        expect(
            target
                .getOptions()
                .addons.getAddons()
                .map((it: CompilerAddon) => it.name)
        ).toEqual(["zip", "zap", "zup"]);
    });

    it("should not add addon name to addons w/ --addons cli argument and unknown name", () => {
        const target = new Compiler(createOptions({}, new NoReporter()));

        addCompileCommand(new Command(), target).parse(["--addons", "unknown"], { from: "user" });

        expect(target.getOptions().addons.getAddons()).toEqual([]);
    });

    it("should not add unkonwn addon name to addons w/ --addons cli argument, known and unknown name", () => {
        testSystem.writeFile("./addons/known/addon.ts", "export const activate = () => {};");
        jest.mock(
            "/addons/known/addon",
            () => {
                return { activate: jest.fn() };
            },
            { virtual: true }
        );

        const target = new Compiler(createOptions({}, new NoReporter()), testSystem);

        addCompileCommand(new Command(), target).parse(["--addons", "unknown, known"], { from: "user" });

        expect(
            target
                .getOptions()
                .addons.getAddons()
                .map((it: CompilerAddon) => it.name)
        ).toEqual(["known"]);
    });

    it("should show warning w/ --addons cli argument and unknown name", () => {
        const target = new Compiler(createOptions({}, new NoReporter()));
        target.getReporter().reportDiagnostic = jest.fn();

        addCompileCommand(new Command(), target).parse(["--addons", "unknown"], { from: "user" });

        expect(target.getReporter().reportDiagnostic).toHaveBeenCalledWith(new WarnMessage('Missing addons: "unknown".'));
    });

    it("should show warning w/ --addons cli argument, known and unknown name", () => {
        testSystem.writeFile("./addons/known/addon.ts", "export const activate = () => {};");
        jest.mock(
            "/addons/known/addon",
            () => {
                return { activate: jest.fn() };
            },
            { virtual: true }
        );

        const target = new Compiler(createOptions({}, new NoReporter()), testSystem);
        target.getReporter().reportDiagnostic = jest.fn();

        addCompileCommand(new Command(), target).parse(["--addons", "known, unknown"], { from: "user" });

        expect(target.getReporter().reportDiagnostic).toHaveBeenCalledWith(new WarnMessage('Missing addons: "unknown".'));
    });

    it("should use addonsDir and addons from compiler config w/o cli argument override", () => {
        testSystem.writeFile("/expected/one/addon.ts", "export const activate = () => {};");
        jest.mock(
            "/expected/one/addon",
            () => {
                return { activate: () => undefined };
            },
            { virtual: true }
        );
        testSystem.writeFile("websmith.config.json", '{ "addons":["one", "two"], "addonsDir":"./expected" }');
        const target = new Compiler(createOptions({}, new NoReporter()), testSystem);

        addCompileCommand(new Command(), target).parse([], { from: "user" });

        expect(target.getOptions().addons).toMatchInlineSnapshot(`
            AddonRegistry {
              "addons": [
                "one",
                "two",
              ],
              "availableAddons": Map {
                "one" => {
                  "activate": [Function],
                  "name": "one",
                },
              },
              "config": {
                "addons": [
                  "one",
                  "two",
                ],
                "addonsDir": "/expected",
                "configFilePath": "/websmith.config.json",
              },
              "reporter": NoReporter {},
            }
        `);
    });
});

describe("addCompileCommand#targets", () => {
    it("should set targets w/ single targets cli argument", () => {
        const target = new Compiler(createOptions({}, new NoReporter()));

        addCompileCommand(new Command(), target).parse(["--targets", "expected"], { from: "user" });

        expect(target.getOptions().targets).toEqual(["expected"]);
    });

    it("should set target w/ comma separated targets cli argument", () => {
        const target = new Compiler(createOptions({}, new NoReporter()));

        addCompileCommand(new Command(), target).parse(["--targets", "one, two, three"], { from: "user" });

        expect(target.getOptions().targets).toEqual(["one", "two", "three"]);
    });

    it("should show warning w/ --targets cli argument and unknown name", () => {
        const target = new Compiler(createOptions({}, new NoReporter()));
        target.getReporter().reportDiagnostic = jest.fn();

        addCompileCommand(new Command(), target).parse(["--targets", "unknown"], { from: "user" });

        expect(target.getReporter().reportDiagnostic).toHaveBeenCalledWith(
            new WarnMessage(
                'Custom target configuration "unknown" found, but no target provided.\n\tSome custom addons may not be applied during compilation.'
            )
        );
    });

    it("should not show any warning w/ --targets cli argument and known names", () => {
        testSystem.writeFile("./websmith.config.json", '{ "targets": {"expected": {}} }');
        const target = new Compiler(createOptions({}, new NoReporter()), testSystem);
        target.getReporter().reportDiagnostic = jest.fn();

        addCompileCommand(new Command(), target).parse(["--targets", "expected"], { from: "user" });

        expect(target.getReporter().reportDiagnostic).not.toHaveBeenCalled();
    });

    it("should not show any warning w/ --targets cli argument and multiple known names", () => {
        testSystem.writeFile("./websmith.config.json", '{ "targets": {"zip": {}, "zap": {}, "zup": {}} }');
        const target = new Compiler(createOptions({}, new NoReporter()), testSystem);
        target.getReporter().reportDiagnostic = jest.fn();

        addCompileCommand(new Command(), target).parse(["--targets", "zip, zap, zup"], { from: "user" });

        expect(target.getReporter().reportDiagnostic).not.toHaveBeenCalled();
    });

    it("should show warning w/ --targets cli argument, known and unknown names", () => {
        testSystem.writeFile("./websmith.config.json", '{ "targets": {"whatever": {}, "known": {}} }');
        const target = new Compiler(createOptions({}, new NoReporter()), testSystem);
        target.getReporter().reportDiagnostic = jest.fn();

        addCompileCommand(new Command(), target).parse(["--targets", "unknown, known"], { from: "user" });

        expect(target.getReporter().reportDiagnostic).toHaveBeenCalledWith(
            new WarnMessage(
                'Custom target configuration "unknown,known" found, but no target provided.\n\tSome custom addons may not be applied during compilation.'
            )
        );
    });

    it("should show warning w/ --targets cli argument, known name but missing addons for target", () => {
        testSystem.writeFile("./websmith.config.json", '{ "targets": {"known": { "addons": ["missing"]}} }');
        const target = new Compiler(createOptions({}, new NoReporter()), testSystem);
        target.getReporter().reportDiagnostic = jest.fn();
        expect(testSystem.fileExists("./tsconfig.json")).toBe(true);

        addCompileCommand(new Command(), target).parse(["--targets", "known"], { from: "user" });

        expect(target.getReporter().reportDiagnostic).toHaveBeenCalledWith(new WarnMessage('Missing addons for target "known": "missing".'));
    });

    it("should show warning w/ --targets cli argument, multiple known names but missing addons for targets", () => {
        testSystem.writeFile(
            "./websmith.config.json",
            '{ "targets": {"zip": { "addons": ["missing1"]}, "zap": { "addons": ["missing2"]}, "zup": { "addons": ["missing3"]}} }'
        );
        const target = new Compiler(createOptions({}, new NoReporter()), testSystem);
        target.getReporter().reportDiagnostic = jest.fn();

        addCompileCommand(new Command(), target).parse(["--targets", "zip, zap, zup"], { from: "user" });

        expect(target.getReporter().reportDiagnostic).toHaveBeenCalledWith(new WarnMessage('Missing addons for target "zip": "missing1".'));
        expect(target.getReporter().reportDiagnostic).toHaveBeenCalledWith(new WarnMessage('Missing addons for target "zap": "missing2".'));
        expect(target.getReporter().reportDiagnostic).toHaveBeenCalledWith(new WarnMessage('Missing addons for target "zup": "missing3".'));
    });
});

describe("hasInvalidTargets", () => {
    it("should return true w/o CompilationConfig", () => {
        expect(hasInvalidTargets(["whatever"])).toBe(true);
    });

    it("should return false w/ valid target and CompilationConfig", () => {
        expect(
            hasInvalidTargets(["valid"], {
                targets: {
                    valid: {},
                },
            } as any)
        ).toBe(false);
    });

    it("should return true w/ invalid and valid target and CompilationConfig", () => {
        expect(
            hasInvalidTargets(["valid", "invalid"], {
                targets: {
                    valid: {},
                },
            } as any)
        ).toBe(true);
    });

    it('should return false w/ "*" target and others in CompilationConfig', () => {
        expect(
            hasInvalidTargets(["*"], {
                targets: {
                    one: {},
                    two: {},
                    three: {},
                },
            } as any)
        ).toBe(false);
    });

    it('should return true w/ "*" and invalid target and CompilationConfig', () => {
        expect(
            hasInvalidTargets(["*", "invalid"], {
                targets: {
                    one: {},
                    two: {},
                    three: {},
                },
            } as any)
        ).toBe(true);
    });
});
