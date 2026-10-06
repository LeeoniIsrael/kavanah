const values = new Map<string, string>();
export const Paths = {
  document: "file:///test/documents",
  cache: "file:///test/cache",
};
export class File {
  readonly uri: string;
  constructor(...parts: string[]) {
    this.uri = parts.join("/");
  }
  get name() {
    return this.uri.split("/").pop() ?? "";
  }
  get exists() {
    return values.has(this.uri);
  }
  delete() {
    values.delete(this.uri);
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

export class Directory {
  readonly uri: string;
  constructor(...parts: string[]) {
    this.uri = parts.join("/");
  }
  list(): File[] {
    return [...values.keys()]
      .filter((uri) => uri.startsWith(`${this.uri}/`))
      .map((uri) => new File(uri));
  }
}
