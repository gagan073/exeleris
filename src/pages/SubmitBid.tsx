import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { ArrowLeft, DollarSign, Clock, CheckCircle, Building } from "lucide-react";
import { Link } from "react-router-dom";

const SubmitBid = () => {
  const { jobId } = useParams();
  const [hourlyRate, setHourlyRate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");

  // Mock job data - in real app this would come from API
  const job = {
    id: jobId,
    title: "Contract Review - SaaS Terms of Service",
    company: "TechStart Inc.",
    category: "Legal Services",
    completion: "85%",
    budget: "$800 - $1,200",
    deadline: "3 days",
    description: "AI-generated Terms of Service for SaaS platform needs legal review and compliance verification. Document is 85% complete with standard clauses in place.",
    aiTools: ["GPT-4", "Legal AI"],
    skills: ["Contract Law", "SaaS Legal", "Terms of Service"],
    posted: "2 hours ago",
    requirements: [
      "Licensed attorney with SaaS/technology experience",
      "Experience reviewing Terms of Service and Privacy Policies",
      "Knowledge of GDPR, CCPA, and other privacy regulations",
      "Ability to complete within 3-day deadline"
    ]
  };

  const totalCost = hourlyRate && estimatedHours 
    ? (parseFloat(hourlyRate) * parseFloat(estimatedHours)).toFixed(2)
    : "0.00";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="mb-8">
            <Link to="/jobs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Job Board
            </Link>
          </div>

          <div className="max-w-4xl mx-auto grid lg:grid-cols-2 gap-8">
            {/* Job Details */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{job.category}</Badge>
                    <Badge variant="outline">{job.completion} Complete</Badge>
                  </div>
                  <CardTitle className="text-xl text-foreground">
                    {job.title}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      {job.company}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {job.budget}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Due in {job.deadline}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Project Description</h4>
                    <p className="text-muted-foreground">{job.description}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-2">AI Tools Used</h4>
                    <div className="flex flex-wrap gap-1">
                      {job.aiTools.map((tool, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {job.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Requirements</h4>
                    <ul className="space-y-1">
                      {job.requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bid Form */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Submit Your Bid</CardTitle>
                  <p className="text-muted-foreground">
                    Provide your hourly rate and estimated time to complete this project
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hourly-rate">Hourly Rate (USD)</Label>
                      <Input 
                        id="hourly-rate" 
                        type="number" 
                        placeholder="150"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estimated-hours">Estimated Hours</Label>
                      <Input 
                        id="estimated-hours" 
                        type="number" 
                        step="0.5"
                        placeholder="8"
                        value={estimatedHours}
                        onChange={(e) => setEstimatedHours(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-foreground">Total Project Cost:</span>
                      <span className="text-2xl font-bold text-accent">${totalCost}</span>
                    </div>
                    {hourlyRate && estimatedHours && (
                      <p className="text-sm text-muted-foreground mt-2">
                        ${hourlyRate}/hour × {estimatedHours} hours = ${totalCost}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="completion-time">Estimated Completion Time</Label>
                    <Input 
                      id="completion-time" 
                      placeholder="e.g., 2 days, 1 week"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="approach">Your Approach</Label>
                    <Textarea 
                      id="approach" 
                      placeholder="Describe how you'll approach finishing this AI-enhanced deliverable..."
                      className="min-h-[120px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience">Relevant Experience</Label>
                    <Textarea 
                      id="experience" 
                      placeholder="Highlight your relevant experience with similar projects..."
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="questions">Questions/Clarifications</Label>
                    <Textarea 
                      id="questions" 
                      placeholder="Any questions about the project or additional clarifications needed..."
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="bg-muted/50 border rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">Exeleris Guarantee</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-accent" />
                        Transparent hourly billing with detailed time tracking
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-accent" />
                        Payment protection through escrow system
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-accent" />
                        Quality guarantee with revision opportunities
                      </li>
                    </ul>
                  </div>

                  <Button size="lg" className="w-full">
                    Submit Bid
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    The client will review your bid and respond within 24 hours
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitBid;