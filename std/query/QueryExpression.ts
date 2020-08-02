// MOST Web Framework Centroid for Deno Copyright (c) 2020,
// THEMOST LP All rights reserved BSD-3-Clause license
import { equal } from "https://deno.land/std/testing/asserts.ts";
import {Args} from '../common/mod.ts';
import { QueryField } from './QueryField.ts';
import { QueryCollection } from './QueryCollection.ts';
import {getOwnPropertyName, isMethodOrNameReference} from './_utils.ts';
import {hasOwnProperty} from './has-own-property.ts';
import { PropertyIndexer } from './PropertyIndexer.ts';

class InvalidLeftOperandError extends Error {
    constructor() {
        super();
        this.message = 'Left operand cannot be null at this context';
    }
}

/**
 * @class
 * @constructor
 */
export class QueryExpression {

    static readonly ComparisonOperators = { $eq:'$eq', $ne:'$ne', $gt:'$gt',$gte:'$gte', $lt:'$lt',$lte:'$lte', $in: '$in', $nin:'$nin' };
    static readonly LogicalOperators = { $or:'$or', $and:'$and', $not:'$not', $nor:'$not' };
    static readonly EvaluationOperators = { $mod:'$mod', $add:'$add', $sub:'$sub', $mul:'$mul', $div:'$div' };


    private privates: any;
    private $collection: any;
    private $count: any;
    private $match: any;
    private $select: any;
    private $insert: any;
    private $update: any;
    private $delete: any;
    private $group: any;
    private $order: any;
    private $addFields: any;
    private $expand: any;
    private $distinct: any;
    private $fixed: any;
    private $prepared: any;
    private $limit: any;
    private $skip: any;

    constructor() {
        /**
         * @private
         */
        Object.defineProperty(this, 'privates', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: {}
        });
    }
    /**
     * Clones the current expression and returns a new QueryExpression object.
     * @example
     * var q = new QueryExpression();
     * //do some stuff
     * //...
     * //clone expression
     * var q1 = q.clone();
     * @returns {QueryExpression}
     */
    clone(): QueryExpression {
        const cloned = JSON.parse(JSON.stringify(this));
        return Object.assign(new QueryExpression(), cloned);
    }
    /**
     * Sets the alias of active expression (collection or field)
     * @param {string} alias
     * @returns {QueryExpression}
     */
    as(alias: string): QueryExpression {
        Args.notNull(alias, 'Alias');
        if (this.privates.lookup) {
            // append as expression to lookup
            this.privates.lookup.as = alias;
            return this;
        }
        if (this.privates.left) {
            this.privates.left.as(alias);
            return this;
        }
        // change collection alias
        Args.notNull(this.$collection != null, 'Target collection');
        // create collection copy
        if (this.$collection instanceof QueryCollection) {
            // set alias and return
            this.$collection.as(alias);
            return this;
        }
        // create collection with alias
        const collection = Object.assign(new QueryCollection(), this.$collection).as(alias);
        // assign collection
        this.$collection = Object.assign({ }, collection);
        // and return
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Gets a boolean value that indicates whether query expression has a where statement or not.
     * @returns {boolean}
     */
    hasFilter(): boolean {
        return this.$match != null;
    }
    /**
     * @param {boolean=} useOr
     * @returns {QueryExpression}
     */
    prepare(useOr?: boolean): QueryExpression {
        if (typeof this.$match === 'object') {
            if (typeof this.$prepared === 'object') {
                let preparedWhere = {};
                if (useOr)
                    preparedWhere = { $or: [this.$prepared, this.$match] };
                else
                    preparedWhere = { $and: [this.$prepared, this.$match] };
                this.$prepared = preparedWhere;
            }
            else {
                this.$prepared = this.$match;
            }
            delete this.$match;
        }
        return this;
    }
    /**
     * Gets a boolean value that indicates whether query expression has fields or not.
     * @returns {boolean}
     */
    hasFields(): boolean {
        return this.$select != null;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Gets a boolean value that indicates whether query expression has paging or not.
     * @returns {boolean}
     */
    hasLimit(): boolean {
        return typeof this.$limit === 'number' && this.$limit > 0;
    }
    /**
     * @param {Boolean=} value
     * @returns {QueryExpression}
     */
    distinct(value?: boolean): QueryExpression {
        if (typeof value === 'undefined') {
            this.$distinct = true;
        }
        else {
            this.$distinct = value || false;
        }
        return this;
    }
    /**
     * @param {Boolean=} value
     * @returns {QueryExpression}
     */
    fixed(value?: boolean): QueryExpression {
        if (typeof value === 'undefined') {
            this.$fixed = true;
        }
        else {
            this.$fixed = value || false;
        }
        return this;
    }
    /**
     * Prepares an aggregated query which is going to count records by specifying the alias of the count attribute
     * @param {string=} alias
     * @returns {QueryExpression}
     */
    count(alias?: string): QueryExpression {
        if (alias == null) {
            this.$count = 'total';
        }
        else {
            this.$count = alias;
        }
        return this;
    }
    /**
     * Starts a comparison expression by assigning left operand
     * @param {*} expr
     * @param {*=} params
     * @returns {QueryExpression}
     */
    where(expr: any, params?: any): QueryExpression {
        // set left operand
        this._where(expr);
        // clear where expression
        delete this.$match;
        // and finally return this;
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Injects the given filter expression into the current query expression
     * @param {*} where - An object that represents a filter expression
     * @returns {QueryExpression}
     */
    injectWhere(where: any): QueryExpression {
        if (where == null)
            return this;
        this.$match = where;
        return this;
    }
    /**
     * Initializes a delete query and sets the entity name that is going to be used in this query.
     * @param {string} collection
     * @returns {QueryExpression}
     */
    delete(collection: string): QueryExpression {
        Args.check(this.$insert != null, new Error('Items to insert must be defined. Use insert() method first.'));
        Args.notString(collection, 'Target collection');
        // clear collection
        this.$collection = { };
        Object.defineProperty(this.$collection, collection, {
                        value: 1,
                        configurable: true,
                        enumerable: true,
                        writable: true
                    });
        this.$delete = { };
        //delete other properties (if any)
        delete this.$insert;
        delete this.$select;
        delete this.$addFields;
        if (this.privates) {
            delete this.privates.lookup;
        }
        delete this.$update;
        return this;
    }
    /**
     * Initializes an insert query and sets the object that is going to be inserted.
     * @param {*} any
     * @returns {QueryExpression}
     */
    insert(any: any): QueryExpression {
        if (Array.isArray(any)) {
            return this.insertMany(any);
        }
        return this.insertOne(any);
    }

    /**
     * Prepares an insert query and sets the object that is going to be inserted.
     * @param {*} any
     * @returns {QueryExpression}
     */
    insertOne(any: any): QueryExpression {
        Args.notNull(any, 'Item for insert');
        // check that argument is not an array
        Args.check(Array.isArray(any) === false, new Error('Item for insert cannot be an array. Use insertMany() instead.'));
        // check that argument is not an array
        Args.check( any === Object(any), new Error('Item for insert must be an object.'));
        // set object
        this.$insert = any;
        //clear object
        delete this.$delete;
        delete this.$select;
        delete this.$addFields;
        if (this.privates) {
            delete this.privates.lookup;
        }
        delete this.$order;
        delete this.$group;
        delete this.$update;
        // and finally return
        return this;

    }

    /**
     * Prepares an insert query and sets an array of objects that are going to be inserted.
     * @param {*} any
     * @returns {QueryExpression}
     */
    insertMany(any: any): QueryExpression {
        Args.notNull(any, 'Items for insert');
        // check that argument is not an array
        Args.check(Array.isArray(any), new Error('Items for insert must be an array'));
        // set object
        this.$insert = any;
        //clear objects
        delete this.$delete;
        delete this.$select;
        delete this.$addFields;
        if (this.privates) {
            delete this.privates.lookup;
        }
        delete this.$order;
        delete this.$group;
        delete this.$update;
        return this;
    }

    /**
     * Defines the target collection that is going to be used in an insert query operation.
     * @param {*} collection
     */
    into(collection: string) {
        Args.check(this.$insert != null, new Error('Items to insert must be defined. Use insert() method first.'));
        Args.notString(collection, 'Target collection');
        // clear collection
        this.$collection = { };
        Object.defineProperty(this.$collection, collection, {
                        value: 1,
                        configurable: true,
                        enumerable: true,
                        writable: true
                    });
        return this;
    }
    /**
     * Initializes an update query and sets the entity name that is going to be used in this query.
     * @param {string} collection
     * @returns {QueryExpression}
     */
    update(collection: string): QueryExpression {
        Args.notString(collection, 'Collection');
        // clear collection
        this.$collection = { };
        Object.defineProperty(this.$collection, collection, {
                        value: 1,
                        configurable: true,
                        enumerable: true,
                        writable: true
                    });
        //cleanup
        delete this.$delete;
        delete this.$select;
        if (this.privates) {
            delete this.privates.lookup;
        }
        delete this.$addFields;
        delete this.$insert;
        delete this.$group;
        delete this.$order;
        return this;
    }
    /**
     * Sets the object that is going to be updated through an update expression.
     * @param {*} any
     * @returns {QueryExpression}
     */
    set(any: any): QueryExpression {
        // check collection
        Args.check(this.$collection != null, new Error('Target collection must be defined. Use update() method first.'));
        // check argument
        Args.notNull(any, 'Item for update');
        // check that argument is not an array
        Args.check(Array.isArray(any) === false, new Error('Item for update cannot be an array.'));
        // check that argument is not an array
        Args.check( any === Object(any), new Error('Item for update must be an object.'));
        // set object
        this.$update = any;
        return this;
    }
    /**
     * Prepares a select statement expression
     */
    select(...arg: any) {
        // cleanup
        delete this.$delete;
        delete this.$insert;
        delete this.$update;
        // get argument
        let args = arg;
        if (args.length === 0) {
            this.$select = { };
            return this;
        }
        // map arguments to query fields
        this.$select = args.filter( (x: any) => x!= null ).map( (x: any) => {
            if (typeof x === 'string') {
                return new QueryField(x);
            }
            if (x instanceof QueryField) {
                return x;
            }
            return Object.assign(new QueryField(), x);
        }).reduce( (obj: any, value: any) => {
            return Object.assign({ }, obj, value);
        });
        return this;
    }
    /**
     * Sets the collection of a select query expression
     * @param {*} collection
     * @returns {QueryExpression}
     */
    from(collection: any): QueryExpression {
        // Args.check(this.$select != null, new Error('Items to select must be defined. Use select() method first.'));
        Args.check( Array.isArray(collection) === false, new Error('Target collection cannot be an array.'));
        // clear collection
        this.$collection = { };
        if (typeof collection === 'string') {
            Object.defineProperty(this.$collection, collection, {
                        value: 1,
                        configurable: true,
                        enumerable: true,
                        writable: true
                    });
        }
        else {
            Args.check( collection === Object(collection), new Error('Target collection must be a string or an object.'));
            // assign collection
            Object.assign(this.$collection, collection);
        }
        //clear object
        if (this.privates) {
            delete this.privates.lookup;
        }
        delete this.$delete;
        delete this.$insert;
        delete this.$update;
        //and return
        return this;
    }
    /**
     * Initializes a join expression with the specified collection
     * @param {*} collectionOrQuery - The collection to be used in join expression.
     * @returns {QueryExpression}
     */
    join(collectionOrQuery: any): QueryExpression {
        Args.check(collectionOrQuery != null, new Error('Join collection cannot be empty'));
        Args.check(Array.isArray(collectionOrQuery) === false, new Error('Join collection cannot be an array'));
        // if collection is a string
        this.privates.lookup = { };
        if (typeof collectionOrQuery === 'string') {
            this.privates.lookup.from = collectionOrQuery;
        }
        else {
            let queryCollection;
            if (hasOwnProperty(collectionOrQuery, '$collection')) {
                // collectionOrQuery is a query expression
                queryCollection = Object.assign(new QueryCollection(), collectionOrQuery.$collection);
                this.privates.lookup.from = queryCollection.name;
                if (queryCollection.alias) {
                    this.privates.lookup.as = queryCollection.alias;
                }
                this.privates.lookup.pipeline = {
                    $match: collectionOrQuery.$match,
                    $project: collectionOrQuery.$select
                };
                // add lookup to expand
                this.$expand = this.$expand || [];
                this.$expand.push({
                    $lookup: this.privates.lookup
                });
                //destroy temp object
                delete this.privates.lookup;
                //and return QueryExpression
                return this;
            }
            // try to convert collection to QueryCollection instance
            queryCollection = Object.assign(new QueryCollection(), collectionOrQuery);
            const name = queryCollection.name;
            // validate query collection name
            Args.notString(name, 'Query collection name');
            this.privates.lookup.from = name;
            // check if collection has an alias
            const alias = queryCollection.alias;
            if (alias) {
                this.privates.lookup.as = alias;
            }
        }
        return this;
    }
    /**
     * Sets a join equality expression by defining a local and a foreign field
     * @param {*} localField - The field from current collection
     * @param {*} foreignField - The field from joined collection
     * @returns {QueryExpression}
     */
    with(localField: any, foreignField: any): QueryExpression {
        Args.check(this.privates.lookup != null, new Error('Join collection cannot be empty. Use join(collection) first.'));
        // set local and foreign field
        this.privates.lookup.localField = localField;
        this.privates.lookup.foreignField = foreignField;
        // add lookup to expand
        this.$expand = this.$expand || [];
        this.$expand.push({
            $lookup: this.privates.lookup
        });
        //destroy temp object
        delete this.privates.lookup;
        //and return QueryExpression
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Applies an ascending ordering to a query expression
     * @returns {QueryExpression}
     */
    orderBy(...arg: any): QueryExpression {
        // get arguments
        let args = arg;
        if (args.length === 0) {
            return this;
        }
        // map arguments to query fields
        this.$order = args.filter( (x: any) => x!= null ).map( (x: any) => {
            // get field expression and try to add it in $addFields collection
            // if it's a complex expression
            const addField = this._testAddField(x);
            const result = { };
            // set property result
            Object.defineProperty(result, addField, {
                value: -1,
                configurable: true,
                enumerable: true,
                writable: true
            });
            return result;
        }).reduce( (obj: any, value: any) => {
            return Object.assign({ }, obj, value);
        });
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Applies a descending ordering to a query expression
     * @returns {QueryExpression}
     */
    orderByDescending(...arg: any): QueryExpression {
        // get arguments
        let args = arg;
        if (args.length === 0) {
            return this;
        }
        // map arguments to query fields
        this.$order = args.filter( (x: any) => x!= null ).map( (x: any) => {
            // get field expression and try to add it in $addFields collection
            // if it's a complex expression
            const addField = this._testAddField(x);
            const result = { };
            // set property result
            Object.defineProperty(result, addField, {
                value: 1,
                configurable: true,
                enumerable: true,
                writable: true
            });
            return result;
        }).reduce( (obj: any, value: any) => {
            return Object.assign({ }, obj, value);
        });
        return this;
    }
    /**
     * Performs a subsequent ordering in a query expression
     * @returns {QueryExpression}
     */
    thenBy(...arg: any): QueryExpression {
        Args.notNull(this.$order, 'Order expression is empty. Use orderBy() or orderByDescending() method first.');
        // get arguments
        let args = arg;
        if (args.length === 0) {
            return this;
        }
        // map arguments to query fields
        const addOrder = args.filter( (x: any) => x!= null ).map( (x: any) => {
            // get field expression and try to add it in $addFields collection
            // if it's a complex expression
            const addField = this._testAddField(x);
            const result = { };
            // set property result
            Object.defineProperty(result, addField, {
                value: -1,
                configurable: true,
                enumerable: true,
                writable: true
            });
            return result;
        }).reduce( (obj: any, value: any) => {
            return Object.assign({ }, obj, value);
        });
        Object.assign(this.$order, addOrder);
        return this;
    }
    /**
     * Performs a subsequent ordering in a query expression
     * @returns {QueryExpression}
     */
    thenByDescending(...arg: any): QueryExpression {
        Args.notNull(this.$order, 'Order expression is empty. Use orderBy() or orderByDescending() method first.');
        // get arguments
        let args = arg;
        if (args.length === 0) {
            return this;
        }
        // map arguments to query fields
        const addOrder = args.filter( (x: any) => x!= null ).map( (x: any) => {
            // get field expression and try to add it in $addFields collection
            // if it's a complex expression
            const addField = this._testAddField(x);
            const result = { };
            // set property result
            Object.defineProperty(result, addField, {
                value: 1,
                configurable: true,
                enumerable: true,
                writable: true
            });
            return result;
        }).reduce( (obj: any, value: any) => {
            return Object.assign({ }, obj, value);
        });
        Object.assign(this.$order, addOrder);
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     *
     * @param {...*} arg
     * @returns {QueryExpression}
     */
    /* eslint-disable-next-line no-unused-vars */
    groupBy(...arg: any): QueryExpression {
        // get arguments
        let args = arg;
        if (args.length === 0) {
            return this;
        }
        // map arguments to query fields
        this.$group = args.filter( (x: any) => x!= null ).map( (x: any) => {
            if (typeof x === 'string') {
                return new QueryField(x);
            }
            if (x instanceof QueryField) {
                return x;
            }
            return Object.assign(new QueryField(), x);
        }).reduce( (obj: any, value: any) => {
            return Object.assign({ }, obj, value);
        });
        return this;
    }
    /**
     * Helper function for setting in-process left operand
     * @param {*} field
     * @returns this
     * @private
     */
    _where(field: any) {
        if (field == null) {
            throw new Error('Left operand cannot be empty. Expected string or object.');
        }
        if (typeof field === 'string') {
            // set left operand
            this.privates.left = new QueryField(field);
        }
        else if (typeof field === 'object') {
            // if field is an instance of query field
            if (field instanceof QueryField) {
                // set left operand
                this.privates.left = field;
            }
            else {
                // otherwise convert object to query field
                this.privates.left = Object.assign(new QueryField(), field);
            }
        }
        else {
            throw new Error('Invalid left operand. Expected string or object.');
        }
        return this;
    }
    /**
     * @param {*} right
     * @private
     * @returns QueryExpression
     */
    _append(right: any) {
        let filter: PropertyIndexer = { };
        Args.notNull(right, 'Right operand');
        // get left operand
        let left = this.privates.left;
        // validate left operand
        Args.notNull(left, 'Left operand');
        // get left operand (query field) name e.g. "name" or $concat etc
        const name = getOwnPropertyName(left);
        Args.notNull(name, 'Left operand name');
        // validate if left operand is a method reference
        const isMethod = isMethodOrNameReference(name);
        if (isMethod) {
            let alias;
            // generate an alias for left operand
            this.$addFields = this.$addFields || { };
            const addField = Object.assign({}, left);
            // search addFields collection
            alias = Object.keys(this.$addFields).find( key => {
                return equal(addField, this.$addFields[key]);
            });
            if (alias == null) {
                // get alias
                alias = `${name.replace(/\$/,'')}${Object.keys(this.$addFields).length + 1}`;
                // add field to $addFields collection
                Object.defineProperty(this.$addFields, alias, {
                        value: addField,
                        configurable: true,
                        enumerable: true,
                        writable: true
                    });
            }
            // set filter expression
            filter[alias] = right;

        } else  {
            const leftIndexer = <PropertyIndexer>left;
            // check if left operand is a single field expression (e.g { "dateCreated": 1 })
            if (leftIndexer[name] === 1 || leftIndexer[name] === 0) {
            // format expression e.g. { "price": { $eq: 500 } }
                filter[name] = right;
            }
            else {
                // [name] is an alias (e.g. { "createdAt" : "$dateCreated" } )
                // so add field to $addFields collection
                this.$addFields = this.$addFields || { };
                Object.defineProperty(this.$addFields, name, {
                    value: left[name],
                    configurable: true,
                    enumerable: true,
                    writable: true
                });
                filter[name] = right;
            }
        }

        if (this.$match == null) {
            this.$match = filter;
        }
        else {
            // get in-process logical operator
            const logicalOperator = this.privates.logicalOperator || '$and';
            //get where expression current operator
            const currentOperator = getOwnPropertyName(this.$match);
            if (currentOperator === logicalOperator) {
                // push filter expression
                this.$match[logicalOperator].push(filter);
            }
            else {
                // merge $match expression and current filter expression
                const newFilter: PropertyIndexer = { };
                newFilter[logicalOperator] = [ this.$match, filter ];
                // set new filter
                this.$match = newFilter;
            }
        }
        delete this.privates.left;
        delete this.privates.expression;
        return this;
    }

    /**
     * @private
     * @param {*} field
     * @returns {string|*}
     */
    _testAddField(field: any): string | any {
        if (field == null) {
            return;
        }
        if (typeof field === 'string') {
            // do nothing
            return field;
        }
        // get field property
        let name = getOwnPropertyName(field);
        // get field expression
        let addField = Object.assign({ }, field);
        // field expression is a method reference { "$year": "dateCreated" }
        if (isMethodOrNameReference(name)) {
            // search if expression graph already exists
            this.$addFields = this.$addFields || { };
            let alias = Object.keys(this.$addFields).find( key => {
                return equal(addField, this.$addFields[key]);
            });
            if (alias == null) {
                // get alias
                // todo: validate alias index e.g. year1, year2 etc by searching $addFields collection
                alias = `${name.replace(/\$/,'')}${Object.keys(this.$addFields).length + 1}`;
                // add field to $addFields collection
                Object.defineProperty(this.$addFields, alias, {
                        value: addField,
                        configurable: true,
                        enumerable: true,
                        writable: true
                    });
                return alias;
            }
        }
        else {
            if (addField[name] === 1 || addField[name] === 0) {
                // expression is simple e.g. { "dateCreated": 1 }
                // do nothing
                return addField[name];
            }
            // else try to add field expression
            // e.g. { "yearCreated": { "$year": "$dateCreated" } }
            this.$addFields = this.$addFields || { };
            Object.defineProperty(this.$addFields, name, {
                    value: addField,
                    configurable: true,
                    enumerable: true,
                    writable: true
                });
            return name;
        }

    }

    /**
     * @param {*} where
     * @param {*=} addFields
     *
     */
    _concat(where: any, addFields?: any) {
        if (this.$match == null) {
            this.$match = where;
        }
        else {
            // set in-process logical operator
            const logicalOperator ='$and';
            //get where expression current operator
            const currentOperator = getOwnPropertyName(this.$match);
            if (currentOperator === logicalOperator) {
                // push filter expression
                this.$match[logicalOperator].push(where);
            }
            else {
                // merge $match expression and current filter expression
                const newFilter: PropertyIndexer = { };
                newFilter[logicalOperator] = [ this.$match, where ];
                // set new filter
                this.$match = newFilter;
            }
        }
        // add fields
        if (addFields) {
            // ensure $addFields collection
            this.$addFields = this.$addFields || { };
            // add fields
            Object.assign(this.$addFields, addFields);
        }
        return this;
    }

    /**
     * @param {*} field
     * @returns {QueryExpression}
     */
    or(field: any): QueryExpression {
        // set left operand
        this._where(field);
        // set in-process logical operator
        this.privates.logicalOperator = '$or';
        return this;
    }
    /**
     * @param {*} field
     * @returns {QueryExpression}
     */
    and(field: any): QueryExpression {
        // set left operand
        this._where(field);
        // set in-process logical operator
        this.privates.logicalOperator = '$and';
        // and finally return this
        return this;
    }
    /**
     * Prepares an equal expression.
     * @param {*} value - A value that represents the right part of the prepared expression
     * @returns {QueryExpression}
     */
    equal(value: any): QueryExpression {
        return this._append({ $eq: value });
    }

    eq(value: any): QueryExpression {
        return this.equal(value);
    }

    /**
     * Prepares a not equal expression.
     * @param {*} value - A value that represents the right part of the prepared expression
     * @returns {QueryExpression}
     */
    notEqual(value: any): QueryExpression {
        return this._append({ $ne: value });
    }

    ne(value: any) {
        return this.notEqual(value);
    }

    /**
     * Prepares an in statement expression
     * @param {Array} values - An array of values that represents the right part of the prepared expression
     * @returns {QueryExpression}
     */
    in(values: any[]): QueryExpression {
        return this._append({ $in: values });
    }
    /**
     * Prepares a not in statement expression
     * @param {Array} values - An array of values that represents the right part of the prepared expression
     * @returns {QueryExpression}
     */
    notIn(values: any[]): QueryExpression {
        return this._append({ $nin: values });
    }
    /**
     * @param {*} value The value to be compared
     * @returns {QueryExpression}
     */
    mod(value: any): QueryExpression {
        Args.check(this.privates.left instanceof QueryField, new InvalidLeftOperandError());
        this.privates.left.mod(value);
        return this;
    }
    /**
     * @param {*} value The value to be compared
     * @returns {QueryExpression}
     */
    bit(value: any): QueryExpression {
        return this.mod(value);
    }
    /**
     * @param value {*}
     * @returns {QueryExpression}
     */
    greaterThan(value: any): QueryExpression {
        return this._append({ '$gt': value });
    }

    gt(value: any): QueryExpression {
        return this.greaterThan(value);
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @param {*} value
     * @returns {QueryExpression}
     */
    startsWith(value: any): QueryExpression {
        return this._append({ $regex: '^' + value, $options: 'i' });
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * @param {*} value
     * @returns {QueryExpression}
     */
    endsWith(value: any): QueryExpression {
        return this._append({ $regex: value + '$', $options: 'i' });
    }
    /**
     * Prepares a contains expression.
     * @param  {*} value - A value that represents the right part of the expression
     * @returns {QueryExpression}
     */
    contains(value: any): QueryExpression {
        return this._append({ $text: { $search: value } });
    }
    /**
     * Prepares a contain expression.
     * @param  {*} value - A value that represents the right part of the expression
     * @returns {QueryExpression}
     */
    includes(value: any): QueryExpression {
        return this._append({ $text: { $search: value } });
    }
    notContains(value: any): QueryExpression {
        return this._append({ $not: { $text: { $search: value } } });
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * @param value {*}
     * @returns {QueryExpression}
     */
    lowerThan(value: any): QueryExpression {
        return this._append({ '$lt': value });
    }

    /**
     *
     * @param value
     * @returns {QueryExpression}
     */
    lt(value: any): QueryExpression {
        return this.lowerThan(value);
    }

    /**
     * @param value {*}
     * @returns {QueryExpression}
     */
    lowerOrEqual(value: any): QueryExpression {
        return this._append({ '$lte': value });
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     *
     * @param {*} value
     * @returns {QueryExpression}
     */
    lte(value: any): QueryExpression {
        return this.lowerOrEqual(value);
    }

    /**
     * @param value {*}
     * @returns {QueryExpression}
     */
    greaterOrEqual(value: any): QueryExpression {
        return this._append({ '$gte': value });
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     *
     * @param {*} value
     * @returns {QueryExpression}
     */
    gte(value: any): QueryExpression {
        return this.greaterOrEqual(value);
    }

    /**
     * @param {*} value1
     * @param {*} value2
     * @returns {QueryExpression}
     */
    between(value1: any, value2: any): QueryExpression {
        // validate left operand
        Args.check(this.privates.left instanceof QueryField, new InvalidLeftOperandError());
        // create new query expression
        const q = new QueryExpression();
        q.where(this.privates.left).greaterOrEqual(value1).and(this.privates.left).lowerOrEqual(value2);
        return this._concat(q.$match, q.$addFields);
    }
    /**
     * Skips the specified number of objects during select.
     * @param {Number} n
     * @returns {QueryExpression}
     */
    skip(n: number): QueryExpression {
        this.$skip = isNaN(n) ? 0 : n;
        return this;
    }
    /**
     * Takes the specified number of objects during select.
     * @param {Number} n
     * @returns {QueryExpression}
     */
    take(n: number): QueryExpression {
        this.$limit = isNaN(n) ? 0 : n;
        return this;
    }
    /**
     * @private
     * @param {number|*} number
     * @param {number} length
     * @returns {*}
     */
    static zeroPad(number: number | any, length: number): any {
        number = number || 0;
        let res = number.toString();
        while (res.length < length) {
            res = '0' + res;
        }
        return res;
    }
    /**
     * @param {*} x
     * @returns {QueryExpression}
     */
    add(x: any): QueryExpression {
        Args.check(this.privates.left instanceof QueryField, new InvalidLeftOperandError());
        this.privates.left.add(x);
        return this;
    }
    /**
     * @param {*} x
     * @returns {QueryExpression}
     */
    subtract(x: any): QueryExpression {
        Args.check(this.privates.left instanceof QueryField, new InvalidLeftOperandError());
        this.privates.left.subtract(x);
        return this;
    }
    /**
     * @param {*} x
     * @returns {QueryExpression}
     */
    multiply(x: any): QueryExpression {
        Args.check(this.privates.left instanceof QueryField, new InvalidLeftOperandError());
        this.privates.left.multiply(x);
        return this;
    }
    /**
     * @param {*} x
     * @returns {QueryExpression}
     */
    divide(x: any): QueryExpression {
        Args.check(this.privates.left instanceof QueryField, new InvalidLeftOperandError());
        this.privates.left.divide(x);
        return this;
    }
    /**
     * @param {*=} n
     * @returns {QueryExpression}
     */
    round(n?: any): QueryExpression {
        Args.check(this.privates.left instanceof QueryField, new InvalidLeftOperandError());
        this.privates.left.round(n);
        return this;
    }
    /**
     * @param {number} start
     * @param {number=} length
     * @returns {QueryExpression}
     */
    substr(start: number, length?: number): QueryExpression {
        Args.check(this.privates.left instanceof QueryField, new InvalidLeftOperandError());
        this.privates.left.substr(start, length);
        return this;
    }
    /**
     * @param {any} x
     * @param {any=} start
     * @returns {QueryExpression}
     */
    indexOf(x: any, start?: any): QueryExpression {
        Args.check(this.privates.left instanceof QueryField, new InvalidLeftOperandError());
        this.privates.left.indexOf(x, start);
        return this;
    }
    /**
     * @returns {QueryExpression}
     */
    concat(...arg: any): QueryExpression {
        Args.check(this.privates.left instanceof QueryField, new InvalidLeftOperandError());
        const args = arg;
        this.privates.left.concat.apply(this.privates.left, args);
        return this;
    }
    /**
     * @returns {QueryExpression}
     */
    trim(): QueryExpression {
        Args.check(this.privates.left instanceof QueryField, new InvalidLeftOperandError());
        this.privates.left.trim();
        return this;
    }
    /**
     * @returns {QueryExpression}
     */
    length(): QueryExpression {
        Args.check(this.privates.left instanceof QueryField, new InvalidLeftOperandError());
        this.privates.left.length();
        return this;
    }
    /**
     * @returns {QueryExpression}
     */
    getDate(): QueryExpression {
        Args.check(this.privates.left instanceof QueryField, new InvalidLeftOperandError());
        this.privates.left.getDate();
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * @returns {QueryExpression}
     */
    toDate(): QueryExpression {
        Args.check(this.privates.left instanceof QueryField, new InvalidLeftOperandError());
        this.privates.left.toDate();
        return this;
    }
    /**
     * @returns {QueryExpression}
     */
    getYear(): QueryExpression {
        Args.check(this.privates.left instanceof QueryField, new InvalidLeftOperandError());
        this.privates.left.getYear();
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * @returns {QueryExpression}
     */
    getMonth(): QueryExpression {
        Args.check(this.privates.left instanceof QueryField, new InvalidLeftOperandError());
        this.privates.left.getMonth();
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * @returns {QueryExpression}
     */
    getDay(): QueryExpression {
        Args.check(this.privates.left instanceof QueryField, new InvalidLeftOperandError());
        this.privates.left.getDay();
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * @returns {QueryExpression}
     */
    getHours(): QueryExpression {
        Args.check(this.privates.left instanceof QueryField, new InvalidLeftOperandError());
        this.privates.left.getHours();
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * @returns {QueryExpression}
     */
    getMinutes(): QueryExpression {
        Args.check(this.privates.left instanceof QueryField, new InvalidLeftOperandError());
        this.privates.left.getMinutes();
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * @returns {QueryExpression}
     */
    getSeconds(): QueryExpression {
        Args.check(this.privates.left instanceof QueryField, new InvalidLeftOperandError());
        this.privates.left.getSeconds();
        return this;
    }
    /**
     * @returns {QueryExpression}
     */
    floor(): QueryExpression {
        Args.check(this.privates.left instanceof QueryField, new InvalidLeftOperandError());
        this.privates.left.floor();
        return this;
    }
    /**
     * @returns {QueryExpression}
     */
    ceil(): QueryExpression {
        Args.check(this.privates.left instanceof QueryField, new InvalidLeftOperandError());
        this.privates.left.ceil();
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * @returns {QueryExpression}
     */
    toLowerCase(): QueryExpression {
        Args.check(this.privates.left instanceof QueryField, new InvalidLeftOperandError());
        this.privates.left.toLowerCase();
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * @returns {QueryExpression}
     */
    toLocaleLowerCase(): QueryExpression {
        Args.check(this.privates.left instanceof QueryField, new InvalidLeftOperandError());
        this.privates.left.toLocaleLowerCase();
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * @returns {QueryExpression}
     */
    toUpperCase(): QueryExpression {
        Args.check(this.privates.left instanceof QueryField, new InvalidLeftOperandError());
        this.privates.left.toUpperCase();
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * @returns {QueryExpression}
     */
    toLocaleUpperCase(): QueryExpression {
        Args.check(this.privates.left instanceof QueryField, new InvalidLeftOperandError());
        this.privates.left.toLocaleUpperCase();
        return this;
    }
    // noinspection JSUnusedGlobalSymbols

    static escape(val: any): string {
        if (val == null) {
            return 'null';
        }
        switch (typeof val) {
            case 'boolean': return (val) ? 'true' : 'false';
            case 'number': return val + '';
        }
        if (val instanceof Date) {
            const dt = new Date(val);
            const year = dt.getFullYear();
            const month = QueryExpression.zeroPad(dt.getMonth() + 1, 2);
            const day = QueryExpression.zeroPad(dt.getDate(), 2);
            const hour = QueryExpression.zeroPad(dt.getHours(), 2);
            const minute = QueryExpression.zeroPad(dt.getMinutes(), 2);
            const second = QueryExpression.zeroPad(dt.getSeconds(), 2);
            const millisecond = QueryExpression.zeroPad(dt.getMilliseconds(), 3);
            val = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second + '.' + millisecond;
        }
        if (Array.isArray(val)) {
            return val.map( x => {
                QueryExpression.escape(x);
            }).join(', ');
        }
        if (typeof val === 'object') {
            if (hasOwnProperty(val, '$name'))
                //return field identifier
                return val['$name'];
            else
                return this.escape(val.valueOf());
        }
        // eslint-disable-next-line no-control-regex
        val = val.replace(/[\0\n\r\b\t\\'"\x1a]/g, (s: any) => {
            switch (s) {
                case "\0": return "\\0";
                case "\n": return "\\n";
                case "\r": return "\\r";
                case "\b": return "\\b";
                case "\t": return "\\t";
                case "\x1a": return "\\Z";
                default: return "\\" + s;
            }
        });
        return "'" + val + "'";
    }


}