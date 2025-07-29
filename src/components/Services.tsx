import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Services = () => {
  const serviceCategories = [
    {
      title: "Legal Services",
      description: "Legal document review, contract completion, compliance verification",
      expertise: ["Contract Law", "Corporate Legal", "Regulatory Compliance", "Litigation Support", "IP Law", "Employment Law"],
      deliverables: ["Legal Briefs", "Contract Reviews", "Compliance Reports", "Motion Drafts", "Patent Applications", "Employment Agreements"]
    },
    {
      title: "Financial Analysis", 
      description: "Financial statement analysis, budget completion, investment recommendations",
      expertise: ["Financial Planning", "Risk Assessment", "Investment Analysis", "Tax Strategy", "Forensic Accounting", "Valuation"],
      deliverables: ["Financial Models", "Investment Reports", "Budget Analysis", "Tax Documents", "Audit Reports", "Valuation Reports"]
    },
    {
      title: "Marketing Strategy",
      description: "Marketing plan finalization, campaign optimization, brand strategy",
      expertise: ["Digital Marketing", "Brand Strategy", "Content Marketing", "Performance Marketing", "SEO/SEM", "Social Media"],
      deliverables: ["Marketing Plans", "Campaign Strategies", "Brand Guidelines", "Content Calendars", "SEO Audits", "Ad Copy"]
    },
    {
      title: "Business Consulting",
      description: "Strategic planning, operational optimization, project management",
      expertise: ["Strategy Development", "Process Optimization", "Change Management", "Business Analysis", "Operations", "HR Consulting"],
      deliverables: ["Strategic Plans", "Process Maps", "Project Plans", "Business Cases", "Operational Procedures", "HR Policies"]
    },
    {
      title: "Technical & Engineering",
      description: "Technical documentation, system architecture, engineering reviews",
      expertise: ["Software Architecture", "Technical Writing", "Code Review", "System Design", "Security Assessment", "DevOps"],
      deliverables: ["Technical Specs", "Architecture Docs", "Code Reviews", "Security Reports", "API Documentation", "System Diagrams"]
    },
    {
      title: "Healthcare & Medical",
      description: "Medical documentation, compliance reviews, healthcare consulting",
      expertise: ["Medical Writing", "Healthcare Compliance", "Clinical Research", "Medical Device", "Regulatory Affairs", "Healthcare IT"],
      deliverables: ["Medical Reports", "Compliance Documents", "Clinical Protocols", "Regulatory Submissions", "Medical Devices", "Health Records"]
    },
    {
      title: "Design & Creative",
      description: "Creative finalization, design reviews, brand development",
      expertise: ["Graphic Design", "UX/UI Design", "Brand Development", "Video Production", "Web Design", "Print Design"],
      deliverables: ["Design Assets", "Brand Guidelines", "UI/UX Designs", "Video Content", "Website Designs", "Print Materials"]
    },
    {
      title: "Academic & Research",
      description: "Research completion, academic writing, data analysis",
      expertise: ["Academic Writing", "Research Methods", "Data Analysis", "Grant Writing", "Peer Review", "Statistical Analysis"],
      deliverables: ["Research Papers", "Grant Proposals", "Data Reports", "Academic Articles", "Literature Reviews", "Statistical Models"]
    }
  ];

  return (
    <section id="services" className="py-20 bg-subtle-gradient">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Expert Service Categories
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Connect with specialized professionals across key business domains to complete 
            your AI-enhanced deliverables with expert precision.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {serviceCategories.map((category, index) => (
            <Card key={index} className="hover:shadow-card transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">{category.title}</CardTitle>
                <p className="text-muted-foreground">{category.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Expertise Areas</h4>
                  <div className="flex flex-wrap gap-2">
                    {category.expertise.map((skill, skillIndex) => (
                      <Badge key={skillIndex} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Common Deliverables</h4>
                  <div className="flex flex-wrap gap-2">
                    {category.deliverables.map((deliverable, deliverableIndex) => (
                      <Badge key={deliverableIndex} variant="outline">
                        {deliverable}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};