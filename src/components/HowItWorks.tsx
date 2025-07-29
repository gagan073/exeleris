import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "AI-Enhanced Creation",
      description: "Businesses use Repeatable AI tools to create 90% complete deliverables - legal documents, financial analyses, marketing plans, and more."
    },
    {
      number: "02", 
      title: "Submit to Marketplace",
      description: "Upload your AI-generated deliverable to Exeleris with project requirements, timeline, and budget for expert finishing."
    },
    {
      number: "03",
      title: "Expert Bidding",
      description: "Qualified professionals - lawyers, consultants, CFOs, marketing agencies - review and bid on projects in their expertise area."
    },
    {
      number: "04",
      title: "Transparent Completion",
      description: "Selected experts complete the deliverable with full transparency on hours spent and AI tools used for optimization."
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            How Exeleris Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our streamlined process connects AI-enhanced deliverables with expert professionals 
            for efficient, high-quality completion.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <Card key={index} className="relative hover:shadow-card transition-all duration-300">
              <CardHeader>
                <div className="text-accent text-2xl font-bold mb-2">{step.number}</div>
                <CardTitle className="text-lg">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{step.description}</p>
              </CardContent>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-px bg-border"></div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};