// MOST Web Framework Centroid for Deno Copyright (c) 2020,
// THEMOST LP All rights reserved BSD-3-Clause license
import {Token} from "./Token.ts";
/**
 * @class IdentifierToken
 * @param {string} name The identifier's name
 * @constructor
 */
export class IdentifierToken extends Token {
    public identifier: string;
    constructor(name: string) {
        super(Token.TokenType.Identifier);
        this.identifier = name;
    }

    valueOf() {
        return this.identifier;
    }
}
