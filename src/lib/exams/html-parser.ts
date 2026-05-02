/**
 * Parses HTML content to extract input fields (text and radio).
 * Returns an array of unique input names with their types.
 */
export type ParsedHtmlInput = {
  name: string;
  type: "text" | "radio";
  /** For radio buttons, we also track the radio button values if they have 'value' attributes */
  radioValues?: string[];
};

export function parseHtmlInputs(htmlContent: string): ParsedHtmlInput[] {
  const inputs: ParsedHtmlInput[] = [];
  const seen = new Set<string>();

  // Match <input> tags with type and name attributes
  const inputRegex = /<input\s+[^>]*?\bname=["']([^"']+)["'][^>]*?>/gi;
  let match: RegExpExecArray | null;

  while ((match = inputRegex.exec(htmlContent)) !== null) {
    const fullTag = match[0];
    const name = match[1];

    if (seen.has(name)) continue;

    // Extract type attribute
    const typeMatch = fullTag.match(/\btype=["']([^"']+)["']/i);
    const inputType = typeMatch ? typeMatch[1].toLowerCase() : "text";

    if (inputType === "text") {
      inputs.push({ name, type: "text" });
      seen.add(name);
    } else if (inputType === "radio") {
      // Find all radio buttons with this name to extract their values
      const radioValuesRegex = new RegExp(
        `<input\\s+[^>]*?\\bname=["']${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*?>`,
        "gi",
      );
      const radioValues: string[] = [];
      let radioMatch: RegExpExecArray | null;
      while ((radioMatch = radioValuesRegex.exec(htmlContent)) !== null) {
        const radioTag = radioMatch[0];
        const valueMatch = radioTag.match(/\bvalue=["']([^"']+)["']/i);
        if (valueMatch) radioValues.push(valueMatch[1]);
      }
      inputs.push({ name, type: "radio", radioValues: radioValues.length > 0 ? radioValues : undefined });
      seen.add(name);
    }
  }

  return inputs;
}

/**
 * Count unique question names (each unique 'name' = 1 question)
 */
export function countHtmlQuestions(htmlContent: string): number {
  return parseHtmlInputs(htmlContent).length;
}
