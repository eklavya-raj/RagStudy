import ChatInterface from "./ChatInterface";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  return <ChatInterface documentId={documentId} />;
}
