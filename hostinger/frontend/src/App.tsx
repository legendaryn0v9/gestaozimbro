import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Bar from "./pages/Bar";
import Cozinha from "./pages/Cozinha";
import Entrada from "./pages/Entrada";
import Saida from "./pages/Saida";
import Relatorios from "./pages/Relatorios";
import Usuarios from "./pages/Usuarios";
import Personalizacao from "./pages/Personalizacao";
import AdminFormat from "./pages/AdminFormat";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="zimbro-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/bar" element={<Bar />} />
              <Route path="/cozinha" element={<Cozinha />} />
              <Route path="/entrada" element={<Entrada />} />
              <Route path="/saida" element={<Saida />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/personalizacao" element={<Personalizacao />} />
              <Route path="/admin-format" element={<AdminFormat />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
