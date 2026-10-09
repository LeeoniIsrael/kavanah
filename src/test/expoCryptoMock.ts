import { createHash, randomBytes, randomUUID as nodeRandomUUID } from "crypto";

export enum CryptoDigestAlgorithm {
  SHA256 = "SHA-256"
}

export async function digestStringAsync(algorithm: CryptoDigestAlgorithm, value: string): Promise<string> {
  const nodeAlgorithm = algorithm === CryptoDigestAlgorithm.SHA256 ? "sha256" : "sha256";
  return createHash(nodeAlgorithm).update(value).digest("hex");
}

export function getRandomBytes(count: number): Uint8Array { return randomBytes(count); }
export function randomUUID(): string { return nodeRandomUUID(); }
