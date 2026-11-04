import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Eye, EyeOff, UtensilsCrossed, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account. After verification, an admin will approve your access.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-primary/5" />
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 30% 20%, hsl(var(--primary) / 0.15) 0%, transparent 50%),
                            radial-gradient(circle at 70% 80%, hsl(var(--primary) / 0.1) 0%, transparent 50%)`
        }} />
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-72 h-72 rounded-full border border-primary/10 animate-pulse" />
        <div className="absolute bottom-32 right-16 w-48 h-48 rounded-full border border-primary/5" />
        <div className="absolute top-1/2 left-1/3 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3.5 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-info/60 flex items-center justify-center shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.5)] ring-1 ring-primary/30">
              <span className="text-primary-foreground font-black text-2xl leading-none">M</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground leading-tight tracking-tight">
                Mess<span className="text-primary">Mate</span>
              </h1>
              <p className="text-[10px] text-primary/70 tracking-widest uppercase font-semibold">{t.appTagline}</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-4 leading-tight">
            Manage your mess<br />
            <span className="text-primary">effortlessly.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
            Track meals, expenses, and member contributions with a clean, intuitive interface designed for shared living.
          </p>
          
          {/* Feature highlights */}
          <div className="mt-12 space-y-4">
            {[
              "Real-time meal tracking & cost splitting",
              "Detailed expense management & reports",
              "Multi-member advance & balance tracking"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                <span className="text-sm text-foreground/70">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3.5 mb-10">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-info/60 flex items-center justify-center shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.5)] ring-1 ring-primary/30">
              <span className="text-primary-foreground font-black text-xl leading-none">M</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-foreground leading-tight tracking-tight">
                Mess<span className="text-primary">Mate</span>
              </h1>
              <p className="text-[10px] text-primary/70 tracking-widest uppercase font-semibold">{t.appTagline}</p>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              {isLogin ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {isLogin
                ? "Sign in to your account to continue"
                : "Get started with your mess management"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-11 bg-card border-border focus:border-primary"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-card border-border focus:border-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                {isLogin && (
                  <button
                    type="button"
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                    onClick={() => toast({ title: "Coming soon", description: "Password reset will be available soon." })}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-card border-border focus:border-primary"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold gap-2"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-xs text-muted-foreground uppercase tracking-wider">
                {isLogin ? "New here?" : "Already have an account?"}
              </span>
            </div>
          </div>

          {/* Toggle */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 text-sm"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Create a new account" : "Sign in to existing account"}
          </Button>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-8">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
