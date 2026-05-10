import { Router } from "express";
import { getAuth } from "@clerk/express";
import { sql } from "drizzle-orm";
import { eq, and } from "drizzle-orm";
import type { ChatMessages } from "@openrouter/sdk/models"
import { openrouter, EMBEDDING_MODEL, DEFAULT_CHAT_MODEL } from "../lib/openrouter";
import { getDB } from "../lib/db";
import { documentsTable } from "../db/schema/documentSchema";

const router = Router();

async function embedQuery(text: string): Promise<number[]> {
  const response = await openrouter.embeddings.generate({
    requestBody: { model: EMBEDDING_MODEL, input: text },
  });
  if (typeof response === "string") throw new Error("Unexpected embeddings response");
  return response.data[0].embedding as number[];
}

async function getRelevantChunks(
  documentId: string,
  queryEmbedding: number[],
  limit = 5
): Promise<string[]> {
  const db = await getDB();
  const vectorLiteral = `[${queryEmbedding.join(",")}]`;
  const rows = await db.execute<{ content: string }>(
    sql`SELECT content
        FROM document_chunks
        WHERE document_id = ${documentId}::uuid
        ORDER BY embedding <=> ${vectorLiteral}::vector
        LIMIT ${limit}`
  );
  return rows.map((r) => r.content);
}

// POST /api/chat — streaming chat with optional RAG context
router.post("/chat", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const {
    messages,
    model = DEFAULT_CHAT_MODEL,
    documentId,
  } = req.body as {
    messages: ChatMessages[];
    model?: string;
    documentId?: string;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages must be a non-empty array" });
    return;
  }

  const contextMessages: ChatMessages[] = [];

  if (documentId) {
    const db = await getDB();
    const [doc] = await db
      .select({ id: documentsTable.id })
      .from(documentsTable)
      .where(
        and(
          eq(documentsTable.id, documentId),
          eq(documentsTable.userId, userId)
        )
      );

    if (!doc) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    const lastUserMsg = [...messages]
      .reverse()
      .find((m) => m.role === "user");

    if (lastUserMsg && typeof lastUserMsg.content === "string") {
      const queryEmbedding = await embedQuery(lastUserMsg.content);
      const chunks = await getRelevantChunks(documentId, queryEmbedding);
      if (chunks.length > 0) {
        contextMessages.push({
          role: "system" as const,
          content: `Answer using the following context:\n\n${chunks.join("\n\n---\n\n")}`,
        });
      }
    }
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const stream = await openrouter.chat.send({
    chatRequest: {
      model,
      messages: [...contextMessages, ...messages],
      stream: true,
      maxTokens: 2048,
    },
  });

  let cancelled = false;
  req.on("close", () => {
    cancelled = true;
    stream.cancel();
  });

  try {
    for await (const chunk of stream) {
      if (cancelled) break;
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
  } catch (err: unknown) {
    if (!cancelled) {
      const message = err instanceof Error ? err.message : "Stream error";
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    }
  } finally {
    res.end();
  }
});

export default router;
