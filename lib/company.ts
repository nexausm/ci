import { readFile } from "fs/promises";
import path from "path";
import type { CompanyInfo } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const PUBLIC_DIR = path.join(process.cwd(), "public");

interface InfoJson {
  companyName: string;
  numberLabel: string;
  numberValue: string;
  addressLines: string[];
  phone: string;
  email: string;
  logo: string | null;
}

function mimeFor(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

export async function getCompanyInfo(): Promise<CompanyInfo> {
  const raw = await readFile(path.join(DATA_DIR, "info.json"), "utf-8");
  const info: InfoJson = JSON.parse(raw);

  let logoDataUri: string | null = null;
  if (info.logo) {
    const bytes = await readFile(path.join(PUBLIC_DIR, info.logo));
    logoDataUri = `data:${mimeFor(info.logo)};base64,${bytes.toString("base64")}`;
  }

  return {
    companyName: info.companyName,
    numberLabel: info.numberLabel,
    numberValue: info.numberValue,
    addressLines: info.addressLines,
    phone: info.phone,
    email: info.email,
    logoDataUri,
  };
}
