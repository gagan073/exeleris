import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import BusinessDashboard from "./dashboard/BusinessDashboard";
import ExpertDashboard from "./dashboard/ExpertDashboard";
import AdminDashboard from "./dashboard/AdminDashboard";

const Dashboard = () => {
  const { profile, signOut } = useAuth();

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-20">
          <div className="container mx-auto px-6 py-12">
            <Card className="max-w-xl mx-auto">
              <CardHeader>
                <CardTitle>Account profile unavailable</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">
                  We couldn't load your account profile. If you just created
                  your Supabase project, make sure setup.sql has been run.
                </p>
                <Button size="lg" className="w-full" onClick={() => signOut()}>
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (profile.role === "business") return <BusinessDashboard />;
  if (profile.role === "expert") return <ExpertDashboard />;
  return <AdminDashboard />;
};

export default Dashboard;
