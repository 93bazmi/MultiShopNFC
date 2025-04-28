import { useState } from "react";
import { useLocation } from "wouter";
import { 
  ChevronLeft, 
  Store, 
  Package, 
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navigation = [
    { name: "ร้านค้า", href: "/shops", icon: Store },
    { name: "สินค้า", href: "/products", icon: Package },
    { name: "ระบบชำระเงิน", href: "/pos", icon: CreditCard },
  ];

  const getPageTitle = () => {
    const route = navigation.find(item => item.href === location);
    return route ? route.name : "หน้า";
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
              ระบบชำระเงิน NFC
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
            <div
              key={item.name}
              className={cn(
                "flex items-center mb-2 rounded-lg transition-colors cursor-pointer",
                location === item.href 
                  ? "text-gray-100 bg-gray-700" 
                  : "text-gray-300 hover:bg-gray-700",
                collapsed ? "justify-center px-2 py-3" : "px-4 py-3"
              )}
              onClick={() => window.location.href = item.href}
            >
              <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
              {!collapsed && <span>{item.name}</span>}
            </div>
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
                <p className="text-sm font-medium text-white">เจ้าของร้าน</p>
                <p className="text-xs text-gray-400">ผู้ดูแลระบบ</p>
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