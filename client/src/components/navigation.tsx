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
      <nav className={`bg-white border-b transition-all duration-300 ${
        isScrolled 
          ? 'shadow-lg border-neutral-200/80 backdrop-blur-sm bg-white/95' 
          : 'shadow-sm border-neutral-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16"></div>
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3 group">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-105 group-hover:shadow-md">
                  <Brain className="w-4 h-4 text-white transition-transform duration-200 group-hover:rotate-12" />
                </div>
                <h1 className="text-xl font-bold text-neutral-800 transition-colors duration-200 group-hover:text-primary">MemoryBoost</h1>
              </div>
              <div className="hidden md:flex space-x-6">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.path} href={item.path}>
                      <button
                        className={`flex items-center space-x-2 py-2 px-3 font-medium rounded-md transition-all duration-200 relative ${
                          isActive(item.path)
                            ? "text-primary bg-primary/5 border-b-2 border-primary"
                            : "text-neutral-600 hover:text-neutral-800 hover:bg-neutral-50"
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
              <Button variant="ghost" size="sm" className="hover:bg-neutral-100 transition-all duration-200 relative">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full"></span>
              </Button>
              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8 transition-all duration-200 hover:scale-105 hover:shadow-md">
                  <AvatarFallback className="bg-secondary text-white text-sm font-semibold">
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
      <div className="md:hidden bg-white/95 backdrop-blur-sm border-t border-neutral-200 fixed bottom-0 left-0 right-0 z-50 shadow-lg">
        <div className="flex justify-around py-2 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <button
                  className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 min-w-[60px] ${
                    isActive(item.path) 
                      ? "text-primary bg-primary/10 scale-105" 
                      : "text-neutral-600 hover:bg-neutral-100 active:scale-95"
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
