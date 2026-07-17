import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays, formatDistanceToNow, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { ArrowLeft, Clock, DollarSign, Building, CheckCircle, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { formatCurrency, deadlineText } from "@/lib/format";
import { SERVICE_CATEGORIES } from "@/types/database";
import type { Project } from "@/types/database";

const JobBoard = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ["published-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Project[];
    },
  });

  const categories = ["all", ...SERVICE_CATEGORIES];

  const filteredJobs = selectedCategory === "all"
    ? (projects ?? [])
    : (projects ?? []).filter((job) => job.category === selectedCategory);

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

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Expert Finishing Opportunities
            </h1>
            <p className="text-xl text-muted-foreground">
              Browse AI-enhanced deliverables ready for expert completion
            </p>
          </div>

          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category === "all" ? "All Categories" : category}
                </Button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error || filteredJobs.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="p-12 text-center">
                <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No projects here yet</h3>
                <p className="text-muted-foreground">
                  {selectedCategory === "all"
                    ? "New projects are posted all the time — check back soon!"
                    : "No open projects in this category right now. Try another category."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredJobs.map((job) => {
                const daysLeft = job.deadline
                  ? differenceInCalendarDays(parseISO(job.deadline), new Date())
                  : null;
                const budget = `${formatCurrency(job.budget_min)} - ${formatCurrency(job.budget_max)}`;
                const posted = formatDistanceToNow(new Date(job.created_at), { addSuffix: true });

                return (
                  <Card key={job.id} className="border-2 hover:border-accent/50 hover:shadow-premium transition-all duration-300 bg-gradient-to-r from-card to-card/80">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="default" className="bg-accent text-accent-foreground">
                              {job.category}
                            </Badge>
                            <Badge variant="outline" className="border-accent/30 text-accent">
                              {job.completion_percent}% Complete
                            </Badge>
                            {daysLeft === null ? (
                              <Badge variant="secondary">Flexible</Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className={`${
                                  daysLeft <= 0
                                    ? 'bg-red-100 text-red-700 border-red-200'
                                    : daysLeft === 1
                                      ? 'bg-orange-100 text-orange-700 border-orange-200'
                                      : 'bg-blue-100 text-blue-700 border-blue-200'
                                }`}
                              >
                                {daysLeft <= 0 ? 'URGENT' : daysLeft === 1 ? '1 day left' : `${daysLeft} days left`}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-xl text-foreground mb-3">
                            <Link to={`/job/${job.id}`} className="hover:text-accent transition-colors">
                              {job.title}
                            </Link>
                          </CardTitle>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 rounded-md px-2 py-1">
                              <Building className="w-4 h-4 text-accent" />
                              <span className="font-medium">{job.company_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground bg-accent/10 rounded-md px-2 py-1">
                              <DollarSign className="w-4 h-4 text-accent" />
                              <span className="font-semibold text-accent">{budget}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 rounded-md px-2 py-1">
                              <Clock className="w-4 h-4 text-accent" />
                              <span>{deadlineText(job.deadline)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right bg-muted/20 rounded-lg p-2">
                          <p className="text-xs text-muted-foreground">Posted</p>
                          <p className="text-sm font-medium text-foreground">{posted}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-2">
                      <div className="bg-muted/10 border-l-4 border-accent pl-4 py-2">
                        <p className="text-muted-foreground leading-relaxed">{job.description}</p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <div className="w-2 h-2 bg-accent rounded-full"></div>
                            AI Tools Used
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {job.ai_tools.map((tool, index) => (
                              <Badge key={index} variant="outline" className="text-xs border-accent/30 hover:bg-accent/10">
                                {tool}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <div className="w-2 h-2 bg-accent rounded-full"></div>
                            Required Skills
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {job.skills.map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs bg-accent/20 text-accent-foreground">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-accent/20 bg-gradient-to-r from-accent/5 to-transparent rounded-lg p-3 -mx-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-accent" />
                          <span className="font-medium">Transparent billing • Expert verification required</span>
                        </div>
                        <Link to={`/job/${job.id}`}>
                          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobBoard;
