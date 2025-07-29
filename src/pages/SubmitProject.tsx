import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { ArrowLeft, Upload } from "lucide-react";
import { Link } from "react-router-dom";

const SubmitProject = () => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [aiToolsUsed, setAiToolsUsed] = useState<string[]>([]);

  const serviceCategories = [
    "Legal Services", "Financial Analysis", "Marketing Strategy", "Business Consulting",
    "Technical & Engineering", "Healthcare & Medical", "Design & Creative", "Academic & Research"
  ];

  const commonAITools = [
    "GPT-4", "Claude", "Gemini", "Copilot", "Jasper", "Copy.ai", "Grammarly Business",
    "Notion AI", "Canva AI", "Midjourney", "DALL-E", "Custom AI Tools"
  ];

  const toggleAITool = (tool: string) => {
    setAiToolsUsed(prev => 
      prev.includes(tool) 
        ? prev.filter(t => t !== tool)
        : [...prev, tool]
    );
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

          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Submit Your AI-Enhanced Project
              </h1>
              <p className="text-xl text-muted-foreground">
                Get expert finishing touches on your AI-generated deliverables
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name</Label>
                    <Input id="company" placeholder="Your company name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact">Contact Person</Label>
                    <Input id="contact" placeholder="Your name" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="your@email.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input id="phone" placeholder="+1 (555) 123-4567" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project-title">Project Title</Label>
                  <Input id="project-title" placeholder="Brief, descriptive title of your project" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Service Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service category" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Project Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe your project, what's been completed, and what needs expert finishing..."
                    className="min-h-[120px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="completion">Completion Percentage</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="How complete is your deliverable?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="70-80">70-80% Complete</SelectItem>
                      <SelectItem value="80-90">80-90% Complete</SelectItem>
                      <SelectItem value="90-95">90-95% Complete</SelectItem>
                      <SelectItem value="95+">95%+ Complete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label>AI Tools Used</Label>
                  <p className="text-sm text-muted-foreground">
                    Select all AI tools used to create this deliverable (helps experts understand the foundation)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {commonAITools.map((tool) => (
                      <Badge
                        key={tool}
                        variant={aiToolsUsed.includes(tool) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleAITool(tool)}
                      >
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Desired Completion Date</Label>
                  <Input id="deadline" type="date" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Budget Range</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under-500">Under $500</SelectItem>
                      <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                      <SelectItem value="1000-2500">$1,000 - $2,500</SelectItem>
                      <SelectItem value="2500-5000">$2,500 - $5,000</SelectItem>
                      <SelectItem value="5000+">$5,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label>Upload Files</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">
                      Upload your AI-generated deliverable and any supporting documents
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Supported: PDF, DOCX, XLSX, PPT, ZIP (Max 50MB)
                    </p>
                    <Button variant="outline">Choose Files</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="special-requirements">Special Requirements</Label>
                  <Textarea 
                    id="special-requirements" 
                    placeholder="Any specific requirements, preferences, or additional context for the expert..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="pt-6 border-t">
                  <Button size="lg" className="w-full">
                    Submit Project for Expert Review
                  </Button>
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    You'll receive expert bids within 24-48 hours
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitProject;