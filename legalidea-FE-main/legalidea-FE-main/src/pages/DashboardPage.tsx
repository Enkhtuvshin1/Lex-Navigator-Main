import { useEffect, useState } from "react";
import { Scale, ArrowLeft, BookOpen, ChevronRight, Search, UserCircle, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  getLawCategories,
  getCategoryArticles,
  getArticle,
  searchLaw,
  type LawCategory,
  type LawArticleSummary,
  type LawArticleFull,
} from "@/lib/api";

const DashboardPage = () => {
  const { user, signOut } = useAuth();
  const [categories, setCategories] = useState<LawCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<LawCategory | null>(null);
  const [articles, setArticles] = useState<LawArticleSummary[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<LawArticleFull | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LawArticleSummary[] | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    getLawCategories()
      .then(setCategories)
      .catch(() => toast.error("Ангилал ачаалахад алдаа гарлаа."))
      .finally(() => setLoadingCategories(false));
  }, []);

  const handleSelectCategory = async (cat: LawCategory) => {
    setSelectedCategory(cat);
    setSelectedArticle(null);
    setSearchResults(null);
    setLoadingArticles(true);
    try {
      const data = await getCategoryArticles(cat.id);
      setArticles(data);
    } catch {
      toast.error("Зүйл заалт ачаалахад алдаа гарлаа.");
    } finally {
      setLoadingArticles(false);
    }
  };

  const handleSelectArticle = async (id: number) => {
    setLoadingArticle(true);
    try {
      const data = await getArticle(id);
      setSelectedArticle(data);
    } catch {
      toast.error("Зүйл заалт ачаалахад алдаа гарлаа.");
    } finally {
      setLoadingArticle(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSelectedCategory(null);
    setSelectedArticle(null);
    try {
      const results = await searchLaw(searchQuery);
      setSearchResults(results);
    } catch {
      toast.error("Хайлт амжилтгүй боллоо.");
    } finally {
      setSearching(false);
    }
  };

  const handleBack = () => {
    if (selectedArticle) {
      setSelectedArticle(null);
    } else if (selectedCategory) {
      setSelectedCategory(null);
      setArticles([]);
    } else if (searchResults) {
      setSearchResults(null);
    }
  };

  const showBack = selectedCategory || selectedArticle || searchResults;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">LexNavigator</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium text-foreground">Хууль Зүйн Портал</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/chat">
              <Button size="sm">Шинэ зөвлөгөө</Button>
            </Link>
            {user && (
              <>
                <Link to="/chat" className="flex items-center">
                  <UserCircle className="h-6 w-6 text-primary" />
                </Link>
                <Button variant="ghost" size="icon" onClick={signOut} title="Гарах">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-10">
        <div className="container">
          {/* Search bar */}
          <form onSubmit={handleSearch} className="mb-8 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Хуулиас хайх..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={searching || !searchQuery.trim()}>
              {searching ? "Хайж байна..." : "Хайх"}
            </Button>
          </form>

          {/* Back button */}
          {showBack && (
            <div className="mb-6">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="mr-1 h-4 w-4" />
                Буцах
              </Button>
            </div>
          )}

          {/* Article detail view */}
          {selectedArticle ? (
            <div>
              <div className="mb-4">
                <span className="rounded bg-primary/10 px-2.5 py-1 font-mono text-xs font-semibold text-primary">
                  {selectedArticle.number} зүйл
                </span>
              </div>
              <h1 className="mb-4 text-2xl font-bold text-foreground">{selectedArticle.title}</h1>
              {loadingArticle ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <div className="rounded-lg border bg-card p-6">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {selectedArticle.content}
                  </div>
                </div>
              )}
            </div>
          ) : selectedCategory ? (
            /* Article list for selected category */
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">{selectedCategory.name}</h1>
                {selectedCategory.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{selectedCategory.description}</p>
                )}
              </div>
              {loadingArticles ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : articles.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">Зүйл заалт олдсонгүй.</p>
              ) : (
                <div className="rounded-lg border bg-card">
                  {articles.map((article, i) => (
                    <button
                      key={article.id}
                      onClick={() => handleSelectArticle(article.id)}
                      className={`flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-muted/50 ${
                        i !== articles.length - 1 ? "border-b" : ""
                      }`}
                    >
                      <span className="rounded bg-primary/10 px-2.5 py-1 font-mono text-xs font-semibold text-primary">
                        {article.number}
                      </span>
                      <span className="flex-1 text-sm font-medium text-foreground">{article.title}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : searchResults ? (
            /* Search results */
            <div>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Хайлтын үр дүн ({searchResults.length})
              </h2>
              {searchResults.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">Үр дүн олдсонгүй.</p>
              ) : (
                <div className="rounded-lg border bg-card">
                  {searchResults.map((article, i) => (
                    <button
                      key={article.id}
                      onClick={() => handleSelectArticle(article.id)}
                      className={`flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-muted/50 ${
                        i !== searchResults.length - 1 ? "border-b" : ""
                      }`}
                    >
                      <span className="rounded bg-primary/10 px-2.5 py-1 font-mono text-xs font-semibold text-primary">
                        {article.number}
                      </span>
                      <span className="flex-1 text-sm font-medium text-foreground">{article.title}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Category grid */
            <>
              <div className="mb-10">
                <h1 className="text-3xl font-bold text-foreground">Монгол улсын хууль</h1>
                <p className="mt-2 text-muted-foreground">
                  Хуулийн ангиллаас сонгоно уу.
                </p>
              </div>

              {loadingCategories ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : categories.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">Ангилал олдсонгүй.</p>
              ) : (
                <div className="grid gap-6 md:grid-cols-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat)}
                      className="group rounded-lg border-2 border-border bg-card p-8 text-left transition-all hover:border-primary/40 hover:shadow-lg"
                    >
                      <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                        <BookOpen className="h-7 w-7 text-primary" />
                      </div>
                      <h2 className="mb-2 text-xl font-bold text-foreground">{cat.name}</h2>
                      <p className="text-sm text-muted-foreground">{cat.description ?? ""}</p>
                      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        Дэлгэрэнгүй <ChevronRight className="h-4 w-4" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <DisclaimerBanner />
    </div>
  );
};

export default DashboardPage;
