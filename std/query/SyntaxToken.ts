// MOST Web Framework Centroid for Deno Copyright (c) 2020,
// THEMOST LP All rights reserved BSD-3-Clause license
import {Token} from './Token.ts';
/**
 * @class
 * @param {String} chr
 * @constructor
 */
export class SyntaxToken extends Token {

    static get ParenOpen() {
        return new SyntaxToken('(');
    }

    static get ParenClose() {
        return new SyntaxToken(')');
    }

    static get Slash() {
        return new SyntaxToken('/');
    }

    static get Comma() {
        return new SyntaxToken(',');
    }
    
    static get Negative() {
        return new SyntaxToken('-');
    }
    
    constructor(chr: string) {
        super(Token.TokenType.Syntax);
        this.syntax = chr;
    }

    valueOf() {
        return this.syntax;
    }
}