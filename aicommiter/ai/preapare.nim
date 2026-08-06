proc getPrompt*(): string =
    let prompt = readFile("ai/PROMPT.md")
    return prompt