import { useState } from "react";

type LanguageKey = "javascript" | "typescript" | "python3" | "java" | "cpp";

// Judge0 CE language IDs (https://judge0.com/)
const LANGUAGE_IDS: Record<LanguageKey, number> = {
  javascript: 63, // Node.js 14.15.4
  typescript: 74, // TypeScript 3.7.4
  python3: 71, // Python 3.8.1
  java: 62, // OpenJDK 13.0.1
  cpp: 54, // C++ (GCC 9.2.0)
};

const JUDGE0_API_URL =
  import.meta.env.VITE_JUDGE0_API_URL || "https://ce.judge0.com";

export const usePiston = () => {
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const runCode = async (code: string, language: LanguageKey, input: string) => {
    setIsLoading(true);
    setOutput("");
    setError("");

    try {
      const languageId = LANGUAGE_IDS[language];
      if (!languageId) {
        throw new Error("Unsupported language.");
      }

      const body = {
        language_id: languageId,
        source_code: code,
        stdin: input,
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const response = await fetch(
        `${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`,
        {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const result = await response.json();

      if (result.stdout) {
        setOutput(result.stdout);
      } else if (result.stderr) {
        setError(result.stderr);
      } else if (result.compile_output) {
        setError(result.compile_output);
      } else {
        setError("No output received.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while running the code.");
    } finally {
      setIsLoading(false);
    }
  };

  return { runCode, output, error, isLoading };
};
