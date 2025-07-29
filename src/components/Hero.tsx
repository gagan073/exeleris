import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-marketplace.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center bg-subtle-gradient">
      <div className="container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Start with AI,{" "}
                <span className="bg-accent-gradient bg-clip-text text-transparent">
                  Finish with Experts
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                The professional services marketplace where AI-enhanced deliverables 
                meet expert finishing touches. Connect businesses with specialized 
                professionals to complete your critical projects: 70% - 95% cost reduction 5X - 25X faster
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/submit-project">
                <Button variant="premium" size="xl">
                  Submit a Project
                </Button>
              </Link>
              <Link to="/find-work">
                <Button variant="outline" size="xl">
                  Find Expert Work
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span>Transparent Billing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span>AI-Enhanced Efficiency</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span>Expert Quality</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <img 
              src={heroImage} 
              alt="Professional services marketplace" 
              className="w-full h-auto rounded-lg shadow-premium"
            />
            <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-lg shadow-card border">
              <div className="text-sm font-medium text-foreground">90% Complete</div>
              <div className="text-xs text-muted-foreground">Ready for expert review</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};