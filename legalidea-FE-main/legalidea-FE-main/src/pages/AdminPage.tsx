import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Shield,
  Trash2,
  UserCog,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  adminCreateLawArticle,
  adminCreateLawCategory,
  adminDeleteLawArticle,
  adminDeleteLawCategory,
  adminGetCategoryArticles,
  adminGetLawCategories,
  adminLogin,
  deleteAdminCase,
  getAdminCases,
  getAdminUsers,
  updateAdminUser,
  type CaseAdminItem,
  type LawArticleFull,
  type LawArticleSummary,
  type LawCategory,
  type UserPublic,
} from "@/lib/api";

// ── User admin ────────────────────────────────────────────────────────────────

type AdminForm = {
  email: string;
  full_name: string;
  role: "user" | "lawyer";
  is_active: boolean;
  bar_number: string;
  specialization: string;
  law_firm: string;
};

const toForm = (user: UserPublic): AdminForm => ({
  email: user.email,
  full_name: user.full_name ?? "",
  role: user.role === "lawyer" ? "lawyer" : "user",
  is_active: user.is_active,
  bar_number: user.bar_number ?? "",
  specialization: user.specialization ?? "",
  law_firm: user.law_firm ?? "",
});

// ── Login page ────────────────────────────────────────────────────────────────

function LoginView({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) { toast.error("Нэвтрэх нэр болон нууц үгийг оруулна уу."); return; }
    setLoading(true);
    try {
      const res = await adminLogin(username.trim(), password);
      localStorage.setItem("admin_access_token", res.access_token);
      onLogin(res.access_token);
    } catch (err: any) {
      toast.error(err.message ?? "Нэвтрэх амжилтгүй.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-foreground">LexNavigator Admin</span>
          </Link>
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Admin нэвтрэх</CardTitle>
            <CardDescription>Системд нэвтрэх мэдээллээ оруулна уу.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium" htmlFor="u">Нэвтрэх нэр</label>
                <Input id="u" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium" htmlFor="p">Нууц үг</label>
                <Input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <Shield className="mr-2 h-4 w-4" />
                {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Users tab ─────────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserPublic | null>(null);
  const [form, setForm] = useState<AdminForm | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAdminUsers();
      setUsers(data);
      if (selectedUser) {
        const refreshed = data.find((u) => u.id === selectedUser.id) ?? null;
        setSelectedUser(refreshed);
        setForm(refreshed ? toForm(refreshed) : null);
      }
    } catch (err: any) {
      toast.error(err.message ?? "Алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.email, u.full_name, u.role, u.bar_number, u.specialization, u.law_firm]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [query, users]);

  const handleSave = async () => {
    if (!selectedUser || !form) return;
    setSaving(true);
    try {
      const updated = await updateAdminUser(selectedUser.id, {
        email: form.email.trim(),
        full_name: form.full_name.trim() || null,
        role: form.role,
        is_active: form.is_active,
        bar_number: form.bar_number.trim() || null,
        specialization: form.specialization.trim() || null,
        law_firm: form.law_firm.trim() || null,
      });
      setUsers((cur) => cur.map((u) => (u.id === updated.id ? updated : u)));
      setSelectedUser(updated);
      setForm(toForm(updated));
      toast.success("Хэрэглэгч шинэчлэгдлээ.");
    } catch (err: any) {
      toast.error(err.message ?? "Хадгалахад алдаа гарлаа.");
    } finally {
      setSaving(false);
    }
  };

  const activeCount = users.filter((u) => u.is_active).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardDescription>Нийт хэрэглэгч</CardDescription><CardTitle>{users.length}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Идэвхтэй</CardDescription><CardTitle>{activeCount}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Идэвхгүй</CardDescription><CardTitle>{users.length - activeCount}</CardTitle></CardHeader></Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Хэрэглэгчид</CardTitle>
                <CardDescription>Бүртгэлтэй бүх хэрэглэгчид.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative md:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Хайх..." className="pl-9" />
                </div>
                <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Хэрэглэгч</TableHead>
                  <TableHead>Үүрэг</TableHead>
                  <TableHead>Төлөв</TableHead>
                  <TableHead>Огноо</TableHead>
                  <TableHead className="text-right">Үйлдэл</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id} data-state={selectedUser?.id === u.id ? "selected" : undefined}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{u.full_name || "Нэргүй"}</span>
                        <span className="text-xs text-muted-foreground">{u.email}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                    <TableCell><Badge variant={u.is_active ? "default" : "outline"}>{u.is_active ? "Идэвхтэй" : "Идэвхгүй"}</Badge></TableCell>
                    <TableCell>{new Date(u.created_at).toLocaleDateString("mn-MN")}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => { setSelectedUser(u); setForm(toForm(u)); }}>
                        <UserCog className="mr-1 h-4 w-4" />Засах
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Хэрэглэгч олдсонгүй.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Засах</CardTitle>
            <CardDescription>{selectedUser ? selectedUser.email : "Хэрэглэгч сонгоно уу."}</CardDescription>
          </CardHeader>
          <CardContent>
            {form ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">Идэвхтэй эсэх</p>
                    <p className="text-xs text-muted-foreground">Унтраавал нэвтрэх боломжгүй болно.</p>
                  </div>
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                </div>
                {(["email", "full_name", "bar_number", "specialization", "law_firm"] as const).map((field) => (
                  <div key={field} className="flex flex-col gap-2">
                    <label className="text-sm font-medium capitalize">{field.replace("_", " ")}</label>
                    <Input value={(form as any)[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
                  </div>
                ))}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Үүрэг</label>
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value === "lawyer" ? "lawyer" : "user" })}
                  >
                    <option value="user">user</option>
                    <option value="lawyer">lawyer</option>
                  </select>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Хадгалж байна..." : "Хадгалах"}
                </Button>
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                Хүснэгтээс хэрэглэгч сонгоно уу.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Cases tab ─────────────────────────────────────────────────────────────────

function CasesTab() {
  const [cases, setCases] = useState<CaseAdminItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    try { setCases(await getAdminCases()); }
    catch (err: any) { toast.error(err.message ?? "Алдаа гарлаа."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Кейсийг устгах уу?")) return;
    try {
      await deleteAdminCase(id);
      setCases((cur) => cur.filter((c) => c.id !== id));
      toast.success("Кейс устгагдлаа.");
    } catch (err: any) {
      toast.error(err.message ?? "Устгахад алдаа гарлаа.");
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter((c) =>
      [c.title, c.status, c.user_id].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [query, cases]);

  const openCount = cases.filter((c) => c.status === "open").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardDescription>Нийт кейс</CardDescription><CardTitle>{cases.length}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Нээлттэй</CardDescription><CardTitle>{openCount}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Хаагдсан</CardDescription><CardTitle>{cases.length - openCount}</CardTitle></CardHeader></Card>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Кейсүүд</CardTitle>
              <CardDescription>Хэрэглэгчдийн бүх хуулийн зөвлөлдлөгөө.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative md:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Хайх..." className="pl-9" />
              </div>
              <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Гарчиг</TableHead>
                <TableHead>Хэрэглэгч ID</TableHead>
                <TableHead>Төлөв</TableHead>
                <TableHead>Огноо</TableHead>
                <TableHead className="text-right">Үйлдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{c.title || "Гарчиггүй"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{c.user_id.slice(0, 8)}…</TableCell>
                  <TableCell><Badge variant={c.status === "open" ? "default" : "outline"}>{c.status === "open" ? "Нээлттэй" : "Хаагдсан"}</Badge></TableCell>
                  <TableCell>{new Date(c.created_at).toLocaleDateString("mn-MN")}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Кейс олдсонгүй.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Laws tab ──────────────────────────────────────────────────────────────────

function LawsTab() {
  const [categories, setCategories] = useState<LawCategory[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [articles, setArticles] = useState<Record<number, LawArticleSummary[]>>({});
  const [loading, setLoading] = useState(false);

  const [showCatForm, setShowCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [catSaving, setCatSaving] = useState(false);

  const [articleForm, setArticleForm] = useState<{ categoryId: number; number: string; title: string; content: string } | null>(null);
  const [editArticle, setEditArticle] = useState<LawArticleFull | null>(null);
  const [articleSaving, setArticleSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setCategories(await adminGetLawCategories()); }
    catch (err: any) { toast.error(err.message ?? "Алдаа гарлаа."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleCategory = async (id: number) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!articles[id]) {
      try {
        const arts = await adminGetCategoryArticles(id);
        setArticles((prev) => ({ ...prev, [id]: arts }));
      } catch (err: any) { toast.error(err.message ?? "Алдаа гарлаа."); }
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) { toast.error("Ангиллын нэр оруулна уу."); return; }
    setCatSaving(true);
    try {
      const cat = await adminCreateLawCategory({ name: newCatName.trim(), description: newCatDesc.trim() || null });
      setCategories((prev) => [...prev, cat]);
      setNewCatName(""); setNewCatDesc(""); setShowCatForm(false);
      toast.success("Ангилал нэмэгдлээ.");
    } catch (err: any) { toast.error(err.message ?? "Алдаа гарлаа."); }
    finally { setCatSaving(false); }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Ангиллыг устгах уу? Дотор байгаа бүх заалтууд устна.")) return;
    try {
      await adminDeleteLawCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      if (expanded === id) setExpanded(null);
      toast.success("Ангилал устгагдлаа.");
    } catch (err: any) { toast.error(err.message ?? "Алдаа гарлаа."); }
  };

  const handleCreateArticle = async () => {
    if (!articleForm) return;
    if (!articleForm.number.trim() || !articleForm.title.trim() || !articleForm.content.trim()) {
      toast.error("Бүх талбарыг бөглөнө үү."); return;
    }
    setArticleSaving(true);
    try {
      const art = await adminCreateLawArticle({
        category_id: articleForm.categoryId,
        number: articleForm.number.trim(),
        title: articleForm.title.trim(),
        content: articleForm.content.trim(),
      });
      setArticles((prev) => ({
        ...prev,
        [articleForm.categoryId]: [...(prev[articleForm.categoryId] ?? []), art],
      }));
      setArticleForm(null);
      toast.success("Заалт нэмэгдлээ.");
    } catch (err: any) { toast.error(err.message ?? "Алдаа гарлаа."); }
    finally { setArticleSaving(false); }
  };

  const handleDeleteArticle = async (categoryId: number, articleId: number) => {
    if (!confirm("Заалтыг устгах уу?")) return;
    try {
      await adminDeleteLawArticle(articleId);
      setArticles((prev) => ({
        ...prev,
        [categoryId]: prev[categoryId].filter((a) => a.id !== articleId),
      }));
      toast.success("Заалт устгагдлаа.");
    } catch (err: any) { toast.error(err.message ?? "Алдаа гарлаа."); }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Хуулийн ангиллууд</CardTitle>
              <CardDescription>Нийт {categories.length} ангилал.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={() => setShowCatForm((v) => !v)}>
                <Plus className="mr-1 h-4 w-4" />Ангилал нэмэх
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showCatForm && (
            <div className="rounded-md border p-4 space-y-3 bg-muted/30">
              <p className="text-sm font-medium">Шинэ ангилал</p>
              <Input placeholder="Ангиллын нэр" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
              <Input placeholder="Тайлбар (заавал биш)" value={newCatDesc} onChange={(e) => setNewCatDesc(e.target.value)} />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateCategory} disabled={catSaving}>
                  <Save className="mr-1 h-4 w-4" />{catSaving ? "Хадгалж байна..." : "Хадгалах"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowCatForm(false); setNewCatName(""); setNewCatDesc(""); }}>
                  <X className="mr-1 h-4 w-4" />Болих
                </Button>
              </div>
            </div>
          )}

          {categories.length === 0 && !loading && (
            <p className="py-6 text-center text-sm text-muted-foreground">Ангилал байхгүй байна.</p>
          )}

          {categories.map((cat) => (
            <div key={cat.id} className="rounded-md border">
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30"
                onClick={() => toggleCategory(cat.id)}
              >
                <div className="flex items-center gap-2">
                  {expanded === cat.id ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span className="font-medium">{cat.name}</span>
                  {cat.description && <span className="text-xs text-muted-foreground hidden sm:inline">— {cat.description}</span>}
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => setArticleForm({ categoryId: cat.id, number: "", title: "", content: "" })}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDeleteCategory(cat.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {expanded === cat.id && (
                <div className="border-t px-3 pb-3">
                  {articleForm?.categoryId === cat.id && (
                    <div className="my-3 rounded-md border p-4 space-y-3 bg-muted/30">
                      <p className="text-sm font-medium">Шинэ заалт</p>
                      <Input placeholder="Дугаар (жш: 1.1)" value={articleForm.number} onChange={(e) => setArticleForm({ ...articleForm, number: e.target.value })} />
                      <Input placeholder="Гарчиг" value={articleForm.title} onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })} />
                      <Textarea placeholder="Агуулга" rows={4} value={articleForm.content} onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleCreateArticle} disabled={articleSaving}>
                          <Save className="mr-1 h-4 w-4" />{articleSaving ? "Хадгалж байна..." : "Хадгалах"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setArticleForm(null)}>
                          <X className="mr-1 h-4 w-4" />Болих
                        </Button>
                      </div>
                    </div>
                  )}

                  {(articles[cat.id] ?? []).length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">Заалт байхгүй.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-24">Дугаар</TableHead>
                          <TableHead>Гарчиг</TableHead>
                          <TableHead className="text-right w-20">Үйлдэл</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(articles[cat.id] ?? []).map((art) => (
                          <TableRow key={art.id}>
                            <TableCell className="font-mono text-xs">{art.number}</TableCell>
                            <TableCell>{art.title}</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDeleteArticle(cat.id, art.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main AdminPage ────────────────────────────────────────────────────────────

const AdminPage = () => {
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem("admin_access_token"));

  const handleSignOut = () => {
    localStorage.removeItem("admin_access_token");
    setAdminToken(null);
  };

  if (!adminToken) {
    return <LoginView onLogin={setAdminToken} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex min-h-14 items-center justify-between gap-3 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold">LexNavigator Admin</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-1 h-4 w-4" />Гарах
          </Button>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Удирдлагын самбар</h1>
          <p className="text-sm text-muted-foreground mt-1">Хэрэглэгч, кейс болон хуулийн мэдээллийг удирдана.</p>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="mb-6">
            <TabsTrigger value="users"><UserCog className="mr-1 h-4 w-4" />Хэрэглэгчид</TabsTrigger>
            <TabsTrigger value="cases"><FileText className="mr-1 h-4 w-4" />Кейсүүд</TabsTrigger>
            <TabsTrigger value="laws"><BookOpen className="mr-1 h-4 w-4" />Хуулиуд</TabsTrigger>
          </TabsList>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="cases"><CasesTab /></TabsContent>
          <TabsContent value="laws"><LawsTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPage;
