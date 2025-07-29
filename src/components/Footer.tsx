export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-16">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-sm">E</span>
              </div>
              <span className="text-xl font-bold">Exeleris</span>
            </div>
            <p className="text-primary-foreground/80">
              Start with AI, Finish with Experts. The professional services marketplace 
              for AI-enhanced deliverables.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">For Businesses</h3>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Submit Projects</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Success Stories</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Enterprise</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">For Experts</h3>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Find Work</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Expert Application</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Quality Standards</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Payment Terms</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Company</h3>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><a href="#" className="hover:text-primary-foreground transition-colors">About</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 mt-12 pt-8 text-center text-primary-foreground/60">
          <p>&copy; 2024 Exeleris. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};