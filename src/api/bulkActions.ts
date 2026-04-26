import { asErrorMessage } from "../utils/format";

export interface BulkFailure {
  id: string;
  error: string;
}

export interface BulkActionResult {
  total: number;
  succeeded: number;
  failures: BulkFailure[];
}

export async function runSequentialBulkAction<T>(
  items: T[],
  getId: (item: T) => string,
  action: (item: T) => Promise<unknown>,
): Promise<BulkActionResult> {
  let succeeded = 0;
  const failures: BulkFailure[] = [];

  for (const item of items) {
    const id = getId(item);
    try {
      await action(item);
      succeeded += 1;
    } catch (caught) {
      failures.push({ id, error: asErrorMessage(caught) });
    }
  }

  return {
    total: items.length,
    succeeded,
    failures,
  };
}
