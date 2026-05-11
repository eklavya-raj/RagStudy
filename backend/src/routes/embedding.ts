import { Router } from "express";
import { getAuth } from "@clerk/express";
import multer from "multer";
import path from "path";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { openrouter, EMBEDDING_MODEL } from "../lib/openrouter";
import { getDB } from "../lib/db";
import { documentsTable, documentChunksTable } from "../db/schema/documentSchema";
import { eq, and } from "drizzle-orm";

const router = Router();

const ALLOWED_EXTENSIONS = new Set([".pdf", ".txt", ".md", ".docx"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Allowed: .pdf, .txt, .md, .docx`));
    }
  },
});


async function extractText(file: Express.Multer.File): Promise<string> {
  const ext = path.extname(file.originalname).toLowerCase();
  switch (ext) {
    case ".pdf": {
      const parser = new PDFParse({ data: new Uint8Array(file.buffer) });
      const result = await parser.getText();
      await parser.destroy();
      return result.text;
    }
    case ".txt":
    case ".md":
      return file.buffer.toString("utf-8");
    case ".docx": {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return result.value;
    }
    default:
      throw new Error(`Unsupported extension: ${ext}`);
  }
}

export function chunkText(text: string, chunkSize = 1500, overlap = 150): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length) {
    let end = start + chunkSize;
    if (end < cleaned.length) {
      const breakPoint = cleaned.lastIndexOf(" ", end);
      if (breakPoint > start) end = breakPoint;
    } else {
      end = cleaned.length;
    }
    const chunk = cleaned.slice(start, end).trim();
    if (chunk.length > 0) chunks.push(chunk);
    if (end >= cleaned.length) break;
    start = end - overlap;
  }

  return chunks;
}

async function generateEmbeddings(chunks: string[]): Promise<number[][]> {
  const BATCH_SIZE = 100;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const response = await openrouter.embeddings.generate({
      requestBody: { model: EMBEDDING_MODEL, input: batch },
    });
    if (typeof response === "string") throw new Error("Unexpected embeddings response");
    allEmbeddings.push(...response.data.map((d) => d.embedding as number[]));
  }

  return allEmbeddings;
}

// POST /api/embed — upload a file and generate + store its embeddings
router.post("/embed", upload.single("file"), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const rawText = await extractText(req.file);
  if (!rawText.trim()) {
    res.status(422).json({ error: "Could not extract text from file" });
    return;
  }

  const chunks = chunkText(rawText);
  if (chunks.length === 0) {
    res.status(422).json({ error: "No content found in file" });
    return;
  }

  const embeddings = await generateEmbeddings(chunks);

  const db = await getDB();
  const ext = path.extname(req.file.originalname).toLowerCase().replace(".", "");

  const [doc] = await db
    .insert(documentsTable)
    .values({
      userId,
      name: req.file.originalname,
      fileType: ext,
      fileSize: req.file.size,
      chunkCount: chunks.length,
    })
    .returning();

  const chunkRows = chunks.map((content, i) => ({
    documentId: doc.id,
    chunkIndex: i,
    content,
    embedding: embeddings[i],
  }));

  for (let i = 0; i < chunkRows.length; i += 50) {
    await db.insert(documentChunksTable).values(chunkRows.slice(i, i + 50));
  }

  res.status(201).json({
    documentId: doc.id,
    name: doc.name,
    fileType: doc.fileType,
    chunks: doc.chunkCount,
  });
});

// GET /api/documents — list documents for the authenticated user
router.get("/documents", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const db = await getDB();
    const docs = await db
      .select({
        id: documentsTable.id,
        name: documentsTable.name,
        fileType: documentsTable.fileType,
        fileSize: documentsTable.fileSize,
        chunkCount: documentsTable.chunkCount,
        createdAt: documentsTable.createdAt,
      })
      .from(documentsTable)
      .where(eq(documentsTable.userId, userId));
    res.json(docs);
  } catch (err: unknown) {
    const pg = err as Record<string, unknown>;
    console.error("[/api/documents] DB error:", pg.message, pg.code, pg.detail);
    res.status(500).json({ error: "Database error", detail: pg.message });
  }
});

// DELETE /api/documents/:id — delete a document and all its chunks
router.delete("/documents/:id", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const db = await getDB();
  const deleted = await db
    .delete(documentsTable)
    .where(
      and(
        eq(documentsTable.id, req.params.id),
        eq(documentsTable.userId, userId)
      )
    )
    .returning();

  if (deleted.length === 0) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  res.json({ deleted: deleted[0].id });
});

export default router;
