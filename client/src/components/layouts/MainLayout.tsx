import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  ChevronLeft, 
  LayoutDashboard, 
  Store, 
  Package, 
  RefreshCcw, 
  CreditCard, 
  Coins, 
  Settings,
  Search,
  Bell,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { toast } = useToast();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "My Shops", href: "/shops", icon: Store },
    { name: "Products", href: "/products", icon: Package },
    { name: "Transactions", href: "/transactions", icon: RefreshCcw },
    { name: "POS System", href: "/pos", icon: CreditCard },
    { name: "Coin Management", href: "/coins", icon: Coins },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const getPageTitle = () => {
    const route = navigation.find(item => item.href === location);
    return route ? route.name : "Page";
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <div 
        className={cn(
          "bg-gray-800 text-white md:h-screen md:fixed z-10 transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-full md:w-64"
        )}
      >
        <div className="flex items-center justify-between h-16 border-b border-gray-700 px-4">
          {!collapsed && (
            <h1 className="text-xl font-bold tracking-wider flex items-center">
              <Store className="mr-2" />
              ShopPay
            </h1>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:flex hidden"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className={cn("h-4 w-4", collapsed && "rotate-180")} />
          </Button>
        </div>
        <nav className="px-2 py-4">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <a 
                className={cn(
                  "flex items-center mb-2 rounded-lg transition-colors",
                  location === item.href 
                    ? "text-gray-100 bg-gray-700" 
                    : "text-gray-300 hover:bg-gray-700",
                  collapsed ? "justify-center px-2 py-3" : "px-4 py-3"
                )}
              >
                <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                {!collapsed && <span>{item.name}</span>}
              </a>
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full border-t border-gray-700 p-4 md:block hidden">
          <div className={cn("flex items-center", collapsed && "justify-center")}>
            <Avatar className="h-8 w-8 mr-3">
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User" />
              <AvatarFallback>JS</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div>
                <p className="text-sm font-medium text-white">John Smith</p>
                <p className="text-xs text-gray-400">Admin</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn(
        "flex-1 transition-all duration-300 ease-in-out",
        collapsed ? "md:ml-16" : "md:ml-64"
      )}>
        {/* Header */}
        <header className="bg-white shadow sticky top-0 z-10">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-xl text-gray-800 leading-tight">{getPageTitle()}</h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Input 
                  type="text" 
                  placeholder="Search..." 
                  className="pr-8 w-full md:w-auto"
                />
                <Search className="h-4 w-4 text-gray-400 absolute right-3 top-2.5" />
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                className="relative bg-primary text-white rounded-full"
                onClick={() => {
                  toast({
                    title: "Notifications",
                    description: "You have 3 unread notifications",
                  });
                }}
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">3</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-500 md:hidden"
                onClick={() => setCollapsed(!collapsed)}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
