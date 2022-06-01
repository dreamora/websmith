/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import path from "path";

/**
 * Class based on node module upath 1.1.0
 */
export class Upath {
    /**
     * Just converts all `to/` and consolidates duplicates, without performing any normalization.
     *
     * @param p string path to convert to unix.
     */
    public static toUnix(p: string): string {
        const double = "////";
        p = p.replace(/\\/g, "/");
        while (p.match(double)) {
            p = p.replace(double, "/");
        }
        return p;
    }

    /**
     * Join all arguments together and normalize the resulting path.
     * Arguments must be strings.
     *
     * @param paths string paths to join.
     */
    public static join(...p: string[]): string {
        return this.toUnix(path.join(...p.map(this.toUnix)));
    }

    /**
     * Solve the relative path from {from} to {to}.
     * At times we have two absolute paths, and we need to derive the relative path
     * from one to the other. This is actually the reverse transform of path.resolve.
     *
     * @param from
     * @param to
     */
    public static relative(from: string, to: string): string {
        return this.toUnix(path.relative(this.toUnix(from), this.toUnix(to)));
    }

    /**
     * The right-most parameter is considered {to}.  Other parameters are considered an array of {from}.
     *
     * Starting from leftmost {from} paramter, resolves {to} to an absolute path.
     *
     * If {to} isn't already absolute, {from} arguments are prepended in right to left order, until an
     * absolute path is found. If after using all {from} paths still no absolute path is found, the
     * current working directory is used as well. The resulting path is normalized, and trailing slashes
     * are removed unless the path gets resolved to the root directory.
     *
     * @param pathSegments string paths to join.
     */
    public static resolve(...pathSegments: string[]): string {
        return this.toUnix(path.resolve(...pathSegments.map(this.toUnix)));
    }

    /**
     * Exactly like path.normalize(path), but it keeps the first meaningful ./.
     *
     * Note that the unix / is returned everywhere, so windows \ is always converted to unix /.
     *
     * @param p string path to normalize.
     */
    public static normalize(p: string): string {
        return this.toUnix(path.normalize(this.toUnix(p)));
    }

    /**
     * Return the directory name of a path. Similar to the Unix dirname command.
     *
     * @param p the path to evaluate.
     */
    public static dirname(p: string): string {
        return this.toUnix(path.dirname(this.toUnix(p)));
    }
}

export default Upath;