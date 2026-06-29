import { useState } from "react";
import { Scale, ArrowLeft, BookOpen, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import { useAuth } from "@/contexts/AuthContext";

interface LawCategory {
  id: string;
  title: string;
  description: string;
  articles: { code: string; title: string }[];
}

const lawCategories: LawCategory[] = [
  {
    id: "criminal",
    title: "Эрүүгийн хууль",
    description: "Монгол Улсын Эрүүгийн хуулийн бүлэг, зүйлүүд",
    articles: [
      { code: "1.1", title: "Эрүүгийн хуулийн зорилт" },
      { code: "1.2", title: "Эрүүгийн хууль тогтоомж" },
      { code: "2.1", title: "Гэмт хэргийн ойлголт" },
      { code: "2.2", title: "Гэмт хэргийн ангилал" },
      { code: "3.1", title: "Эрүүгийн хариуцлага" },
      { code: "3.2", title: "Ял шийтгэлийн зорилго" },
      { code: "4.1", title: "Хүний эрхийн эсрэг гэмт хэрэг" },
      { code: "5.1", title: "Өмчийн эсрэг гэмт хэрэг" },
    ],
  },
  {
    id: "civil",
    title: "Иргэний хууль",
    description: "Монгол Улсын Иргэний хуулийн бүлэг, зүйлүүд",
    articles: [
      { code: "1.1", title: "Иргэний хуулийн зохицуулах харилцаа" },
      { code: "1.2", title: "Иргэний эрх зүйн зарчим" },
      { code: "2.1", title: "Иргэний эрх зүйн чадвар" },
      { code: "2.2", title: "Иргэний эрх зүйн чадамж" },
      { code: "3.1", title: "Хэлцэл" },
      { code: "3.2", title: "Гэрээ" },
      { code: "4.1", title: "Өмчлөх эрх" },
      { code: "5.1", title: "Хохирлоос үүсэх үүрэг" },
    ],
  },
  {
    id: "administrative",
    title: "Захиргааны хууль",
    description: "Монгол Улсын Захиргааны хуулийн бүлэг, зүйлүүд",
    articles: [
      { code: "1.1", title: "Хуулийн зорилт, хамрах хүрээ" },
      { code: "1.2", title: "Захиргааны эрх зүйн зарчим" },
      { code: "2.1", title: "Захиргааны акт" },
      { code: "2.2", title: "Захиргааны гэрээ" },
      { code: "3.1", title: "Захиргааны хэрэг хянан шийдвэрлэх" },
      { code: "3.2", title: "Нэхэмжлэл гаргах" },
      { code: "4.1", title: "Захиргааны хариуцлага" },
      { code: "4.2", title: "Давж заалдах журам" },
    ],
  },
];

const DashboardPage = () => {
  const { user } = useAuth();
  const [selectedLaw, setSelectedLaw] = useState<string | null>(null);

  const activeLaw = lawCategories.find((l) => l.id === selectedLaw);

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
            <span className="text-sm font-medium text-foreground">Монгол улсын хууль</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to={user ? "/chat" : "/login"}>
              <Button size="sm">Шинэ зөвлөгөө</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-10">
        <div className="container">
          {!selectedLaw ? (
            <>
              <div className="mb-10">
                <h1 className="text-3xl font-bold text-foreground">Монгол улсын хууль</h1>
                <p className="mt-2 text-muted-foreground">
                  Хуулийн ангиллаас сонгоно уу.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {lawCategories.map((law) => (
                  <button
                    key={law.id}
                    onClick={() => setSelectedLaw(law.id)}
                    className="group rounded-lg border-2 border-border bg-card p-8 text-left transition-all hover:border-primary/40 hover:shadow-lg"
                  >
                    <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                      <BookOpen className="h-7 w-7 text-primary" />
                    </div>
                    <h2 className="mb-2 text-xl font-bold text-foreground">{law.title}</h2>
                    <p className="text-sm text-muted-foreground">{law.description}</p>
                    <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Дэлгэрэнгүй <ChevronRight className="h-4 w-4" />
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="mb-8 flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setSelectedLaw(null)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{activeLaw?.title}</h1>
                  <p className="text-sm text-muted-foreground">{activeLaw?.description}</p>
                </div>
              </div>

              <div className="rounded-lg border bg-card">
                {activeLaw?.articles.map((article, i) => (
                  <div
                    key={article.code}
                    className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50 ${
                      i !== (activeLaw.articles.length - 1) ? "border-b" : ""
                    }`}
                  >
                    <span className="rounded bg-primary/10 px-2.5 py-1 font-mono text-xs font-semibold text-primary">
                      {article.code}
                    </span>
                    <span className="text-sm font-medium text-foreground">{article.title}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <DisclaimerBanner />
    </div>
  );
};

export default DashboardPage;
