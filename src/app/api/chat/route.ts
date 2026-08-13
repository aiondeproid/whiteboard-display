import { openai } from "@/lib/openai-client";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `あなたは社内掲示板サイトのチャットアシスタントです。
社員からの一般的な質問に、簡潔でわかりやすい日本語で答えてください。
このサイトに掲載されている個別の資料の内容については閲覧できないため、
資料の詳細を聞かれた場合は「資料を開いて確認してください」と案内し、
それでも分からない場合は担当部署への確認を促してください。
分からないことは正直に分からないと答え、憶測で断定しないでください。`;

const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 2000;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function isValidMessages(value: unknown): value is ChatMessage[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= MAX_MESSAGES &&
    value.every(
      (m) =>
        m &&
        typeof m === "object" &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.length > 0 &&
        m.content.length <= MAX_CONTENT_LENGTH
    )
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const messages = body?.messages;

  if (!isValidMessages(messages) || messages[messages.length - 1].role !== "user") {
    return new Response("Invalid request", { status: 400 });
  }

  const stream = await openai.responses.create({
    model: "gpt-5-nano",
    instructions: SYSTEM_PROMPT,
    input: messages,
    max_output_tokens: 1024,
    stream: true,
  });

  const encoder = new TextEncoder();
  const body_ = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "response.output_text.delta") {
            controller.enqueue(encoder.encode(event.delta));
          }
        }
      } catch (error) {
        console.error("Chat stream error:", error);
        controller.enqueue(
          encoder.encode("\n\n(エラーが発生しました。もう一度お試しください)")
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body_, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
