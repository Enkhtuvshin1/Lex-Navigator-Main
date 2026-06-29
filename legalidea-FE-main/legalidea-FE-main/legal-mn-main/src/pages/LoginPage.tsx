import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Scale, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { login } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Имэйл болон нууц үг оруулна уу.");
      return;
    }
    setLoading(true);
    try {
      const res = await login(email, password);
      setAuth(res.access_token, res.user);
      toast.success("Амжилттай нэвтэрлээ!");
      navigate("/chat");
    } catch (err: any) {
      toast.error(err.message ?? "Нэвтрэх боломжгүй байна.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <Scale className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-foreground">LexNavigator</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Нэвтрэх</CardTitle>
            <CardDescription>Өөрийн бүртгэлтэй имэйл хаягаар нэвтэрнэ үү</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Бүртгэл байхгүй юу?{" "}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Бүртгүүлэх
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
