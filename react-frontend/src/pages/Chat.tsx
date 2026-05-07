import { useState, useEffect, useRef } from "react";
import { PaperPlaneIcon, UserCircleIcon, BoltIcon } from "../icons";

// Simple helper to render **bold** text only
const renderBoldText = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Prepare assistant message ID
    const assistantMessageId = (Date.now() + 1).toString();
    let assistantMessageAdded = false;
    let firstContentReceived = false;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversation_history: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  accumulatedContent += parsed.content;
                  
                  // On first content, hide loading indicator and add message
                  if (!firstContentReceived) {
                    firstContentReceived = true;
                    setIsLoading(false);
                    
                    const assistantMessage: Message = {
                      id: assistantMessageId,
                      role: "assistant",
                      content: accumulatedContent,
                      timestamp: new Date(),
                    };
                    setMessages((prev) => [...prev, assistantMessage]);
                    assistantMessageAdded = true;
                  } else {
                    // Update the assistant message with accumulated content
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId
                          ? { ...msg, content: accumulatedContent }
                          : msg
                      )
                    );
                  }
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      // If no content was received, show error
      if (!accumulatedContent) {
        setIsLoading(false);
        const errorMessage: Message = {
          id: assistantMessageId,
          role: "assistant",
          content: "Maaf, saya tidak dapat menjawab pada masa ini.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setIsLoading(false);
      const errorMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "Maaf, berlaku ralat. Sila cuba lagi.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] overflow-hidden">
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          AI Chat
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Berbual dengan AI untuk bantuan laporan kemalangan
        </p>
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-xl dark:border-gray-800 dark:bg-gray-dark min-h-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-4 mb-4 bg-gray-200 dark:bg-gray-700 rounded-full">
                <BoltIcon className="w-8 h-8 text-gray-600 dark:text-gray-300" />
              </div>
              <h3 className="mb-1 text-lg font-medium text-gray-800 dark:text-white/90">
                Selamat Datang ke AI Chat
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                Tanya saya apa-apa tentang proses laporan kemalangan, dokumen yang diperlukan, atau sebarang pertanyaan lain.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <BoltIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
              )}
              
              <div
                className={`max-w-[70%] rounded-xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary-500 text-gray-800 dark:bg-primary-600 dark:text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white/90 rounded-bl-none"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">
                  {message.role === "assistant"
                    ? renderBoldText(message.content)
                    : message.content}
                </p>
                {message.content && (
                  <p
                    className={`text-xs mt-1 ${
                      message.role === "user"
                        ? "text-gray-600 dark:text-white/70"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString("ms-MY", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>

              {message.role === "user" && (
                <div className="flex-shrink-0 w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                  <UserCircleIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <BoltIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-xl rounded-bl-none px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Taip mesej anda di sini..."
              className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl disabled:cursor-not-allowed"
            >
              <PaperPlaneIcon className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
