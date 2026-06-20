import Chat from "@/components/chat";

export default function ChatPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">AI Chat</h1>
      <p className="mb-8 text-muted">
        Streaming responses from Claude. Set <code className="text-accent">ANTHROPIC_API_KEY</code> to go live.
      </p>
      <Chat system="You are Nexus, a friendly and concise AI assistant built for a hackathon demo." />
    </div>
  );
}
