declare module "node:sqlite" {
  export type SqlValue = string | number | bigint | null | Uint8Array;

  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }

  export class StatementSync {
    get(...params: SqlValue[]): Record<string, SqlValue> | undefined;
    all(...params: SqlValue[]): Record<string, SqlValue>[];
    run(...params: SqlValue[]): {
      changes: number | bigint;
      lastInsertRowid: number | bigint;
    };
  }
}
