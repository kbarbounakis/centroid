import {
    assert,
    assertEquals,
    assertThrows
 } from "https://deno.land/std/testing/asserts.ts";
import { SqliteAdapter } from "../../std/sqlite/SqliteAdapter.ts";
import { QueryExpression } from "../../std/query/QueryExpression.ts";

const CATEGORIES = JSON.parse(Deno.readTextFileSync("./test/config/models/Category.json"));

 const { test } = Deno;

 test({
     name: "new SqliteAdapter()",
     fn: async function (): Promise<void> {
        const db = new SqliteAdapter({
            database: ":memory:"
        });
        assert(db);
    },
    sanitizeResources: false,
    sanitizeOps: false
 });

 test({
     name: "SqliteAdapter.open()",
     fn: async function (): Promise<void> {
        const db = new SqliteAdapter({
            database: ":memory:"
        });
        await db.openAsync();
        assert(db.rawConnection);
        await db.closeAsync();
    },
    sanitizeResources: false,
    sanitizeOps: false
 });

 test({
     name: "SqliteAdapter.table()",
     fn: async function (): Promise<void> {
        const db = new SqliteAdapter({
            database: ":memory:"
        });
        await db.executeAsync("CREATE TABLE IF NOT EXISTS people (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)");
        const names = ["Peter Parker", "Clark Kent", "Bruce Wayne"];

        // Run a simple query
        for (const name of names)
            await db.executeAsync("INSERT INTO people (name) VALUES (?)", [name]);
        const exists = await db.table("people").existsAsync();
        assertEquals(exists, true);
    },
    sanitizeResources: false,
    sanitizeOps: false
 });

 test({
     name: "SqliteAdapter.migrate()",
     fn: async function (): Promise<void> {
        const db = new SqliteAdapter({
            database: ":memory:"
        });
        await db.migrateAsync({
            appliesTo: CATEGORIES.source,
            model: CATEGORIES.name,
            version: CATEGORIES.version,
            add: CATEGORIES.fields
        });
        const exists = await db.table(CATEGORIES.source).existsAsync();
        assertEquals(exists, true);
    },
    sanitizeResources: false,
    sanitizeOps: false
 });

 test({
     name: "SqliteAdapter.execute()",
     fn: async function (): Promise<void> {
        const db = new SqliteAdapter({
            database: ":memory:"
        });
        await db.migrateAsync({
            appliesTo: CATEGORIES.source,
            model: CATEGORIES.name,
            version: CATEGORIES.version,
            add: CATEGORIES.fields
        });
        const exists = await db.table(CATEGORIES.source).existsAsync();
        assertEquals(exists, true);
        for (const item of CATEGORIES.seed) {
            const query = new QueryExpression().insert(item).into(CATEGORIES.source);
            await db.executeAsync(query);
        }
    },
    sanitizeResources: false,
    sanitizeOps: false
 });
 