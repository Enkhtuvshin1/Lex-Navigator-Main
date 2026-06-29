import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { adminLogin, login } from "@/lib/api";
import { toast } from "sonner";

const ADMIN_USERNAME = "SuperAdmin";

const LoginPage = () => {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, setAuth } = useAuth();

  useEffect(() => {
    if (user) navigate("/chat", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    const saved = localStorage.getItem("remembered_email");
    if (saved) {
      setLoginId(saved);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedLoginId = loginId.trim();

    if (!normalizedLoginId || !password) {
      toast.error("Enter your email/admin username and password.");
      return;
    }

    setLoading(true);
    try {
      if (normalizedLoginId === ADMIN_USERNAME) {
        const res = await adminLogin(normalizedLoginId, password);
        localStorage.setItem("admin_access_token", res.access_token);
        localStorage.removeItem("remembered_email");
        toast.success("Admin login successful.");
        navigate("/admin");
        return;
      }

      const res = await login(normalizedLoginId, password);
      if (rememberMe) {
        localStorage.setItem("remembered_email", normalizedLoginId);
      } else {
        localStorage.removeItem("remembered_email");
      }
      setAuth(res.access_token, res.user);
      toast.success("Login successful.");
      navigate("/chat");
    } catch (err: any) {
      toast.error(err.message ?? "Unable to log in.");
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
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>Use your account credentials to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground" htmlFor="login-id">
                  Email
                </label>
                <Input
                  id="login-id"
                  type="text"
                  placeholder="name@example.com"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground" htmlFor="password">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <label htmlFor="remember" className="cursor-pointer text-sm text-muted-foreground">
                  Remember email
                </label>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Login"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Need an account?{" "}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Register
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
