"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import {
  Upload, FileText, FileType, Trash2, MessageSquare,
  Loader2, AlertCircle, FilePlus, ArrowRight,
} from "lucide-react";

interface Document {
  id: string;
  name: string;
  fileType: string;
  fileSize: number;
  chunkCount: number;
  createdAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  pdf: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  docx: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  txt: "bg-muted text-muted-foreground border-border",
  md: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default function DashboardPage() {
  const { getToken } = useAuth();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const base = process.env.NEXT_PUBLIC_BACKEND_URL;

  const fetchDocs = useCallback(async () => {
    const token = await getToken();
    if (!token) { setLoading(false); return; }
    const res = await fetch(`${base}/api/documents`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setDocs(await res.json());
    setLoading(false);
  }, [getToken, base]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchDocs();
    });
  }, [fetchDocs]);

  async function uploadFile(file: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${base}/api/embed`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }
      await fetchDocs();
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function deleteDoc(id: string) {
    setDeletingId(id);
    const token = await getToken();
    if (!token) { setDeletingId(null); return; }
    await fetch(`${base}/api/documents/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setDocs((prev) => prev.filter((d) => d.id !== id));
    setDeletingId(null);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {docs.length} document{docs.length !== 1 ? "s" : ""} uploaded
          </p>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 bg-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40"
        >
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {uploading ? "Processing…" : "Upload"}
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`mb-8 border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground/40 hover:bg-subtle"
        } ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.md,.docx"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={28} className="text-primary animate-spin" />
            <p className="text-sm text-foreground font-medium">Embedding your document…</p>
            <p className="text-xs text-muted-foreground">This may take a moment for large files</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2.5">
            <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center">
              <FilePlus size={22} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Drop a file here, or <span className="text-primary hover:opacity-80">browse</span>
            </p>
            <p className="text-xs text-muted-foreground">PDF · DOCX · TXT · Markdown · up to 50 MB</p>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="mb-6 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle size={15} className="shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Document grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mx-auto mb-4">
            <FileType size={26} className="text-muted-foreground" />
          </div>
          <p className="text-foreground font-semibold text-base">No documents yet</p>
          <p className="text-sm text-muted-foreground mt-1.5">Upload your first file to start chatting</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="group relative flex flex-col p-5 rounded-2xl border border-border bg-card hover:bg-accent/40 hover:border-muted-foreground/30 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border uppercase tracking-wide ${TYPE_COLORS[doc.fileType] ?? TYPE_COLORS.txt}`}>
                  {doc.fileType}
                </span>
                <button
                  onClick={() => deleteDoc(doc.id)}
                  disabled={deletingId === doc.id}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                  aria-label="Delete"
                >
                  {deletingId === doc.id
                    ? <Loader2 size={14} className="animate-spin" />
                    : <Trash2 size={14} />}
                </button>
              </div>

              <div className="flex items-start gap-2.5 mb-4 flex-1">
                <FileText size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm font-medium text-foreground leading-snug line-clamp-2 break-all">
                  {doc.name}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-4">
                <span>{doc.chunkCount} chunks · {formatBytes(doc.fileSize)}</span>
                <span>{formatDate(doc.createdAt)}</span>
              </div>

              <Link
                href={`/chat/${doc.id}`}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-muted hover:bg-primary/15 hover:text-primary text-muted-foreground text-xs font-medium transition-all border border-transparent hover:border-primary/25"
              >
                <MessageSquare size={13} />
                Chat with this
                <ArrowRight size={12} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
