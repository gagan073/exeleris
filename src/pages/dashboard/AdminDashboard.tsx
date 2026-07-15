import { CreditCard, Settings, Users } from "lucide-react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ADMIN_SECTIONS = [
  { title: "Users", icon: Users },
  { title: "Transactions", icon: CreditCard },
  { title: "Settings", icon: Settings },
] as const;

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                Admin Dashboard
              </h1>
              <p className="text-xl text-muted-foreground mt-2">
                Platform overview and controls
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {ADMIN_SECTIONS.map(({ title, icon: Icon }) => (
              <Card key={title}>
                <CardHeader>
                  <Icon className="w-8 h-8 text-accent mb-2" />
                  <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Coming soon — this area will be built in an upcoming
                    session.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
