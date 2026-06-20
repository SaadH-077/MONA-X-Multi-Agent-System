import mammoth from "mammoth";
import * as XLSX from "xlsx";

/* Turns an uploaded file into something Gemini can use:
   - PDF / images  → sent inline (Gemini reads them with vision)
   - DOCX          → text extracted with mammoth
   - XLSX / XLS    → every sheet flattened to CSV text
   - CSV / TXT     → decoded text
   This is what lets the invoice agent handle PDF + PNG + DOCX + CSV. */

export type IncomingFile = { data: string; mimeType: string; name?: string };

export type Extracted =
  | { kind: "inline"; file: { data: string; mimeType: string } }
  | { kind: "text"; text: string };

const IMAGE_EXT = ["png", "jpg", "jpeg", "webp", "gif", "bmp", "tif", "tiff"];

export async function extractFile(file: IncomingFile): Promise<Extracted> {
  const ext = (file.name?.split(".").pop() ?? "").toLowerCase();
  const mime = file.mimeType ?? "";
  const buffer = Buffer.from(file.data, "base64");

  // PDF & images → inline for Gemini vision
  if (ext === "pdf" || mime === "application/pdf") {
    return { kind: "inline", file: { data: file.data, mimeType: "application/pdf" } };
  }
  if (IMAGE_EXT.includes(ext) || mime.startsWith("image/")) {
    return {
      kind: "inline",
      file: { data: file.data, mimeType: mime.startsWith("image/") ? mime : `image/${ext}` },
    };
  }

  // DOCX → raw text
  if (ext === "docx" || mime.includes("wordprocessingml")) {
    const { value } = await mammoth.extractRawText({ buffer });
    return { kind: "text", text: value.trim() };
  }

  // XLSX / XLS → CSV per sheet
  if (ext === "xlsx" || ext === "xls" || mime.includes("spreadsheetml")) {
    const wb = XLSX.read(buffer, { type: "buffer" });
    const parts = wb.SheetNames.map(
      (n) => `# Sheet: ${n}\n${XLSX.utils.sheet_to_csv(wb.Sheets[n])}`,
    );
    return { kind: "text", text: parts.join("\n\n") };
  }

  // CSV / TXT / fallback → decode as text
  return { kind: "text", text: buffer.toString("utf8") };
}
