import { createHash } from "crypto";

export enum CryptoDigestAlgorithm {
  SHA256 = "SHA-256"
}

export async function digestStringAsync(algorithm: CryptoDigestAlgorithm, value: string): Promise<string> {
  const nodeAlgorithm = algorithm === CryptoDigestAlgorithm.SHA256 ? "sha256" : "sha256";
  return createHash(nodeAlgorithm).update(value).digest("hex");
}
