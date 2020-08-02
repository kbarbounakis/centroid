import {
    assert,
    assertEquals,
    assertThrows
 } from "https://deno.land/std/testing/asserts.ts";
import { SqliteAdapter } from "../../std/sqlite/SqliteAdapter.ts";

 const { test } = Deno;

 test("new SqliteAdapter()", async function (): Promise<void> {
    const db = new SqliteAdapter({
        database: ":memory:"
    });
    assert(db);
});

test("SqliteAdapter.open()", async function (): Promise<void> {
    const db = new SqliteAdapter({
        database: ":memory:"
    });
    await db.openAsync();
    assert(db.rawConnection);
    await db.closeAsync();
});