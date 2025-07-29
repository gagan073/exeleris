import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Services = () => {
  const serviceCategories = [
    {
      title: "Legal Services",
      description: "Legal document review, contract completion, compliance verification",
      expertise: ["Contract Law", "Corporate Legal", "Regulatory Compliance", "Litigation Support"],
      deliverables: ["Legal Briefs", "Contract Reviews", "Compliance Reports", "Motion Drafts"]
    },
    {
      title: "Financial Analysis", 
      description: "Financial statement analysis, budget completion, investment recommendations",
      expertise: ["Financial Planning", "Risk Assessment", "Investment Analysis", "Tax Strategy"],
      deliverables: ["Financial Models", "Investment Reports", "Budget Analysis", "Tax Documents"]
    },
    {
      title: "Marketing Strategy",
      description: "Marketing plan finalization, campaign optimization, brand strategy",
      expertise: ["Digital Marketing", "Brand Strategy", "Content Marketing", "Performance Marketing"],
      deliverables: ["Marketing Plans", "Campaign Strategies", "Brand Guidelines", "Content Calendars"]
    },
    {
      title: "Business Consulting",
      description: "Strategic planning, operational optimization, project management",
      expertise: ["Strategy Development", "Process Optimization", "Change Management", "Business Analysis"],
      deliverables: ["Strategic Plans", "Process Maps", "Project Plans", "Business Cases"]
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