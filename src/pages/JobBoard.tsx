import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { ArrowLeft, Clock, DollarSign, Building, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const JobBoard = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const jobs = [
    {
      id: 1,
      title: "Contract Review - SaaS Terms of Service",
      company: "TechStart Inc.",
      category: "Legal Services",
      completion: "85%",
      budget: "$800 - $1,200",
      deadline: "3 days",
      description: "AI-generated Terms of Service for SaaS platform needs legal review and compliance verification. Document is 85% complete with standard clauses in place.",
      aiTools: ["GPT-4", "Legal AI"],
      skills: ["Contract Law", "SaaS Legal", "Terms of Service"],
      posted: "2 hours ago"
    },
    {
      id: 2,
      title: "Financial Model Validation - Series A Fundraising",
      company: "Growth Ventures",
      category: "Financial Analysis",
      completion: "90%",
      budget: "$1,500 - $2,500",
      deadline: "5 days",
      description: "AI-built financial projection model for Series A fundraising needs expert validation, stress testing, and investor-ready formatting.",
      aiTools: ["Claude", "Excel AI"],
      skills: ["Financial Modeling", "Valuation", "Fundraising"],
      posted: "4 hours ago"
    },
    {
      id: 3,
      title: "Brand Strategy Finalization - B2B SaaS Rebrand",
      company: "DataFlow Solutions",
      category: "Marketing Strategy",
      completion: "75%",
      budget: "$1,000 - $1,800",
      deadline: "7 days",
      description: "AI-developed brand strategy and messaging framework needs expert refinement, competitive analysis validation, and go-to-market alignment.",
      aiTools: ["Jasper", "Brand AI"],
      skills: ["Brand Strategy", "B2B Marketing", "Messaging"],
      posted: "1 day ago"
    },
    {
      id: 4,
      title: "Operational Process Optimization - Manufacturing",
      company: "Industrial Dynamics",
      category: "Business Consulting",
      completion: "80%",
      budget: "$2,000 - $3,000",
      deadline: "10 days",
      description: "AI-generated process improvement recommendations for manufacturing operations need expert validation, implementation planning, and ROI analysis.",
      aiTools: ["Custom AI", "Process Mining AI"],
      skills: ["Operations", "Process Optimization", "Manufacturing"],
      posted: "1 day ago"
    },
    {
      id: 5,
      title: "System Architecture Review - Cloud Migration",
      company: "Enterprise Corp",
      category: "Technical & Engineering",
      completion: "85%",
      budget: "$2,500 - $4,000",
      deadline: "14 days",
      description: "AI-designed cloud migration architecture needs expert security review, scalability validation, and implementation roadmap finalization.",
      aiTools: ["Copilot", "Architecture AI"],
      skills: ["Cloud Architecture", "Security", "Migration"],
      posted: "2 days ago"
    },
    {
      id: 6,
      title: "Clinical Protocol Development - Phase II Trial",
      company: "BioPharma Research",
      category: "Healthcare & Medical",
      completion: "70%",
      budget: "$3,000 - $5,000",
      deadline: "21 days",
      description: "AI-generated clinical trial protocol for Phase II study needs expert medical review, regulatory compliance check, and statistical design validation.",
      aiTools: ["Medical AI", "Protocol Builder"],
      skills: ["Clinical Research", "Regulatory Affairs", "Protocol Design"],
      posted: "3 days ago"
    },
    {
      id: 7,
      title: "Brand Identity Design System - Fintech Startup",
      company: "PayFlow",
      category: "Design & Creative",
      completion: "80%",
      budget: "$1,200 - $2,000",
      deadline: "8 days",
      description: "AI-created brand identity and design system needs expert refinement, accessibility compliance, and brand guideline documentation.",
      aiTools: ["Midjourney", "Figma AI"],
      skills: ["Brand Design", "Design Systems", "Fintech"],
      posted: "4 days ago"
    },
    {
      id: 8,
      title: "Market Research Analysis - Consumer Behavior Study",
      company: "Retail Insights Co",
      category: "Academic & Research",
      completion: "85%",
      budget: "$1,800 - $2,800",
      deadline: "12 days",
      description: "AI-processed consumer behavior research needs expert statistical validation, insight synthesis, and executive summary preparation.",
      aiTools: ["Research AI", "Statistical Tools"],
      skills: ["Market Research", "Statistical Analysis", "Consumer Behavior"],
      posted: "5 days ago"
    },
    {
      id: 9,
      title: "IP Patent Application - IoT Device",
      company: "Innovation Labs",
      category: "Legal Services",
      completion: "75%",
      budget: "$2,200 - $3,500",
      deadline: "18 days",
      description: "AI-drafted patent application for IoT sensing device needs expert patent attorney review, claims refinement, and prior art analysis.",
      aiTools: ["Patent AI", "Legal Research"],
      skills: ["IP Law", "Patent Law", "IoT Technology"],
      posted: "1 week ago"
    },
    {
      id: 10,
      title: "Investment Pitch Deck - Hardware Startup",
      company: "RoboTech Innovations",
      category: "Financial Analysis",
      completion: "80%",
      budget: "$1,500 - $2,200",
      deadline: "6 days",
      description: "AI-generated investor pitch deck needs expert refinement, financial narrative strengthening, and presentation flow optimization.",
      aiTools: ["Pitch AI", "Financial Modeling"],
      skills: ["Investment Analysis", "Pitch Development", "Hardware"],
      posted: "1 week ago"
    },
    {
      id: 11,
      title: "Content Marketing Strategy - B2B Lead Generation",
      company: "MarketGrow Agency",
      category: "Marketing Strategy",
      completion: "85%",
      budget: "$1,000 - $1,600",
      deadline: "9 days",
      description: "AI-developed content marketing strategy for B2B lead generation needs expert campaign optimization and conversion funnel refinement.",
      aiTools: ["Content AI", "Marketing Tools"],
      skills: ["Content Marketing", "Lead Generation", "B2B"],
      posted: "1 week ago"
    },
    {
      id: 12,
      title: "Change Management Plan - Digital Transformation",
      company: "Legacy Systems Inc",
      category: "Business Consulting",
      completion: "70%",
      budget: "$2,800 - $4,200",
      deadline: "16 days",
      description: "AI-created change management framework for digital transformation needs expert stakeholder analysis and implementation timeline optimization.",
      aiTools: ["Transformation AI", "Planning Tools"],
      skills: ["Change Management", "Digital Transformation", "Stakeholder Management"],
      posted: "1 week ago"
    },
    {
      id: 13,
      title: "API Documentation - Developer Portal",
      company: "DevTools Pro",
      category: "Technical & Engineering",
      completion: "90%",
      budget: "$800 - $1,400",
      deadline: "5 days",
      description: "AI-generated API documentation needs expert technical writing review, code example validation, and developer experience optimization.",
      aiTools: ["Documentation AI", "Code Analysis"],
      skills: ["Technical Writing", "API Design", "Developer Experience"],
      posted: "1 week ago"
    },
    {
      id: 14,
      title: "Medical Device Compliance Report - FDA Submission",
      company: "MedDevice Innovations",
      category: "Healthcare & Medical",
      completion: "75%",
      budget: "$4,000 - $6,000",
      deadline: "25 days",
      description: "AI-compiled FDA compliance documentation for Class II medical device needs expert regulatory review and submission preparation.",
      aiTools: ["Regulatory AI", "Compliance Tools"],
      skills: ["Medical Device", "FDA Compliance", "Regulatory Affairs"],
      posted: "2 weeks ago"
    },
    {
      id: 15,
      title: "UX Research Report - Mobile App Redesign",
      company: "AppFlow Design",
      category: "Design & Creative",
      completion: "85%",
      budget: "$1,200 - $1,900",
      deadline: "7 days",
      description: "AI-analyzed UX research data needs expert insight synthesis, design recommendation refinement, and user journey optimization.",
      aiTools: ["UX AI", "Research Tools"],
      skills: ["UX Research", "Mobile Design", "User Testing"],
      posted: "2 weeks ago"
    },
    {
      id: 16,
      title: "Grant Proposal - Clean Energy Research",
      company: "Green Innovation Lab",
      category: "Academic & Research",
      completion: "80%",
      budget: "$2,500 - $4,000",
      deadline: "20 days",
      description: "AI-drafted NSF grant proposal for clean energy research needs expert academic review, methodology validation, and budget justification.",
      aiTools: ["Grant AI", "Research Tools"],
      skills: ["Grant Writing", "Clean Energy", "Research Methods"],
      posted: "2 weeks ago"
    },
    {
      id: 17,
      title: "Employee Handbook - Remote Work Policies",
      company: "DistributedCorp",
      category: "Legal Services",
      completion: "85%",
      budget: "$1,000 - $1,800",
      deadline: "12 days",
      description: "AI-generated employee handbook with remote work policies needs legal compliance review and state-specific regulation alignment.",
      aiTools: ["Legal AI", "Policy Builder"],
      skills: ["Employment Law", "Remote Work", "HR Policy"],
      posted: "2 weeks ago"
    },
    {
      id: 18,
      title: "Risk Assessment Model - Cryptocurrency Trading",
      company: "CryptoFund Capital",
      category: "Financial Analysis",
      completion: "75%",
      budget: "$3,500 - $5,500",
      deadline: "15 days",
      description: "AI-built risk assessment model for crypto trading strategies needs expert validation, stress testing, and regulatory compliance review.",
      aiTools: ["Quant AI", "Risk Modeling"],
      skills: ["Risk Assessment", "Cryptocurrency", "Quantitative Analysis"],
      posted: "3 weeks ago"
    },
    {
      id: 19,
      title: "Influencer Marketing Campaign - Beauty Brand",
      company: "GlowUp Cosmetics",
      category: "Marketing Strategy",
      completion: "80%",
      budget: "$1,400 - $2,100",
      deadline: "10 days",
      description: "AI-designed influencer marketing campaign strategy needs expert creator matching, contract template review, and ROI optimization.",
      aiTools: ["Social AI", "Campaign Builder"],
      skills: ["Influencer Marketing", "Beauty Industry", "Social Media"],
      posted: "3 weeks ago"
    },
    {
      id: 20,
      title: "Agile Transformation Roadmap - Enterprise",
      company: "Enterprise Solutions",
      category: "Business Consulting",
      completion: "70%",
      budget: "$4,500 - $7,000",
      deadline: "30 days",
      description: "AI-created agile transformation roadmap for enterprise organization needs expert methodology validation and implementation planning.",
      aiTools: ["Agile AI", "Transformation Tools"],
      skills: ["Agile Methodology", "Enterprise Transformation", "Project Management"],
      posted: "3 weeks ago"
    },
    {
      id: 21,
      title: "Microservices Architecture - E-commerce Platform",
      company: "ShopFlow Tech",
      category: "Technical & Engineering",
      completion: "85%",
      budget: "$3,000 - $4,500",
      deadline: "18 days",
      description: "AI-designed microservices architecture for high-traffic e-commerce platform needs expert scalability review and deployment strategy.",
      aiTools: ["Architecture AI", "System Design"],
      skills: ["Microservices", "E-commerce", "Scalability"],
      posted: "3 weeks ago"
    },
    {
      id: 22,
      title: "Clinical Data Analysis - Oncology Trial",
      company: "Cancer Research Institute",
      category: "Healthcare & Medical",
      completion: "80%",
      budget: "$5,000 - $8,000",
      deadline: "28 days",
      description: "AI-processed clinical trial data for oncology study needs expert statistical analysis validation and regulatory reporting preparation.",
      aiTools: ["Clinical AI", "Statistical Tools"],
      skills: ["Clinical Data", "Oncology", "Biostatistics"],
      posted: "1 month ago"
    },
    {
      id: 23,
      title: "Visual Identity - Sustainable Fashion Brand",
      company: "EcoWear Collective",
      category: "Design & Creative",
      completion: "75%",
      budget: "$1,800 - $2,800",
      deadline: "14 days",
      description: "AI-generated visual identity for sustainable fashion brand needs expert sustainability messaging integration and brand story refinement.",
      aiTools: ["Brand AI", "Visual Tools"],
      skills: ["Sustainable Design", "Fashion Branding", "Visual Identity"],
      posted: "1 month ago"
    },
    {
      id: 24,
      title: "Literature Review - AI in Education",
      company: "EdTech Research Group",
      category: "Academic & Research",
      completion: "85%",
      budget: "$2,000 - $3,200",
      deadline: "22 days",
      description: "AI-compiled literature review on AI applications in education needs expert academic validation, gap analysis, and research framework.",
      aiTools: ["Research AI", "Academic Tools"],
      skills: ["Educational Research", "AI Applications", "Literature Review"],
      posted: "1 month ago"
    },
    {
      id: 25,
      title: "Privacy Policy - Healthcare App",
      company: "HealthTrack Solutions",
      category: "Legal Services",
      completion: "80%",
      budget: "$1,200 - $2,000",
      deadline: "8 days",
      description: "AI-generated privacy policy for healthcare mobile app needs HIPAA compliance review and state privacy law alignment.",
      aiTools: ["Legal AI", "Privacy Tools"],
      skills: ["Privacy Law", "HIPAA", "Healthcare"],
      posted: "1 month ago"
    },
    {
      id: 26,
      title: "Merger Model - Tech Acquisition",
      company: "Growth Capital Partners",
      category: "Financial Analysis",
      completion: "75%",
      budget: "$4,000 - $6,500",
      deadline: "20 days",
      description: "AI-built merger and acquisition financial model needs expert due diligence validation, synergy analysis, and valuation refinement.",
      aiTools: ["Financial AI", "M&A Tools"],
      skills: ["M&A Analysis", "Valuation", "Due Diligence"],
      posted: "1 month ago"
    },
    {
      id: 27,
      title: "Product Launch Strategy - AI-Powered Analytics",
      company: "DataViz Pro",
      category: "Marketing Strategy",
      completion: "80%",
      budget: "$2,200 - $3,400",
      deadline: "16 days",
      description: "AI-developed product launch strategy for analytics platform needs expert market positioning, competitive analysis, and GTM optimization.",
      aiTools: ["Strategy AI", "Market Tools"],
      skills: ["Product Launch", "B2B SaaS", "Analytics"],
      posted: "1 month ago"
    },
    {
      id: 28,
      title: "Cybersecurity Framework - Financial Services",
      company: "SecureBank Corp",
      category: "Technical & Engineering",
      completion: "70%",
      budget: "$5,500 - $8,500",
      deadline: "35 days",
      description: "AI-designed cybersecurity framework for financial institution needs expert threat modeling, compliance validation, and incident response planning.",
      aiTools: ["Security AI", "Framework Tools"],
      skills: ["Cybersecurity", "Financial Services", "Compliance"],
      posted: "1 month ago"
    },
    {
      id: 29,
      title: "Pharmaceutical Market Access - Rare Disease",
      company: "RareCure Therapeutics",
      category: "Healthcare & Medical",
      completion: "75%",
      budget: "$6,000 - $9,000",
      deadline: "40 days",
      description: "AI-generated market access strategy for rare disease therapy needs expert payer landscape analysis and reimbursement strategy refinement.",
      aiTools: ["Pharma AI", "Market Access Tools"],
      skills: ["Market Access", "Rare Disease", "Reimbursement"],
      posted: "1 month ago"
    },
    {
      id: 30,
      title: "Meta-Analysis - Climate Change Impacts",
      company: "Climate Research Consortium",
      category: "Academic & Research",
      completion: "85%",
      budget: "$3,500 - $5,200",
      deadline: "30 days",
      description: "AI-conducted meta-analysis of climate change impact studies needs expert statistical validation, bias assessment, and publication preparation.",
      aiTools: ["Meta-Analysis AI", "Statistical Tools"],
      skills: ["Meta-Analysis", "Climate Science", "Statistical Methods"],
      posted: "1 month ago"
    }
  ];

  const categories = ["all", ...Array.from(new Set(jobs.map(job => job.category)))];

  const filteredJobs = selectedCategory === "all" 
    ? jobs 
    : jobs.filter(job => job.category === selectedCategory);

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

          <div className="grid gap-6">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-card transition-all duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{job.category}</Badge>
                        <Badge variant="outline">{job.completion} Complete</Badge>
                      </div>
                      <CardTitle className="text-xl text-foreground mb-2">
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
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Posted {job.posted}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{job.description}</p>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">AI Tools Used</h4>
                      <div className="flex flex-wrap gap-1">
                        {job.aiTools.map((tool, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">Required Skills</h4>
                      <div className="flex flex-wrap gap-1">
                        {job.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-accent" />
                      Transparent billing • Expert verification required
                    </div>
                    <Link to={`/job/${job.id}/bid`}>
                      <Button>Submit Bid</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobBoard;