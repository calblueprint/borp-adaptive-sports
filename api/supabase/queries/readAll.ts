type Page<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

export async function readAll<T>(
  page: (from: number, to: number) => PromiseLike<Page<T>>,
): Promise<T[]> {
  const rows: T[] = [];
  for (;;) {
    const { data, error } = await page(rows.length, rows.length + 199);
    if (error) throw new Error(error.message);
    if (!data?.length) return rows;
    rows.push(...data);
  }
}
