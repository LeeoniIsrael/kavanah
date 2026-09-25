const values = new Map<string, string>();
export const Paths = { document: "file:///test/documents" };
export class File {
  readonly uri: string;
  constructor(...parts: string[]) {
    this.uri = parts.join("/");
  }
  get exists() {
    return values.has(this.uri);
  }
  create() {
    values.set(this.uri, "");
  }
  write(value: string) {
    values.set(this.uri, value);
  }
  textSync() {
    return values.get(this.uri) ?? "";
  }
}
