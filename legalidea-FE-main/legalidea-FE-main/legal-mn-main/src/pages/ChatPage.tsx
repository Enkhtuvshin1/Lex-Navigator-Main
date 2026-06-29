import { useEffect, useState } from "react";
import { Scale, Send, Plus, MessageSquare, BookOpen, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import ReferencePanel from "@/components/ReferencePanel";
import {
  getChatHistory,
  createCase,
  getCaseMessages,
  sendMessage,
  type CasePublic,
  type MessagePublic,
} from "@/lib/api";
import { toast } from "sonner";

const ChatPage = () => {
  const [cases, setCases] = useState<CasePublic[]>([]);
  const [activeCase, setActiveCase] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessagePublic[]>([]);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [refPanelOpen, setRefPanelOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Load case history on mount
  useEffect(() => {
    getChatHistory()
      .then((data) => {
        setCases(data);
        if (data.length > 0) {
          setActiveCase(data[0].id);
        }
      })
      .catch(() => toast.error("Түүх ачаалахад алдаа гарлаа."));
  }, []);

  // Load messages when active case changes
  useEffect(() => {
    if (!activeCase) {
      setMessages([]);
      return;
    }
    getCaseMessages(activeCase)
      .then(setMessages)
      .catch(() => toast.error("Мессеж ачаалахад алдаа гарлаа."));
  }, [activeCase]);

  const handleNewCase = async () => {
    try {
      const newCase = await createCase();
      setCases((prev) => [newCase, ...prev]);
      setActiveCase(newCase.id);
      setMessages([]);
    } catch {
      toast.error("Шинэ хэрэг үүсгэхэд алдаа гарлаа.");
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    // Create a case automatically if none exists
    let caseId = activeCase;
    if (!caseId) {
      try {
        const newCase = await createCase(input.slice(0, 50));
        setCases((prev) => [newCase, ...prev]);
        caseId = newCase.id;
        setActiveCase(caseId);
      } catch {
        toast.error("Хэрэг үүсгэхэд алдаа гарлаа.");
        return;
      }
    }

    // Optimistically show user message
    const tempUserMsg: MessagePublic = {
      id: `temp-${Date.now()}`,
      case_id: caseId,
      role: "user",
      content: input,
      law_references: [],
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const aiMsg = await sendMessage(caseId, input);
      // Replace temp message and add AI response
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempUserMsg.id);
        // Add the real user message (it's stored server-side, returned via aiMsg's case)
        return [...withoutTemp, tempUserMsg, aiMsg];
      });
    } catch (err: any) {
      toast.error(err.message ?? "Мессеж илгээхэд алдаа гарлаа.");
    } finally {
      setIsLoading(false);
    }
  };

  // Collect law references from the latest assistant message
  const latestRefs = [...messages]
    .reverse()
    .find((m) => m.role === "assistant" && m.law_references.length > 0)?.law_references ?? [];

  const sampleReferences = latestRefs.map((ref) => ({
    id: String(ref.id),
    code: "",
    article: `${ref.number} зүйл`,
    title: ref.title,
    excerpt: "",
  }));

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b bg-card px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-8 w-8"
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
          </Button>
          <Link to="/" className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Хуулийн Оюун AI</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRefPanelOpen(!refPanelOpen)}
            className="hidden md:inline-flex"
          >
            <BookOpen className="mr-1 h-4 w-4" />
            Заалтууд
          </Button>
          <Link to="/dashboard">
            <Button variant="outline" size="sm">Хуульчийн самбар</Button>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="flex w-64 flex-col border-r bg-card">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="text-sm font-medium text-foreground">Түүх</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" title="Шинэ яриа эхлүүлэх" onClick={handleNewCase}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {cases.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCase(c.id)}
                  className={`mb-1 flex w-full items-start gap-2 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
                    activeCase === c.id
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{c.title ?? "Шинэ хэрэг"}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Chat area */}
        <main className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.length === 0 && !isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-md border bg-card px-4 py-3 text-sm leading-relaxed text-card-foreground">
                    <div className="whitespace-pre-wrap">
                      Хуулийн Оюун AI-д тавтай морил. Би Монгол Улсын хууль тогтоомжийн дагуу эрх зүйн хэргийг шинжлэхэд тань туслахад бэлэн байна. Эрх зүйн нөхцөл байдлаа тайлбарлана уу.
                    </div>
                  </div>
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-md px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border bg-card text-card-foreground"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-md border bg-card px-4 py-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                      Таны хэргийг шинжилж байна...
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="border-t bg-card px-4 py-4">
            <div className="mx-auto flex max-w-3xl items-end gap-3">
              <div className="flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Болсон явдлаа энд дэлгэрэнгүй бичнэ үү..."
                  rows={1}
                  className="w-full resize-none rounded-md border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="icon" className="h-10 w-10 shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </main>

        {/* Reference panel */}
        {refPanelOpen && sampleReferences.length > 0 && (
          <ReferencePanel references={sampleReferences} onClose={() => setRefPanelOpen(false)} />
        )}
      </div>

      <DisclaimerBanner />
    </div>
  );
};

export default ChatPage;
