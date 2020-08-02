// MOST Web Framework Centroid for Deno Copyright (c) 2020,
// THEMOST LP All rights reserved BSD-3-Clause license
export function hasOwnProperty(any: any, name: string) {
    return Object.prototype.hasOwnProperty.call(any, name);
}