import { notFound } from "next/navigation";
import { AGENTS, getAgent } from "@/lib/agents";
import AgentRunner from "@/components/agent-runner";

export function generateStaticParams() {
  return AGENTS.map((a) => ({ slug: a.slug }));
}

export default async function AgentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!getAgent(slug)) notFound();
  return <AgentRunner slug={slug} />;
}
