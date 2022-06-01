/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { createOptions } from "@quatico/websmith-cli";
import { join, resolve } from "path";
import { Compiler, LoaderContext } from "webpack";
import { getInstanceFromCache } from "./instance-cache";
import { initializeInstance } from "./loader";

const projectDir = resolve(__dirname, "..", "test", "__data__", "module-date");

describe("initializeInstance", () => {
    it("should create a TsCompiler instance w/o instance in cache", () => {
        const target = { _compiler: {} as Compiler } as LoaderContext<any>;

        const actual = initializeInstance(
            target,
            createOptions({ config: join(projectDir, "websmith.config.json"), project: join(projectDir, "tsconfig.json") })
        );

        expect(actual).toEqual(getInstanceFromCache(target._compiler!, target));
    });
});
