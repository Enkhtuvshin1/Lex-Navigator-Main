import { Link } from "react-router-dom";
import { Scale, ArrowRight, Search, Shield, FileText, ExternalLink, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import { useAuth } from "@/contexts/AuthContext";

const features = [
  {
    icon: Search,
    title: "Кейс харьцуулалт ба \"Шүүхийн жишиг\" хайлт",
    description:
      "AI ашиглан ижил төстэй шүүхийн шийдвэрүүдийг секундын дотор шүүж, харьцуулна.",
  },
  {
    icon: Shield,
    title: "Шүүх хуралд бэлтгэх 'Strategic Partner'",
    description:
      "Прокурорын яллах дүгнэлтэд няцаалт бэлтгэж, стратегийн асуултууд боловсруулна.",
  },
  {
    icon: FileText,
    title: "Баримт бичгийн дүн шинжилгээ",
    description:
      "Олон хуудас бүхий хавтаст хэргийг AI-аар уншуулж, зөрүүтэй мэдүүлэг болон чухал баримтуудыг илрүүлнэ.",
  },
];

const LandingPage = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Навигаци */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-foreground">LexNavigator</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">Монгол улсын хууль</Button>
            </Link>
            {user ? (
              <>
                <Link to="/chat">
                  <Button size="sm">
                    Зөвлөгөө авах
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/chat" className="flex items-center gap-2">
                  <UserCircle className="h-7 w-7 text-primary" />
                </Link>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  Гарах
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">Нэвтрэх</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">
                    Бүртгүүлэх
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero – Full screen */}
      <section className="flex min-h-screen items-center justify-center pt-16">
        <div className="container py-24 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border bg-card px-5 py-2 text-sm text-muted-foreground shadow-sm">
              <Scale className="h-4 w-4 text-primary" />
              Хиймэл оюунд суурилсан эрх зүйн систем
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-tight">
              LexNavigator:
              <span className="text-gradient"> Таны хууль зүйн</span>
              <br />
              ухаалаг туслах
            </h1>
            <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Монгол Улсын хуулийн мэргэжилтнүүдэд зориулсан дэвшилтэт AI платформ. Шүүхийн жишиг хайлт, стратеги боловсруулалт, баримт бичгийн шинжилгээг нэг дороос.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              {user ? (
                <Link to="/chat">
                  <Button size="lg" className="h-12 px-8 text-base">
                    Зөвлөгөө авах
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" className="h-12 px-8 text-base">
                      Бүртгүүлэх
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                      Нэвтрэх
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Онцлогууд – 3 cards */}
      <section className="border-t bg-card py-24">
        <div className="container">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              Хуулийн мэргэжилтнүүдэд зориулав
            </h2>
            <p className="text-muted-foreground">
              Таны ажлыг хурдасгах гурван үндсэн хэрэгсэл.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-lg border bg-background p-8 transition-all hover:border-primary/30 hover:shadow-lg"
              >
                <div className="mb-5 inline-flex rounded-lg bg-primary/10 p-3">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-12">
        <div className="container">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">LexNavigator</span>
            </div>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <a
                href="https://shuukh.mn"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                shuukh.mn – Шүүхийн шийдвэрийн цахим сан
              </a>
              <span className="hidden text-muted-foreground sm:inline">·</span>
              <a
                href="https://legalinfo.mn"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                legalinfo.mn – Хууль зүйн мэдээллийн сан
              </a>
            </div>
          </div>
          <div className="mt-8 text-center text-xs text-muted-foreground">
            © 2026 LexNavigator. Бүх эрх хуулиар хамгаалагдсан.
          </div>
        </div>
      </footer>

      <DisclaimerBanner />
    </div>
  );
};

export default LandingPage;
