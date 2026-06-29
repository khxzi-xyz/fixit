import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

class MockQueryBuilder {
  private table: string;
  private filePath: string;
  private operation: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private opValues: any = null;
  private opOptions: any = null;
  private filters: ((item: any) => boolean)[] = [];
  private sortCol?: string;
  private sortAsc?: boolean;
  private limitCount?: number;

  constructor(table: string, filePath: string) {
    this.table = table;
    this.filePath = filePath;
  }

  private loadData(): any[] {
    if (!existsSync(this.filePath)) {
      writeFileSync(this.filePath, JSON.stringify({}), 'utf8');
    }
    try {
      const fileData = JSON.parse(readFileSync(this.filePath, 'utf8') || '{}');
      return fileData[this.table] || [];
    } catch {
      return [];
    }
  }

  private saveData(tableData: any[]) {
    let fileData: any = {};
    if (existsSync(this.filePath)) {
      try {
        fileData = JSON.parse(readFileSync(this.filePath, 'utf8') || '{}');
      } catch {}
    }
    fileData[this.table] = tableData;
    writeFileSync(this.filePath, JSON.stringify(fileData, null, 2), 'utf8');
  }

  select(columns?: string) {
    this.operation = 'select';
    return this;
  }

  insert(values: any) {
    this.operation = 'insert';
    this.opValues = values;
    return this;
  }

  upsert(values: any, options?: any) {
    this.operation = 'upsert';
    this.opValues = values;
    this.opOptions = options;
    return this;
  }

  update(values: any) {
    this.operation = 'update';
    this.opValues = values;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((item: any) => item[column] === value);
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push((item: any) => item[column] !== value);
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push((item: any) => Array.isArray(values) && values.includes(item[column]));
    return this;
  }

  is(column: string, value: any) {
    this.filters.push((item: any) => item[column] === value);
    return this;
  }

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) {
    this.sortCol = column;
    this.sortAsc = options?.ascending !== false;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  private matchesAll(item: any): boolean {
    return this.filters.every(f => f(item));
  }

  private getIdKey(): string {
    if (this.table === 'users') return 'user_id';
    if (this.table === 'vendor_profiles') return 'vendor_id';
    if (this.table === 'jobs') return 'job_id';
    if (this.table === 'bids') return 'bid_id';
    if (this.table === 'otp_codes') return 'otp_id';
    if (this.table === 'warranty_terms') return 'job_id';
    if (this.table === 'parts_funding_requests') return 'request_id';
    if (this.table === 'wallet_balances') return 'wallet_id';
    if (this.table === 'wallet_transactions') return 'txn_id';
    if (this.table === 'listings') return 'listing_id';
    if (this.table === 'junk_listings') return 'junk_id';
    if (this.table === 'high_ticket_listings') return 'listing_id';
    if (this.table === 'diagnostic_passes') return 'pass_id';
    return 'id';
  }

  async execute() {
    let tableData = this.loadData();
    let result: any[] = [];

    if (this.operation === 'select') {
      result = tableData.filter(x => this.matchesAll(x));
    } else if (this.operation === 'insert') {
      const rows = Array.isArray(this.opValues) ? this.opValues : [this.opValues];
      for (const r of rows) {
        const row = { ...r };
        const idKey = this.getIdKey();
        if (!row[idKey]) {
          row[idKey] = r.phone_number || r.vendor_id || r.job_id || r.bid_id || r.txn_id || r.pass_id || r.request_id || r.listing_id || `id_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        }
        if (!row.created_at) {
          row.created_at = new Date().toISOString();
        }
        tableData.push(row);
        result.push(row);
      }
      this.saveData(tableData);
    } else if (this.operation === 'upsert') {
      const rows = Array.isArray(this.opValues) ? this.opValues : [this.opValues];
      const onConflict = this.opOptions?.onConflict || this.getIdKey();
      for (const r of rows) {
        const row = { ...r };
        const idKey = onConflict;
        const existingIdx = tableData.findIndex((x: any) => x[idKey] === row[idKey]);
        if (existingIdx >= 0) {
          tableData[existingIdx] = { ...tableData[existingIdx], ...row };
          result.push(tableData[existingIdx]);
        } else {
          if (!row[idKey]) {
            row[idKey] = `id_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          }
          if (!row.created_at) {
            row.created_at = new Date().toISOString();
          }
          tableData.push(row);
          result.push(row);
        }
      }
      this.saveData(tableData);
    } else if (this.operation === 'update') {
      const updated: any[] = [];
      tableData = tableData.map((item: any) => {
        if (this.matchesAll(item)) {
          const newItem = { ...item, ...this.opValues };
          updated.push(newItem);
          return newItem;
        }
        return item;
      });
      this.saveData(tableData);
      result = updated;
    } else if (this.operation === 'delete') {
      const remaining = tableData.filter(x => !this.matchesAll(x));
      const deleted = tableData.filter(x => this.matchesAll(x));
      this.saveData(remaining);
      result = deleted;
    }

    if (this.sortCol) {
      const col = this.sortCol;
      const asc = this.sortAsc;
      result.sort((a, b) => {
        const valA = a[col];
        const valB = b[col];
        if (valA === valB) return 0;
        if (valA == null) return 1;
        if (valB == null) return -1;
        if (valA < valB) return asc ? -1 : 1;
        return asc ? 1 : -1;
      });
    }

    if (this.limitCount != null) {
      result = result.slice(0, this.limitCount);
    }

    return { data: result, error: null };
  }

  async then(resolve: any, reject: any) {
    try {
      const res = await this.execute();
      resolve(res);
    } catch (e: any) {
      resolve({ data: null, error: { message: e.message } });
    }
  }

  single() {
    const self = this;
    return {
      async then(resolve: any, reject: any) {
        try {
          const res = await self.execute();
          if (res.error) {
            resolve({ data: null, error: res.error });
          } else if (res.data.length === 0) {
            resolve({ data: null, error: { message: 'Row not found' } });
          } else {
            resolve({ data: res.data[0], error: null });
          }
        } catch (e: any) {
          resolve({ data: null, error: { message: e.message } });
        }
      }
    };
  }

  maybeSingle() {
    const self = this;
    return {
      async then(resolve: any, reject: any) {
        try {
          const res = await self.execute();
          if (res.error) {
            resolve({ data: null, error: res.error });
          } else if (res.data.length === 0) {
            resolve({ data: null, error: null });
          } else {
            resolve({ data: res.data[0], error: null });
          }
        } catch (e: any) {
          resolve({ data: null, error: { message: e.message } });
        }
      }
    };
  }
}

export class MockSupabaseClient {
  private filePath: string;

  constructor() {
    // Find db.json in root
    let dir = process.cwd();
    let path = join(dir, 'db.json');
    while (!existsSync(path) && dir !== join(dir, '..')) {
      dir = join(dir, '..');
      path = join(dir, 'db.json');
    }
    this.filePath = path;
  }

  from(table: string) {
    return new MockQueryBuilder(table, this.filePath);
  }
}
