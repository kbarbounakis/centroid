// MOST Web Framework Centroid for Deno Copyright (c) 2020,
// THEMOST LP All rights reserved BSD-3-Clause license

import {Args} from '../common/mod.ts';
import {hasOwnProperty} from './has-own-property.ts';
import {SqlUtils} from './SqlUtils.ts';
import { PropertyIndexer } from './PropertyIndexer.ts';

export declare interface ODataQueryParams {
    $filter: string;
    $groupby: string;
    $select: string;
    $orderby: string;
    $expand: string;
    $count: boolean;
    $top: number;
    $skip: number;
    $first: boolean;
    $levels: number;
}
// eslint-disable-next-line no-control-regex
const STR_ESCAPE_REGEXP = /[\0\n\r\b\t\\'"\x1a]/g;
// noinspection JSUnusedGlobalSymbols

export class ODataQuery {
    private _params: any;
    private _privates: any;
    private $collection?: string;
    private $prepare: any;
    /**
     * @param {string} collection
     */
    constructor(collection: string) {
        /**
         * @private
         */
        Object.defineProperty(this, '_privates', {
            enumerable: false,
            configurable: true,
            writable: false,
            value: { }
        });
        /**
         * @private
         */
        Object.defineProperty(this, '_params', {
            enumerable: false,
            configurable: true,
            writable: false,
            value: { }
        });
        // set collection
        if (collection != null) {
            Args.notString(collection, 'Collection');
            this.$collection = collection;
        }
    }

    getCollection() {
        return this.$collection;
    }

    toString() {
        Args.check(this.$collection != null, 'Query collection cannot be empty at this context');
        const uri = this.getCollection();
        const params = this.getParams();
        let search = '';
        for (const key in params) {
            if (hasOwnProperty(params, key)) {
                search = search.concat(key, '=', (<PropertyIndexer>params)[key], '&');
            }
        }
        if (search.length && uri != null) {
            return uri.concat('?', search.replace(/&$/, ''));
        }
        return uri;
    }

    // noinspection JSUnusedGlobalSymbols
    toExpand() {
        let collection = this.getCollection();
        const params = this.getParams();
        let search = '';
        for (const key in params) {
            if (hasOwnProperty(params, key)) {
                search = search.concat(key, '=', (<PropertyIndexer>params)[key], ';');
            }
        }
        if (search.length && collection != null) {
            return collection.concat('(', search.replace(/;$/, ''), ')');
        }
        return collection;
    }

    // noinspection JSUnusedGlobalSymbols
    takeNext(n: number) {
        const p = this.getParams();
        return this.take(n).skip((p.$skip ? p.$skip : 0) + n);
    }

    // noinspection JSUnusedGlobalSymbols
    takePrevious(n: number) {
        const p = this.getParams();
        if (p.$skip > 0) {
            if (n <= p.$skip) {
                this.skip(p.$skip - n);
                return this.take(n);
            }
        }
        return this;
    }

    /**
     * @returns {ODataQueryParams}
     */
    getParams(): ODataQueryParams {
        if (typeof this.$prepare === 'string' && this.$prepare.length) {
            if (typeof this._params.$filter === 'string' && this._params.$filter) {
                return Object.assign({},
                    this._params,
                    {
                        $filter: `(${this.$prepare}) and (${this._params.$filter})`
                    });
            } else {
                return Object.assign({}, this._params, {
                    $filter: this.$prepare
                });
            }

        }
        return Object.assign({}, this._params);
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @returns this
     */
    setParam(name: string, value: any) {
        if (/^\$/.test(name)) {
            this._params[name] = value;
        } else {
            this._params['$' + name] = value;
        }
        return this;
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Gets a string which represents the relative URL associated with this object.
     * @returns {string}
     */
    getUrl(): string | undefined {
        return this.getCollection();
    }

    where(name: string) {
        Args.notEmpty(name, 'Left operand');
        this._privates.left = name;
        return this;
    }

    and(name: string) {
        Args.notEmpty(name, 'Left operand');
        this._privates.left = name;
        this._privates.lop = 'and';
        return this;
    }

    // noinspection JSUnusedGlobalSymbols
    andAlso(name: string) {
        Args.notEmpty(name, 'Left operand');
        this._privates.left = name;
        this._privates.lop = 'and';
        if (this._params.$filter != null) {
            this._params.$filter = '(' + this._params.$filter + ')';
        }
        return this;
    }

    or(name: string) {
        Args.notEmpty(name, 'Left operand');
        this._privates.left = name;
        this._privates.lop = 'or';
        return this;
    }

    // noinspection JSUnusedGlobalSymbols
    orElse(name: string) {
        Args.notEmpty(name, 'Left operand');
        this._privates.left = name;
        this._privates.lop = 'or';
        if (this._params.$filter != null) {
            this._params.$filter = '(' + this._params.$filter + ')';
        }
        return this;
    }


    equal(value: any) {
        return this._compare('eq', value);
    }

    notEqual(value: any) {
        return this._compare('ne', value);
    }

    greaterThan(value: any) {
        return this._compare('gt', value);
    }

    greaterOrEqual(value: any) {
        return this._compare('ge', value);
    }

    lowerThan(value: any) {
        return this._compare('lt', value);
    }

    lowerOrEqual(value: any) {
        return this._compare('le', value);
    }

    /**
     * @param {*} value1
     * @param {*} value2
     * @returns this
     */
    between(value1: any, value2: any) {
        Args.notNull(this._privates.left, 'The left operand');
        // generate new filter
        const s = Object.create(this)
            .where(this._privates.left).greaterOrEqual(value1)
            .and(this._privates.left).lowerOrEqual(value2).toFilter();
        this._privates.lop = this._privates.lop || 'and';
        if (this._params.$filter) {
            this._params.$filter = '(' + this._params.$filter + ') ' + this._privates.lop + ' (' + s + ')';
        } else {
            this._params.$filter = '(' + s + ')';
        }
        // clear object
        this._privates.left = null;
        this._privates.op = null;
        this._privates.right = null;
        this._privates.lop = null;
        return this;
    }

    toFilter() {
        return this.getParams().$filter;
    }

    /**
     * @param {string} value
     * @returns {*}
     */
    contains(value: any): any {
        Args.notNull(this._privates.left, 'The left operand');
        this._privates.op = 'ge';
        this._privates.left = `indexof(${this._privates.left},${this._escape(value)})`;
        this._privates.right = 0;
        return this._append();
    }


    getDate() {
        return this._aggregate('date');
    }

    getDay() {
        return this._aggregate('day');
    }

    getMonth() {
        return this._aggregate('month');
    }

    getYear() {
        return this._aggregate('year');
    }

    getFullYear() {
        return this._aggregate('year');
    }

    getHours() {
        return this._aggregate('hour');
    }

    getMinutes() {
        return this._aggregate('minute');
    }

    getSeconds() {
        return this._aggregate('second');
    }

    length() {
        return this._aggregate('length');
    }

    trim() {
        return this._aggregate('trim');
    }

    toLocaleLowerCase() {
        return this._aggregate('tolower');
    }

    toLowerCase() {
        return this._aggregate('tolower');
    }

    toLocaleUpperCase() {
        return this._aggregate('toupper');
    }

    toUpperCase() {
        return this._aggregate('toupper');
    }

    round() {
        return this._aggregate('round');
    }

    floor() {
        return this._aggregate('floor');
    }

    ceil() {
        return this._aggregate('ceiling');
    }

    indexOf(value: any) {
        Args.notNull(this._privates.left, 'The left operand');
        this._privates.left = `indexof(${this._privates.left},${this._escape(value)})`;
        return this;
    }

    substr(pos: number, length: number) {
        Args.notNull(this._privates.left, 'The left operand');
        this._privates.left = `substring(${this._privates.left},${pos},${length})`;
        return this;
    }

    startsWith(s: string) {
        Args.notNull(this._privates.left, 'The left operand');
        this._privates.left = `startswith(${this._privates.left},${this._escape(s)})`;
        return this;
    }

    endsWith(s: string) {
        Args.notNull(this._privates.left, 'The left operand');
        this._privates.left = `endswith(${this._privates.left},${this._escape(s)})`;
        return this;
    }

    select() {
        const args = Array.from(arguments);
        Args.notNull(args, 'Attributes');
        Args.check(args.length > 0, 'Attributes may not be empty');
        const arr = [];
        for (let i = 0; i < args.length; i++) {
            Args.check(typeof args[i] === 'string', 'Invalid attribute. Expected string.');
            arr.push(args[i]);
        }
        this._params.$select = arr.join(',');
        return this;
    }

    groupBy() {
        const args = Array.from(arguments);
        Args.notNull(args, 'Attributes');
        Args.check(args.length > 0, 'Attributes may not be empty');
        const arr = [];
        for (let i = 0; i < args.length; i++) {
            Args.check(typeof args[i] === 'string', 'Invalid attribute. Expected string.');
            arr.push(args[i]);
        }
        this._params.$groupby = arr.join(',');
        return this;
    }

    expand() {
        const args = Array.from(arguments);
        Args.notNull(args, 'Attributes');
        Args.check(args.length > 0, 'Attributes may not be empty');
        const arr = [];
        for (let i = 0; i < args.length; i++) {
            Args.check(typeof args[i] === 'string', 'Invalid attribute. Expected string.');
            arr.push(args[i]);
        }
        this._params.$expand = arr.join(',');
        return this;
    }

    orderBy(attr: any) {
        Args.notEmpty(attr, 'Order by attribute');
        this._params.$orderby = attr.toString();
        return this;
    }

    thenBy(attr: any) {
        Args.notEmpty(attr, 'Order by attribute');
        this._params.$orderby += (this._params.$orderby ? ',' + attr.toString() : attr.toString());
        return this;
    }

    orderByDescending(attr: any) {
        Args.notEmpty(attr, 'Order by attribute');
        this._params.$orderby = attr.toString() + ' desc';
        return this;
    }

    thenByDescending(attr: any) {
        Args.notEmpty(attr, 'Order by attribute');
        this._params.$orderby += (this._params.$orderby ? ',' + attr.toString() : attr.toString()) + ' desc';
        return this;
    }

    skip(num: number) {
        this._params.$skip = num;
        return this;
    }

    take(num: number) {
        this._params.$top = num;
        return this;
    }

    filter(s: string) {
        Args.notEmpty('s', 'Filter expression');
        this._params.$filter = s;
        return this;
    }

    // noinspection JSUnusedGlobalSymbols
    levels(n: number) {
        this._params.$levels = n;
        return this;
    }

    prepare(or?: boolean) {
        const lop = or ? 'or' : 'and';
        if (typeof this._params.$filter === 'string' && this._params.$filter.length) {
            if (typeof this.$prepare === 'string' && this.$prepare.length) {
                this.$prepare = `${this.$prepare} ${lop} ${this._params.$filter}`;
            } else {
                this.$prepare = this._params.$filter;
            }
        }
        delete this._params.$filter;
        return this;
    }

    _aggregate(method: any) {
        Args.notNull(this._privates.left, 'The left operand');
        this._privates.left = `${method}(${this._privates.left})`;
        return this;
    }

    _compare(op: string, value: any) {
        Args.notNull(this._privates.left, 'The left operand');
        this._privates.op = op;
        this._privates.right = value;
        return this._append();
    }

    _append() {
        Args.notNull(this._privates.left, 'Left operand');
        Args.notNull(this._privates.op, 'Comparison operator');
        let expr;
        if (Array.isArray(this._privates.right)) {
            Args.check((this._privates.op === 'eq') || (this._privates.op === 'ne'), 'Wrong operator. Expected equal or not equal');
            Args.check(this._privates.right.length > 0, 'Array may not be empty');
            const arr = this._privates.right.map((x: any) => {
                return this._privates.left + ' ' + this._privates.op + ' ' + this._escape(x);
            });
            if (this._privates.op === 'eq') {
                expr = '(' + arr.join(' or ') + ')';
            } else {
                expr = '(' + arr.join(' or ') + ')';
            }
        } else {
            expr = this._privates.left + ' ' + this._privates.op + ' ' + this._escape(this._privates.right);
        }
        this._privates.lop = this._privates.lop || 'and';
        if (this._params.$filter != null) {
            this._params.$filter = this._params.$filter + ' ' + this._privates.lop + ' ' + expr;
        } else {
            this._params.$filter = expr;
        }
        // clear object
        this._privates.left = null;
        this._privates.op = null;
        this._privates.right = null;
        return this;
    }

    private _escape(val: any): any {
        if ((val == null) || (typeof val === 'undefined')) {
            return 'null';
        }
        if (typeof val === 'boolean') {
            return (val) ? 'true' : 'false';
        }
        if (typeof val === 'number') {
            return val + '';
        }
        if (val instanceof Date) {
            const dt = val;
            const year = dt.getFullYear();
            const month = SqlUtils.zeroPad(dt.getMonth() + 1, 2);
            const day = SqlUtils.zeroPad(dt.getDate(), 2);
            const hour = SqlUtils.zeroPad(dt.getHours(), 2);
            const minute = SqlUtils.zeroPad(dt.getMinutes(), 2);
            const second = SqlUtils.zeroPad(dt.getSeconds(), 2);
            const millisecond = SqlUtils.zeroPad(dt.getMilliseconds(), 3);
            // format timezone
            const offset = (new Date()).getTimezoneOffset();
            const timezone = (offset >= 0 ? '+' : '') + SqlUtils.zeroPad(Math.floor(offset / 60), 2) +
                ':' + SqlUtils.zeroPad(offset % 60, 2);
            return '\'' + year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second + '.' + millisecond + timezone + '\'';
        }
        if (val instanceof Array) {
            const values: any[] = [];
            val.forEach((x) => {
                values.push(this._escape(x));
            });
            return values.join(',');
        }
        if (typeof val === 'string') {
            const res = val.replace(STR_ESCAPE_REGEXP, (s) => {
                switch (s) {
                    case '\0':
                        return '\\0';
                    case '\n':
                        return '\\n';
                    case '\r':
                        return '\\r';
                    case '\b':
                        return '\\b';
                    case '\t':
                        return '\\t';
                    case '\x1a':
                        return '\\Z';
                    default:
                        return '\\' + s;
                }
            });
            return '\'' + res + '\'';
        }
        // otherwise get valueOf
        if (hasOwnProperty(val, '$name')) {
            return val.$name;
        } else {
            return this._escape(val.valueOf());
        }
    }

}