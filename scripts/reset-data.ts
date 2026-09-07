import { copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
await copyFile(path.join(root, "data", "incidents.seed.json"), path.join(root, "data", "incidents.json"));
console.log("Demo data restored (incidents reset to the original workshop state).");
