// MOST Web Framework Centroid for Deno Copyright (c) 2020,
// THEMOST LP All rights reserved BSD-3-Clause license
import { Args } from '../common/mod.ts';
import { getOwnPropertyName, isMethodOrNameReference } from "./_utils.ts";
import { PropertyIndexer } from './PropertyIndexer.ts';
/**
 * @class
 * @property {string} name - A string which represents the name of the collection
 * @property {string} alias - A string which represents an alias for the collection
 */
class QueryCollection {
    /**
     * @param {string=} collection
     */
    constructor(collection?: string) {
        if (collection) {
            Object.defineProperty(this, collection, {
                        value: 1,
                        configurable: true,
                        enumerable: true,
                        writable: true
                    });
        }
    }
    /**
     * Returns the name of this collection
     * @returns {*}
     */
    get name() {
        // get first property
        let key = getOwnPropertyName(this);
        Args.notNull(key, 'Collection');
        const thisIndexer = <PropertyIndexer> this;
        if (thisIndexer[key] === 1) {
            // simple collection reference e.g. { "Person": 1 }
            return key;
        }
        if (isMethodOrNameReference(thisIndexer[key])) {
            // collection reference with alias e.g. { "People": "$Person" }
            return thisIndexer[key].substr(1);
        }
        throw new Error('Invalid collection reference.');
    }
    /**
     * Returns the alias of this entity, if any
     * @returns {*}
     */
    get alias() {
        // get first property
        let key = getOwnPropertyName(this);
        Args.notNull(key, 'Collection');
        const thisIndexer = <PropertyIndexer> this;
        if (thisIndexer[key] === 1) {
            // simple collection reference e.g. { "Person": 1 }
            return null;
        }
        if (isMethodOrNameReference(thisIndexer[key])) {
            // collection reference with alias e.g. { "People": "$Person" }
            return key;
        }
        throw new Error('Invalid collection reference.');
    }

    as(alias: string) {
        Args.notString(alias, 'Alias');
        const key = getOwnPropertyName(this);
        Args.notNull(key, 'Collection');
        const thisIndexer = <PropertyIndexer> this;
        // if collection name is a single expression e.g. { "Person": 1 }
        if (thisIndexer[key] === 1) {
            // convert collection reference to { "People": "$Person" }
            Object.defineProperty(this, alias, {
                        value: `$${key}`,
                        configurable: true,
                        enumerable: true,
                        writable: true
                    });
            delete thisIndexer[key];
            return this;
        }
        // check if alias is the same with that already exists
        if (key === alias) {
            return;
        }
        // query entity has already an alias so rename alias
        if (isMethodOrNameReference(thisIndexer[key])) {
            Object.defineProperty(this, alias, {
                        value: `${thisIndexer[key]}`,
                        configurable: true,
                        enumerable: true,
                        writable: true
                    });
            delete thisIndexer[key];
            return this;
        }
        throw new Error('Invalid collection reference.');

    }
    inner() {
        throw new Error('Not yet implemented');
    }
    left() {
        throw new Error('Not yet implemented');
    }
    right() {
        throw new Error('Not yet implemented');
    }
}

export {
    QueryCollection
};