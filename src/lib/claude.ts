import Anthropic from "@anthropic-ai/sdk";

function getClient() {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }
  return new Anthropic({ apiKey });
}

export async function queryRules(
  rulesText: string,
  question: string
): Promise<string> {
  const client = getClient();

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: `You are a helpful assistant for a Farm-1 coach pitch baseball league coaching staff.
You have been provided with the league's official rules and regulations.
Answer questions about the rules accurately and concisely.
If something is not covered in the rules, say so clearly.
Keep answers practical and relevant to coaching a team of first-grade boys (ages 6-7).
Use bullet points and short paragraphs for easy reading during games.`,
    messages: [
      {
        role: "user",
        content: `Here are the league rules:\n\n${rulesText}\n\n---\n\nQuestion: ${question}`,
      },
    ],
  });

  const block = message.content[0];
  return block.type === "text" ? block.text : "";
}

export async function generatePracticePlan(
  goals: string,
  observations: string,
  focusArea?: string
): Promise<string> {
  const client = getClient();

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: `You are an experienced youth baseball coaching assistant specializing in Farm-1 coach pitch for first-grade players (ages 6-7).
Generate practical, age-appropriate practice plans.
Focus on fun, engagement, and fundamental skill building.
Keep drills short (5-10 minutes each) because attention spans are limited at this age.
Always include warm-up and cool-down sections.
Format your response as a structured practice plan with clear sections, time allocations, and equipment needed.
Include coaching tips for each drill.`,
    messages: [
      {
        role: "user",
        content: `Coaching goals: ${goals}

Player observations: ${observations}

${focusArea ? `Focus area: ${focusArea}` : ""}

Please generate a 60-minute practice plan for 16 first-grade boys.`,
      },
    ],
  });

  const block = message.content[0];
  return block.type === "text" ? block.text : "";
}
