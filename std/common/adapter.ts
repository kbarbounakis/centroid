
export declare interface AdapterTableColumn {
    name: string,
    ordinal: number,
    type: string,
    size?: number;
    scale?: number;
    nullable?: boolean,
    primary?: boolean
}

export declare interface AdapterExecuteCallback {
    ( error?: any, result?: any ) : void;
}
export declare interface TransactionFunctionCallback {
    ( error?: any ) : void;
}

export declare interface TransactionFunction {
    () : Promise<any>;
}

export declare interface ExistsCallback {
    ( error?: any, result?: boolean ) : void;
}

export declare interface HasSequenceCallback {
    ( error?: any, result?: boolean ) : void;
}

export declare interface ColumnsCallback {
    ( error?: any, result?: Array<AdapterTableColumn> ) : void;
}

export declare interface VersionCallback {
    ( error?: any, result?: string ) : void;
}

export declare interface AdapterTable {
    exists(callback: ExistsCallback): void;
    existsAsync(): Promise<boolean>;
    columns(callback: ColumnsCallback): void;
    columnsAsync(): Promise<Array<AdapterTableColumn>>;
    version(callback: VersionCallback): void;
    versionAsync(): Promise<string>;
    hasSequence(callback: HasSequenceCallback): void;
    hasSequenceAsync(): Promise<boolean>;
    indexes?: Array<AdapterTableIndex>
}

export declare interface AdapterView {
    exists(callback: ExistsCallback): void;
    existsAsync(): Promise<boolean>;
    drop(callback: AdapterExecuteCallback): void;
    dropAsync(): Promise<void>;
    create(query: any, callback: AdapterExecuteCallback): void;
    createAsync(query: any): Promise<void>;
}

export declare interface AdapterTableIndex {
    name: string;
    columns: Array<string>;
}

export declare interface IndexesCallback {
    ( error?: Error, result?: Array<AdapterTableIndex> ) : void;
}

export declare interface AdapterTableIndexes {
    indexes?: any;
    list(callback: IndexesCallback): void;
    listAsync(): Promise<Array<AdapterTableIndex>>;
    drop(name: string, callback: AdapterExecuteCallback): void;
    dropAsync(name: string): Promise<void>;
    create(name: string, columns: Array<string>|string, callback: AdapterExecuteCallback): void;
    createAsync(name: string, columns: Array<string>|string): Promise<void>;
}

export declare interface AdapterAlterColumn {
    name: string;
    type: string;
    nullable?: boolean;
    primary?: boolean;
    size?: number;
    scale?: number;
}

export declare interface AdapterRemoveColumn {
    name: string;
}

export declare interface AdapterMigration {
    appliesTo: string;
    model: string;
    description?: string;
    version: string;
    updated?: boolean;
    add: Array<AdapterAlterColumn>;
    remove?: Array<AdapterRemoveColumn>;
    change?: Array<AdapterAlterColumn>;
}