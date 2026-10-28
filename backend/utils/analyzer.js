const LANGUAGES = new Set(["c", "cpp", "java", "python", "javascript"]);

function classifyLine(line, language) {
  const s = line.trim();
  if (!s) return { category: "Blank", explanation: "This line is empty and can make code easier to read." };
  if (/^(\/\/|#(?!include|define|if|elif|else|endif|pragma)|\/\*|\*\/|\* )/.test(s)) {
    return { category: "Comment", explanation: "This is a comment or comment marker. It is meant for people reading the code and is not an ordinary executable statement." };
  }
  if (/^#include\b/.test(s)) return { category: "Header", explanation: "This includes a header file so the program can use declarations supplied by that library." };
  if (/^#define\b/.test(s)) return { category: "Macro", explanation: "This defines a preprocessor macro that is substituted before compilation." };
  if (/^(import|from)\s+/.test(s)) return { category: "Import", explanation: "This imports a module or selected names so the program can use code defined elsewhere." };
  if (/^(using\s+namespace|package)\b/.test(s)) return { category: "Declaration", explanation: "This declares a namespace or package context used to organize program names." };
  if (/^(public|private|protected)?\s*(static\s+)?(void|int|float|double|char|boolean|string|String|long|short|byte)\s+\w+\s*\(/i.test(s) || /^(def|function)\s+\w+\s*\(/.test(s) || /^(async\s+)?function\b/.test(s)) {
    return { category: "Function", explanation: "This begins a function or method declaration. A function groups instructions that can be called to perform a task." };
  }
  if (/^(class|struct|interface|enum)\s+\w+/.test(s)) return { category: "Type", explanation: "This declares a class, structure, interface, or enum, which defines a type or groups related data and behavior." };
  if (/^(if|else if|elif|else)\b/.test(s) || /^}\s*else\b/.test(s)) return { category: "Condition", explanation: "This selects which block of code runs based on a condition. An else branch handles the alternative path." };
  if (/^(for|while)\b/.test(s) || /^for\s+.+\s+in\s+/.test(s) || /^do\s*\{?/.test(s)) return { category: "Loop", explanation: "This starts a loop. A loop repeats a block of instructions while its iteration rule or condition allows it." };
  if (/^(return|break|continue|pass)\b/.test(s)) {
    const word = s.match(/^(return|break|continue|pass)/)[1];
    const explanations = {
      return: "This returns a value from a function, or exits the function when no value is supplied.",
      break: "This exits the nearest loop or switch statement.",
      continue: "This skips the rest of the current loop iteration and moves to the next iteration.",
      pass: "In Python, pass is a placeholder statement that performs no action."
    };
    return { category: "Control flow", explanation: explanations[word] };
  }
  if (/^(print\s*\(|console\.log\s*\(|System\.out\.print|printf\s*\(|cout\s*<<)/.test(s)) return { category: "Output", explanation: "This sends information to the program's output, such as text or the value of a variable." };
  if (/^(input\s*\(|scanf\s*\(|cin\s*>>|readline\b)/.test(s)) return { category: "Input", explanation: "This reads input so the program can receive data from a user or another input source." };
  if (/^(const|let|var)\s+/.test(s) || /^(int|float|double|char|boolean|String|string|long|short|byte)\s+\w+\s*(=|;|,)/.test(s) || /^\w+\s*=\s*[^=]/.test(s)) {
    return { category: "Variable", explanation: "This creates or updates a variable, a named place to store a value. The expression on the right side is assigned to the name on the left." };
  }
  if (/^[{}()[\];]+$/.test(s) || /[{}]\s*$/.test(s) || s === "}" || s === "};") return { category: "Structure", explanation: "This punctuation marks a block or statement boundary. Braces commonly group the statements belonging to a function, condition, class, or loop." };
  if (/^[\w.]+\s*\(.*\)\s*;?$/.test(s)) return { category: "Function call", explanation: "This appears to call a function or method. The values inside parentheses, if any, are passed as arguments." };
  if (/\+\+|--|\+=|-=|\*=|\/=/.test(s)) return { category: "Update", explanation: "This updates a value. Operators such as ++, --, and += are shorthand for common arithmetic updates." };
  if (/[=<>!]=?|&&|\|\||\b(and|or|not)\b/.test(s)) return { category: "Expression", explanation: "This line contains an expression or operator. Operators compare values, combine conditions, or calculate a result." };
  if (s.startsWith("}") || s.startsWith("{")) return { category: "Structure", explanation: "This brace opens or closes a block of code." };
  return { category: "Statement", explanation: "This is a program statement. The analyzer could not confidently identify its exact purpose, so check the surrounding code and language documentation." };
}

function summarize(code, language, lines) {
  const trimmed = code.trim();
  const hasLoop = lines.some((line) => line.category === "Loop");
  const hasCondition = lines.some((line) => line.category === "Condition");
  const hasFunction = lines.some((line) => line.category === "Function");
  const hasInput = lines.some((line) => line.category === "Input");
  const hasOutput = lines.some((line) => line.category === "Output");
  const hasVariables = lines.some((line) => line.category === "Variable");
  const parts = [];
  parts.push(`This ${language === "cpp" ? "C++" : language === "javascript" ? "JavaScript" : language} snippet has ${code.split("\n").length} line(s) and ${trimmed.length} non-space character(s).`);
  if (hasVariables) parts.push("It stores or updates data using variables.");
  if (hasCondition) parts.push("It includes decision-making logic.");
  if (hasLoop) parts.push("It repeats instructions using a loop.");
  if (hasFunction) parts.push("It declares a function or method.");
  if (hasInput) parts.push("It appears to read input.");
  if (hasOutput) parts.push("It appears to display output.");
  if (parts.length === 1) parts.push("The rule-based analyzer provides a line-by-line guide to recognizable syntax, but may not infer the full program goal.");
  return parts.join(" ");
}

function analyzeCode(language, code) {
  if (!LANGUAGES.has(language)) {
    const error = new Error("Choose one supported language: C, C++, Java, Python, or JavaScript.");
    error.status = 400;
    throw error;
  }
  if (typeof code !== "string" || !code.trim()) {
    const error = new Error("Code cannot be empty.");
    error.status = 400;
    throw error;
  }
  if (code.length > 20000) {
    const error = new Error("Code must be 20,000 characters or fewer.");
    error.status = 400;
    throw error;
  }

  const sourceLines = code.replace(/\r\n?/g, "\n").split("\n");
  const lines = sourceLines.map((line, index) => {
    const result = classifyLine(line, language);
    return { lineNumber: index + 1, code: line, category: result.category, explanation: result.explanation };
  });
  const tips = [
    "Read the code from top to bottom and track how variable values change.",
    "Try changing one input or value and predict the output before running the program.",
    "This is a rule-based explanation, not a compiler: syntax errors and program correctness are not verified."
  ];
  if (lines.some((line) => line.category === "Loop")) tips[0] = "For each loop, identify its start value, stopping condition, and update step.";
  return { summary: summarize(code, language, lines), lines, tips };
}

function makeTitle(code) {
  const firstMeaningful = code.split(/\r?\n/).map((line) => line.trim()).find((line) => line && !line.startsWith("//") && !line.startsWith("#"));
  if (!firstMeaningful) return "Code explanation";
  return firstMeaningful.length > 70 ? `${firstMeaningful.slice(0, 67)}...` : firstMeaningful;
}

module.exports = { analyzeCode, makeTitle, LANGUAGES };
