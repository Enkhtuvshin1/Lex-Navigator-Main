import { useEffect, useRef, useState } from "react";
import { Scale, Send, Plus, MessageSquare, BookOpen, ChevronLeft, UserCircle, LogOut, Trash2, Pencil, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import ReferencePanel from "@/components/ReferencePanel";
import { useAuth } from "@/contexts/AuthContext";
import {
  getChatHistory,
  createCase,
  getCaseMessages,
  sendMessage,
  getSuggestions,
  deleteCase,
  renameCase,
  type CasePublic,
  type MessagePublic,
} from "@/lib/api";
import { toast } from "sonner";

const LOADING_TEXTS = [
  "Таны хэргийг шинжилж байна",
  "Хуулийн заалт хайж байна",
  "Дүн шинжилгээ хийж байна",
  "Хариулт бэлтгэж байна",
];

const ChatPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState<CasePublic[]>([]);
  const [activeCase, setActiveCase] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessagePublic[]>([]);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [refPanelOpen, setRefPanelOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [feedback, setFeedback] = useState<Record<string, "like" | "dislike" | null>>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cycle loading text while waiting for AI response
  useEffect(() => {
    if (!isLoading) { setLoadingTextIndex(0); return; }
    const interval = setInterval(() => {
      setLoadingTextIndex((prev) => (prev + 1) % LOADING_TEXTS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Load case history on mount
  useEffect(() => {
    getChatHistory()
      .then((data) => {
        setCases(data);
        if (data.length > 0) {
          setActiveCase(data[0].id);
        }
      })
      .catch(() => toast.error("Түүх ачаалахад алдаа гарлаа."))
      .finally(() => setLoadingHistory(false));
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

  const handleSignOut = () => {
    signOut();
    navigate("/");
  };

  const handleStartRename = (e: React.MouseEvent, c: CasePublic) => {
    e.stopPropagation();
    setEditingCaseId(c.id);
    setEditingTitle(c.title ?? "");
  };

  const handleRename = async (caseId: string) => {
    const title = editingTitle.trim();
    setEditingCaseId(null);
    if (!title) return;
    try {
      const updated = await renameCase(caseId, title);
      setCases((prev) => prev.map((c) => (c.id === caseId ? updated : c)));
    } catch (err: any) {
      toast.error(err.message ?? "Нэр солиход алдаа гарлаа.");
    }
  };

  const handleDeleteCase = async (e: React.MouseEvent, caseId: string) => {
    e.stopPropagation();
    try {
      await deleteCase(caseId);
      setCases((prev) => prev.filter((c) => c.id !== caseId));
      if (activeCase === caseId) {
        const remaining = cases.filter((c) => c.id !== caseId);
        setActiveCase(remaining.length > 0 ? remaining[0].id : null);
        setMessages([]);
      }
      toast.success("Яриа устгагдлаа.");
    } catch (err: any) {
      toast.error(err.message ?? "Устгахад алдаа гарлаа.");
    }
  };

  const handleRetry = async (assistantMsgId: string) => {
    const idx = messages.findIndex((m) => m.id === assistantMsgId);
    if (idx <= 0 || !activeCase) return;
    const userMsg = messages[idx - 1];
    if (userMsg.role !== "user") return;
    setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
    setIsLoading(true);
    try {
      const aiMsg = await sendMessage(activeCase, userMsg.content);
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      toast.error(err.message ?? "Дахин илгээхэд алдаа гарлаа.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (override?: string) => {
    const content = override ?? input;
    if (!content.trim()) return;
    if (!override) setInput("");

    // Create a case automatically if none exists
    let caseId = activeCase;
    if (!caseId) {
      try {
        const newCase = await createCase(content.slice(0, 50));
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
      content,
      law_references: [],
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setSuggestions([]);
    setIsLoading(true);

    // Auto-title the case from the first user message if it has no title
    const currentCase = cases.find((c) => c.id === caseId);
    if (currentCase && !currentCase.title && messages.length === 0) {
      renameCase(caseId, content.slice(0, 50))
        .then((updated) => setCases((prev) => prev.map((c) => (c.id === caseId ? updated : c))))
        .catch(() => {});
    }

    try {
      const aiMsg = await sendMessage(caseId, content);
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempUserMsg.id);
        return [...withoutTemp, tempUserMsg, aiMsg];
      });
      getSuggestions(content, aiMsg.content)
        .then((res) => setSuggestions(res.questions.slice(0, 2)))
        .catch(() => {});
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

  const panelReferences = latestRefs.map((ref) => ({
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
            <Button variant="outline" size="sm">Монгол улсын хууль</Button>
          </Link>
          {user && (
            <>
              <div className="flex items-center gap-1.5 rounded-md border px-2 py-1">
                <UserCircle className="h-5 w-5 text-primary" />
                <span className="hidden text-xs font-medium text-foreground sm:inline">
                  {user.full_name ?? user.email}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Гарах" className="h-8 w-8">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
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
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : cases.length === 0 ? (
                <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                  Яриа байхгүй байна. Шинэ яриа эхлүүлнэ үү.
                </div>
              ) : (
                cases.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => { if (editingCaseId !== c.id) setActiveCase(c.id); }}
                    className={`group mb-1 flex w-full items-start gap-2 rounded-md px-3 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                      activeCase === c.id
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      {editingCaseId === c.id ? (
                        <input
                          autoFocus
                          className="w-full rounded border border-primary bg-background px-1 py-0 text-sm text-foreground outline-none"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => handleRename(c.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(c.id);
                            if (e.key === "Escape") setEditingCaseId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <>
                          <div className="truncate font-medium">{c.title ?? "Шинэ хэрэг"}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(c.created_at).toLocaleDateString()}
                          </div>
                        </>
                      )}
                    </div>
                    {editingCaseId !== c.id && (
                      <div className="ml-auto flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleStartRename(e, c)}
                          className="rounded p-0.5 hover:text-primary"
                          title="Нэр солих"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteCase(e, c.id)}
                          className="rounded p-0.5 hover:text-destructive"
                          title="Устгах"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </aside>
        )}

        {/* Chat area */}
        <main className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Scale className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <h2 className="mb-2 text-lg font-semibold text-foreground">Хуулийн Оюун AI</h2>
                  <p className="mb-1 max-w-md text-sm text-muted-foreground">
                    Монгол Улсын хууль тогтоомжийн дагуу эрх зүйн хэргийг шинжлэхэд тань туслахад бэлэн байна.
                  </p>
                  <p className="max-w-md text-xs text-muted-foreground">
                    Эрх зүйн нөхцөл байдлаа доор бичнэ үү.
                  </p>
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
                    {msg.role === "assistant" && (
                      <div className="mt-2 flex items-center gap-1 border-t pt-2">
                        <button
                          onClick={() => setFeedback((prev) => ({ ...prev, [msg.id]: prev[msg.id] === "like" ? null : "like" }))}
                          className={`rounded p-1 transition-colors hover:text-green-500 ${feedback[msg.id] === "like" ? "text-green-500" : "text-muted-foreground"}`}
                          title="Таалагдсан"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setFeedback((prev) => ({ ...prev, [msg.id]: prev[msg.id] === "dislike" ? null : "dislike" }))}
                          className={`rounded p-1 transition-colors hover:text-red-500 ${feedback[msg.id] === "dislike" ? "text-red-500" : "text-muted-foreground"}`}
                          title="Таалагдаагүй"
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleRetry(msg.id)}
                          disabled={isLoading}
                          className="rounded p-1 text-muted-foreground transition-colors hover:text-primary disabled:opacity-40"
                          title="Дахин оролдох"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-md border bg-card px-4 py-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                        <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                        <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                      </div>
                      <span className="transition-opacity duration-500">{LOADING_TEXTS[loadingTextIndex]}...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Suggested follow-up questions */}
          {suggestions.length > 0 && !isLoading && (
            <div className="border-t bg-card px-4 py-2">
              <div className="mx-auto max-w-3xl flex flex-wrap gap-2">
                {suggestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

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
              <Button onClick={() => handleSend()} disabled={!input.trim() || isLoading} size="icon" className="h-10 w-10 shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </main>

        {/* Reference panel */}
        {refPanelOpen && panelReferences.length > 0 && (
          <ReferencePanel references={panelReferences} onClose={() => setRefPanelOpen(false)} />
        )}
      </div>

      <DisclaimerBanner />
    </div>
  );
};

export default ChatPage;
