import "server-only";
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("Missing OPENAI_API_KEY env var");
}

export const openai = new OpenAI({ apiKey });
