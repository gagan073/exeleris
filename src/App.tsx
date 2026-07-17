import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import SubmitProject from "./pages/SubmitProject";
import FindWork from "./pages/FindWork";
import JobBoard from "./pages/JobBoard";
import ProjectDetail from "./pages/ProjectDetail";
import SubmitBid from "./pages/SubmitBid";
import BidComparison from "./pages/BidComparison";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/submit-project"
              element={
                <ProtectedRoute allowedRoles={["business"]}>
                  <SubmitProject />
                </ProtectedRoute>
              }
            />
            <Route path="/find-work" element={<FindWork />} />
            <Route path="/jobs" element={<JobBoard />} />
            <Route path="/job/:jobId" element={<ProjectDetail />} />
            <Route
              path="/job/:jobId/bid"
              element={
                <ProtectedRoute allowedRoles={["expert"]}>
                  <SubmitBid />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:projectId/bids"
              element={
                <ProtectedRoute allowedRoles={["business", "super_admin"]}>
                  <BidComparison />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
