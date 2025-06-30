import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Brain, 
  Home, 
  Video, 
  RotateCcw, 
  BarChart3, 
  Bell,
  Menu
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Enhanced scroll effect for navigation
  useState(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/capture", label: "Capture", icon: Video },
    { path: "/review", label: "Review", icon: RotateCcw },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className={`bg-white/90 backdrop-blur-lg border-b transition-all duration-500 cubic-bezier(0.25, 0.46, 0.45, 0.94) ${
        isScrolled 
          ? 'shadow-xl border-neutral-200/60 bg-white/95' 
          : 'shadow-lg border-neutral-200/40'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3 group magnetic-element">
                <div className="w-9 h-9 apple-button rounded-xl flex items-center justify-center animate-breathe">
                  <Brain className="w-5 h-5 text-white transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                </div>
                <h1 className="text-xl font-bold text-neutral-800 transition-all duration-300 group-hover:text-primary color-moment-primary">MemoryBoost</h1>
              </div>
              <div className="hidden md:flex space-x-6">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.path} href={item.path}>
                      <button
                        className={`flex items-center space-x-2 py-3 px-4 font-medium rounded-lg magnetic-element transition-all duration-300 relative touch-target ${
                          isActive(item.path)
                            ? "text-primary bg-primary/10 shadow-sm border-b-2 border-primary animate-soft-glow"
                            : "text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100/80"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="magnetic-element relative">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-breathe"></span>
              </Button>
              <div className="flex items-center space-x-3">
                <Avatar className="w-9 h-9 magnetic-element ring-2 ring-white shadow-lg">
                  <AvatarFallback className="bg-gradient-to-br from-secondary to-emerald-600 text-white text-sm font-semibold">
                    {user ? getInitials(user.name) : "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-neutral-700 hidden sm:block transition-colors duration-200 hover:text-neutral-800">
                  {user?.name}
                </span>
                <Button variant="ghost" size="sm" onClick={logout} className="hover:bg-destructive/10 hover:text-destructive transition-all duration-200">
                  Logout
                </Button>
              </div>
              {/* Mobile menu trigger */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="sm">
                    <Menu className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col space-y-4 mt-8">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link key={item.path} href={item.path}>
                          <button
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center space-x-3 w-full py-3 px-3 rounded-lg font-medium transition-all duration-200 ${
                              isActive(item.path)
                                ? "bg-primary text-white shadow-md"
                                : "text-neutral-600 hover:bg-neutral-100 hover:translate-x-1"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span>{item.label}</span>
                          </button>
                        </Link>
                      );
                    })}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-neutral-200/60 fixed bottom-0 left-0 right-0 z-50 shadow-2xl">
        <div className="flex justify-around py-3 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <button
                  className={`flex flex-col items-center py-3 px-4 rounded-xl transition-all duration-300 min-w-[64px] touch-target ${
                    isActive(item.path) 
                      ? "text-primary bg-primary/15 scale-105 shadow-lg animate-soft-glow" 
                      : "text-neutral-600 hover:bg-neutral-100/80 active:scale-95 magnetic-element"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs mt-1">{item.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
