import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { BotConfig } from "@/config/bots";

function stripOwnerNotes(markdown: string) {
  return markdown.replace(/<!--[\s\S]*?-->/g, "").trim();
}

function readPrompt(filename: string) {
  const filePath = path.join(process.cwd(), "prompts", filename);
  return stripOwnerNotes(fs.readFileSync(filePath, "utf8"));
}

/** System prompt is built only on the server. The client never supplies it. */
export function buildSystemPrompt(bot: BotConfig) {
  const instructions = readPrompt(bot.promptFile);
  const knowledge = readPrompt(bot.knowledgeFile);
  return `${instructions}\n\n---\nSTUDIO KNOWLEDGE (append-only reference, follow it when it does not conflict with the instructions above):\n${knowledge}`;
}
