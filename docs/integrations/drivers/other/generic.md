---
title: Generic
description: >-
  Create your own adapter ...
sidebar_position: 10
---

You can integrate any SQLite or Postgres database driver by adapting it to the ElectricSQL [`DatabaseAdapter` interface](https://github.com/electric-sql/electric/blob/main/clients/typescript/src/electric/adapter.ts):

```tsx
export interface DatabaseAdapter {
  // Database connection instance from your driver library.
  db: AnyDatabase

  // Run the provided sql statement. A statement has the
  // form of `{sql: string, bindParams?: string[]}`.
  run(statement: Statement): Promise<RunResult>

  // Run an array of sql statements within a transaction.
  runInTransaction(...statements: Statement[]): Promise<RunResult>

  // Executes the function in isolation from any other queries/transactions executed through this adapter.
  // Useful to execute queries that cannot be executed inside a transaction but still guarantee isolation from other queries.
  runExclusively<T>(
    f: (adapter: UncoordinatedDatabaseAdapter) => Promise<T> | T
  ): Promise<T>

  // Run a query statement and return the results as an
  // array of rows.
  query(statement: Statement): Promise<Row[]>

  // Run the provided function inside a transaction.
  transaction<T>(
    f: (tx: Transaction, setResult: (res: T) => void) => void
  ): Promise<T | void>

  // Get the tables potentially used by an SQL statement.
  // This supports reactivity for raw SQL use via the
  // `db.liveRawQuery` function.
  tableNames(statement: Statement): QualifiedTablename[]
}
```

For convenience, we provide two generic database adapters, `SerialDatabaseAdapter` and `BatchDatabaseAdapter`. These implement the parts of the interface that are common to most adapters. This allows you to implement your own driver adapters using a simpler interface.
```tsx
export abstract class SerialDatabaseAdapter implements DatabaseAdapter {
  // Run a single SQL statement against the DB
  abstract _run(stmt: Statement): Promise<RunResult>
  // Run a single SQL query against the DB
  abstract _query(stmt: Statement): Promise<Row[]>
}

// Use `BatchDatabaseAdapter` if the underlying driver
// supports batch execution of SQL statements
export abstract class BatchDatabaseAdapter implements DatabaseAdapter {
  // Run a single SQL statement against the DB
  abstract _run(stmt: Statement): Promise<RunResult>
  // Run a single SQL query against the DB
  abstract _query(stmt: Statement): Promise<Row[]>
  // Run several SQL statements againt the DB in a single batch
  abstract execBatch(statements: Statement[]): Promise<RunResult>
}
```

The best guidance for this is to look at the [existing driver implementations](https://github.com/electric-sql/electric/tree/main/clients/typescript/src/drivers). You can then build on the [base electrify function](https://github.com/electric-sql/electric/blob/main/clients/typescript/src/electric/index.ts#L33) to implement your own `electrify` function, e.g.:

```tsx
export const electrify = async <T, DB extends DbSchema<any>>(
  db: T,
  dbDescription: DB,
  config: ElectricConfig,
  opts?: ElectrifyOptions
): Promise<ElectricClient<DB>> => {
  const dbName = db.name
  const adapter = opts?.adapter || new MyDatabaseAdapter(db)
  const socketFactory = opts?.socketFactory || new WebSocketWebFactory()

  const client = await baseElectrify(
    dbName,
    dbDescription,
    adapter,
    socketFactory,
    config,
    opts
  )

  return client
}
```

For more help / pointers, [let us know on Discord](https://discord.electric-sql.com) and we'll be happy to help you with the integration.
