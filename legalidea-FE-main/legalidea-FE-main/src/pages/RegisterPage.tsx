import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Scale, ArrowRight, User, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { register } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type Role = "user" | "lawyer";

const RegisterPage = () => {
  const [role, setRole] = useState<Role>("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, setAuth } = useAuth();

  useEffect(() => {
    if (user) navigate("/chat", { replace: true });
  }, [user, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast.error("Бүх шаардлагатай талбарыг бөглөнө үү.");
      return;
    }
    if (role === "lawyer" && (!specialty || !licenseNumber)) {
      toast.error("Хуульчийн мэдээллийг бүрэн бөглөнө үү.");
      return;
    }
    setLoading(true);
    try {
      const res = await register({
        email,
        password,
        full_name: fullName,
        role,
        bar_number: role === "lawyer" ? licenseNumber : null,
        specialization: role === "lawyer" ? specialty : null,
      });
      setAuth(res.access_token, res.user);
      toast.success("Амжилттай бүртгэгдлээ!");
      navigate("/chat");
    } catch (err: any) {
      toast.error(err.message ?? "Бүртгэл амжилтгүй боллоо.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <Scale className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-foreground">LexNavigator</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Бүртгүүлэх</CardTitle>
            <CardDescription>Шинэ хэрэглэгчийн бүртгэл үүсгэнэ үү</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Role selection */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("user")}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                  role === "user"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <User className={`h-6 w-6 ${role === "user" ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-sm font-medium ${role === "user" ? "text-primary" : "text-muted-foreground"}`}>
                  Хэрэглэгч
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRole("lawyer")}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                  role === "lawyer"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <Briefcase className={`h-6 w-6 ${role === "lawyer" ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-sm font-medium ${role === "lawyer" ? "text-primary" : "text-muted-foreground"}`}>
                  Хуульч
                </span>
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Бүтэн нэр</label>
                <Input
                  placeholder="Овог Нэр"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Имэйл</label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Нууц үг</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Lawyer-specific fields */}
              {role === "lawyer" && (
                <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm font-medium text-foreground">Хуульчийн мэдээлэл</p>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Мэргэшсэн салбар</label>
                    <Select value={specialty} onValueChange={setSpecialty}>
                      <SelectTrigger>
                        <SelectValue placeholder="Салбар сонгоно уу" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="criminal">Эрүү</SelectItem>
                        <SelectItem value="civil">Иргэн</SelectItem>
                        <SelectItem value="administrative">Захиргаа</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Үнэмлэхийн дугаар</label>
                    <Input
                      placeholder="ХЗ-0001234"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Бүртгэж байна..." : "Бүртгүүлэх"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Бүртгэлтэй юу?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Нэвтрэх
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
