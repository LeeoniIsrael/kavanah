export class MMKV {
  private readonly values = new Map<string, string | number | boolean>();

  getString(key: string): string | undefined {
    const value = this.values.get(key);
    return typeof value === "string" ? value : undefined;
  }

  set(key: string, value: string | number | boolean): void {
    this.values.set(key, value);
  }

  delete(key: string): void {
    this.values.delete(key);
  }

  clearAll(): void {
    this.values.clear();
  }
}
