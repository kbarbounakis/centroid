import {
    assert,
    assertEquals,
    assertThrows
 } from "https://deno.land/std/testing/asserts.ts";
 
 import { QueryCollection } from "../../std/query/QueryCollection.ts"

 const { test } = Deno;

 test("new QueryCollection()", async function (): Promise<void> {
    const collection = new QueryCollection("Users");
    assertEquals(collection, {
        Users: 1
    });
});