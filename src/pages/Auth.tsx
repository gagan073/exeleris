import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/Header";
import { ArrowLeft, Building2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  AppRole,
  EXPERIENCE_LEVELS,
  PROFESSIONAL_TYPES,
  SERVICE_CATEGORIES,
  SKILLS_BY_CATEGORY,
} from "@/types/database";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();

  const [activeTab, setActiveTab] = useState(
    searchParams.get("mode") === "signup" ? "signup" : "signin"
  );
  const [accountType, setAccountType] = useState<AppRole>(
    searchParams.get("type") === "expert" ? "expert" : "business"
  );

  // Where to go after a successful login (set by ProtectedRoute), else dashboard.
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ||
    "/dashboard";

  // Keep the visible tab / account type in sync when the URL changes while the
  // page is already mounted (e.g. clicking "Get Started" from the header).
  useEffect(() => {
    if (searchParams.get("mode") === "signup") setActiveTab("signup");
    if (searchParams.get("type") === "expert") setAccountType("expert");
  }, [searchParams]);

  // Sign In state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  // Sign Up state
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [headline, setHeadline] = useState("");
  const [professionalType, setProfessionalType] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [signingUp, setSigningUp] = useState(false);

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const availableSkills = selectedCategories.flatMap(
    (category) => SKILLS_BY_CATEGORY[category] ?? []
  ).filter((skill, index, all) => all.indexOf(skill) === index);

  const toggleCategory = (category: string) => {
    const next = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    const remainingSkills = new Set(next.flatMap((c) => SKILLS_BY_CATEGORY[c] ?? []));
    setSelectedCategories(next);
    setSelectedSkills((skills) => skills.filter((s) => remainingSkills.has(s)));
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (!signInPassword) {
      toast.error("Please enter your password");
      return;
    }

    setSigningIn(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: signInEmail.trim(),
      password: signInPassword,
    });
    setSigningIn(false);

    if (error) {
      // Surface the email-not-confirmed case specifically — our own signup flow
      // sends people here, and "wrong password" would send them chasing the
      // wrong fix.
      if (error.message.toLowerCase().includes("not confirmed")) {
        toast.error("Please confirm your email first — check your inbox for the confirmation link.");
      } else {
        toast.error("Incorrect email or password");
      }
      return;
    }

    toast.success("Welcome back!");
    navigate(from);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (accountType === "business" && !companyName.trim()) {
      toast.error("Please enter your company name");
      return;
    }
    if (!signUpEmail.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (!signUpPassword || signUpPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (accountType === "expert") {
      if (!headline.trim()) {
        toast.error("Please enter your professional headline");
        return;
      }
      if (!professionalType) {
        toast.error("Please select your professional type");
        return;
      }
      if (selectedCategories.length === 0) {
        toast.error("Please select at least one service category");
        return;
      }
    }

    const metadata: Record<string, unknown> = {
      role: accountType,
      full_name: fullName.trim(),
    };
    if (accountType === "business") {
      metadata.company_name = companyName.trim();
    } else {
      metadata.headline = headline.trim();
      metadata.professional_type = professionalType;
      metadata.license_number = licenseNumber.trim() || null;
      metadata.years_experience = yearsExperience || null;
      metadata.skills = selectedSkills;
      metadata.categories = selectedCategories;
    }

    setSigningUp(true);
    const { data, error } = await supabase.auth.signUp({
      email: signUpEmail.trim(),
      password: signUpPassword,
      options: { data: metadata },
    });
    setSigningUp(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data.session) {
      toast.success("Welcome to Exeleris!");
      navigate(from);
    } else {
      toast.success("Check your email to confirm your account, then sign in.");
      setActiveTab("signin");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Welcome to Exeleris
              </h1>
              <p className="text-xl text-muted-foreground">
                Sign in to your account or create a new one
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <Card>
                  <CardHeader>
                    <CardTitle>Sign In</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <form onSubmit={handleSignIn} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="your@email.com"
                          value={signInEmail}
                          onChange={(e) => setSignInEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">Password</Label>
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="Your password"
                          value={signInPassword}
                          onChange={(e) => setSignInPassword(e.target.value)}
                        />
                      </div>
                      <Button type="submit" size="lg" className="w-full" disabled={signingIn}>
                        {signingIn ? "Signing In..." : "Sign In"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="signup">
                <Card>
                  <CardHeader>
                    <CardTitle>Create Your Account</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <form onSubmit={handleSignUp} className="space-y-6">
                      <div className="space-y-2">
                        <Label>Account Type</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => setAccountType("business")}
                            className={`rounded-lg border p-4 text-center transition-colors ${
                              accountType === "business"
                                ? "border-accent bg-accent/5"
                                : "border-border"
                            }`}
                          >
                            <Building2 className="w-8 h-8 mx-auto mb-2 text-accent" />
                            <div className="font-semibold text-foreground">Business</div>
                            <p className="text-sm text-muted-foreground">
                              I want to post projects
                            </p>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAccountType("expert")}
                            className={`rounded-lg border p-4 text-center transition-colors ${
                              accountType === "expert"
                                ? "border-accent bg-accent/5"
                                : "border-border"
                            }`}
                          >
                            <UserRound className="w-8 h-8 mx-auto mb-2 text-accent" />
                            <div className="font-semibold text-foreground">Expert</div>
                            <p className="text-sm text-muted-foreground">
                              I want to finish projects
                            </p>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Full Name</Label>
                        <Input
                          id="signup-name"
                          placeholder="Your full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                        />
                      </div>

                      {accountType === "business" && (
                        <div className="space-y-2">
                          <Label htmlFor="signup-company">Company Name</Label>
                          <Input
                            id="signup-company"
                            placeholder="Your company name"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                          />
                        </div>
                      )}

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="signup-email">Email</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="your@email.com"
                            value={signUpEmail}
                            onChange={(e) => setSignUpEmail(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Password</Label>
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="At least 6 characters"
                            value={signUpPassword}
                            onChange={(e) => setSignUpPassword(e.target.value)}
                          />
                        </div>
                      </div>

                      {accountType === "expert" && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="signup-headline">Professional Headline</Label>
                            <Input
                              id="signup-headline"
                              placeholder="e.g., Senior Attorney specializing in SaaS contracts"
                              value={headline}
                              onChange={(e) => setHeadline(e.target.value)}
                            />
                          </div>

                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="signup-professional-type">Professional Type</Label>
                              <Select value={professionalType} onValueChange={setProfessionalType}>
                                <SelectTrigger id="signup-professional-type">
                                  <SelectValue placeholder="Select your profession" />
                                </SelectTrigger>
                                <SelectContent>
                                  {PROFESSIONAL_TYPES.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="signup-license">License Number (Optional)</Label>
                              <Input
                                id="signup-license"
                                placeholder="e.g., Bar or CPA license number"
                                value={licenseNumber}
                                onChange={(e) => setLicenseNumber(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="signup-experience">Years of Experience</Label>
                            <Select value={yearsExperience} onValueChange={setYearsExperience}>
                              <SelectTrigger id="signup-experience">
                                <SelectValue placeholder="Select your experience level" />
                              </SelectTrigger>
                              <SelectContent>
                                {EXPERIENCE_LEVELS.map((level) => (
                                  <SelectItem key={level.value} value={level.value}>
                                    {level.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Service Categories</Label>
                            <div className="flex flex-wrap gap-2">
                              {SERVICE_CATEGORIES.map((category) => (
                                <Badge
                                  key={category}
                                  variant={selectedCategories.includes(category) ? "default" : "outline"}
                                  className="cursor-pointer"
                                  onClick={() => toggleCategory(category)}
                                >
                                  {category}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Skills &amp; Expertise</Label>
                            {selectedCategories.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                Select your service categories first to see relevant skills
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {availableSkills.map((skill) => (
                                  <Badge
                                    key={skill}
                                    variant={selectedSkills.includes(skill) ? "default" : "outline"}
                                    className="cursor-pointer"
                                    onClick={() => toggleSkill(skill)}
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                            <p className="text-sm text-foreground">
                              Expert applications are reviewed by our team. You can browse jobs
                              right away and start bidding once you're approved.
                            </p>
                          </div>
                        </>
                      )}

                      <Button
                        type="submit"
                        variant="accent"
                        size="lg"
                        className="w-full"
                        disabled={signingUp}
                      >
                        {signingUp ? "Creating Account..." : "Create Account"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
