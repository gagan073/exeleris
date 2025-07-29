import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const FindWork = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const serviceCategories = [
    "Legal Services", "Financial Analysis", "Marketing Strategy", "Business Consulting",
    "Technical & Engineering", "Healthcare & Medical", "Design & Creative", "Academic & Research"
  ];

  const skillsByCategory = {
    "Legal Services": ["Contract Law", "Corporate Legal", "Regulatory Compliance", "Litigation Support", "IP Law", "Employment Law"],
    "Financial Analysis": ["Financial Planning", "Risk Assessment", "Investment Analysis", "Tax Strategy", "Forensic Accounting", "Valuation"],
    "Marketing Strategy": ["Digital Marketing", "Brand Strategy", "Content Marketing", "Performance Marketing", "SEO/SEM", "Social Media"],
    "Business Consulting": ["Strategy Development", "Process Optimization", "Change Management", "Business Analysis", "Operations", "HR Consulting"],
    "Technical & Engineering": ["Software Architecture", "Technical Writing", "Code Review", "System Design", "Security Assessment", "DevOps"],
    "Healthcare & Medical": ["Medical Writing", "Healthcare Compliance", "Clinical Research", "Medical Device", "Regulatory Affairs", "Healthcare IT"],
    "Design & Creative": ["Graphic Design", "UX/UI Design", "Brand Development", "Video Production", "Web Design", "Print Design"],
    "Academic & Research": ["Academic Writing", "Research Methods", "Data Analysis", "Grant Writing", "Peer Review", "Statistical Analysis"]
  };

  const allSkills = Object.values(skillsByCategory).flat();

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
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
                Join as a Professional Service Provider
              </h1>
              <p className="text-xl text-muted-foreground">
                Finish AI-enhanced deliverables and get paid for your expertise
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Professional Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First Name</Label>
                    <Input id="first-name" placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input id="last-name" placeholder="Smith" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="john@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" placeholder="+1 (555) 123-4567" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company/Organization</Label>
                  <Input id="company" placeholder="Your firm or organization name" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Professional Title</Label>
                  <Input id="title" placeholder="e.g., Senior Attorney, CFO, Marketing Director" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-3">1-3 years</SelectItem>
                      <SelectItem value="3-5">3-5 years</SelectItem>
                      <SelectItem value="5-10">5-10 years</SelectItem>
                      <SelectItem value="10-15">10-15 years</SelectItem>
                      <SelectItem value="15+">15+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label>Service Categories</Label>
                  <p className="text-sm text-muted-foreground">
                    Select the categories where you can provide expert finishing services
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {serviceCategories.map((category) => (
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

                <div className="space-y-4">
                  <Label>Specific Skills & Expertise</Label>
                  <p className="text-sm text-muted-foreground">
                    Select your specific areas of expertise
                  </p>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                    {allSkills.map((skill) => (
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourly-rate">Hourly Rate (USD)</Label>
                  <Input id="hourly-rate" type="number" placeholder="150" />
                  <p className="text-sm text-muted-foreground">
                    Your standard hourly rate for finishing AI-enhanced deliverables
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availability">Weekly Availability</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="How many hours per week?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5-10">5-10 hours</SelectItem>
                      <SelectItem value="10-20">10-20 hours</SelectItem>
                      <SelectItem value="20-30">20-30 hours</SelectItem>
                      <SelectItem value="30-40">30-40 hours</SelectItem>
                      <SelectItem value="40+">40+ hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea 
                    id="bio" 
                    placeholder="Describe your background, expertise, and approach to finishing AI-enhanced deliverables..."
                    className="min-h-[120px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certifications">Certifications & Licenses</Label>
                  <Textarea 
                    id="certifications" 
                    placeholder="List relevant certifications, licenses, or professional credentials..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-4">
                  <Label>AI Tool Experience</Label>
                  <p className="text-sm text-muted-foreground">
                    Check if you have experience working with AI-generated content
                  </p>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-accent" />
                    <span className="text-foreground">I have experience reviewing and improving AI-generated deliverables</span>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <Button size="lg" className="w-full">
                    Submit Application
                  </Button>
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    We'll review your application and get back to you within 24-48 hours
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

export default FindWork;