/** Conservative on purpose: Arabic often costs more than 4 characters per token. */
export function estimateTokens(text: string) {
  return Math.ceil(text.length / 2);
}

export function trimHistory<T extends { content: string }>(messages: T[], budget: number) {
  const kept: T[] = [];
  let used = 0;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const cost = estimateTokens(messages[index].content) + 4;
    if (kept.length > 0 && used + cost > budget) break;
    kept.push(messages[index]);
    used += cost;
  }
  return kept.reverse();
}
