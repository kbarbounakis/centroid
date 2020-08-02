// MOST Web Framework Centroid for Deno Copyright (c) 2020,
// THEMOST LP All rights reserved BSD-3-Clause license

/**
 * @param {*} any
 * @param {Function} ctor
 * @returns {boolean}
 */
export function instanceOf(any: any, ctor: any) {
    // validate constructor
    if (typeof ctor !== 'function') {
        return false
    }
    // validate with instanceof
    if (any instanceof ctor) {
        return true;
    }
    return !!(any && any.constructor && any.constructor.name === ctor.name);
}

