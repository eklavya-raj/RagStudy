import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  index,
  vector,
} from "drizzle-orm/pg-core";

export const documentsTable = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    name: varchar("name", { length: 500 }).notNull(),
    fileType: varchar("file_type", { length: 10 }).notNull(),
    fileSize: integer("file_size").notNull(),
    chunkCount: integer("chunk_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("documents_user_id_idx").on(table.userId),
  ]
);

export const documentChunksTable = pgTable(
  "document_chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documentsTable.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunk_index").notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("chunks_document_id_idx").on(table.documentId),
  ]
);
