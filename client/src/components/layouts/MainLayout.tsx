import { useState } from "react";
import { useLocation } from "wouter";
import { 
  ChevronLeft, 
  Store, 
  ShoppingCart,
  Menu
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Check if we're in the receipt page to hide navigation
  const isReceiptPage = location.startsWith('/receipt');

  const navigation = [
    { name: "ร้านค้า", href: "/shops", icon: Store },
  ];

  const getPageTitle = () => {
    const route = navigation.find(item => item.href === location);
    return route ? route.name : "หน้า";
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-0 left-0 z-30 m-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="bg-white shadow-md rounded-full"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-5 w-5 text-gray-700" />
        </Button>
      </div>

      {/* Sidebar - Mobile */}
      <div className={cn(
        "md:hidden fixed inset-0 z-20 bg-gray-800/50 backdrop-blur-sm transition-opacity",
        mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <div className={cn(
          "bg-gray-800 text-white h-full w-64 transition-transform duration-300 ease-in-out",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex items-center justify-between h-16 border-b border-gray-700 px-4">
            <h1 className="text-xl font-bold tracking-wider flex items-center">
              <ShoppingCart className="mr-2" />
              ระบบชำระเงิน NFC
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(false)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <nav className="px-2 py-4">
            {navigation.map((item) => (
              <div
                key={item.name}
                className={cn(
                  "flex items-center mb-2 rounded-lg transition-colors cursor-pointer px-4 py-3",
                  location === item.href 
                    ? "text-gray-100 bg-blue-600" 
                    : "text-gray-300 hover:bg-gray-700"
                )}
                onClick={() => {
                  window.location.href = item.href;
                  setMobileMenuOpen(false);
                }}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span>{item.name}</span>
              </div>
            ))}
          </nav>
          <div className="absolute bottom-0 w-full border-t border-gray-700 p-4">
            <div className="flex items-center">
              <Avatar className="h-10 w-10 mr-3 border-2 border-blue-500">
                <AvatarImage src="/avatar.png" alt="User" />
                <AvatarFallback className="bg-blue-600 text-white">NFC</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-white">ผู้ใช้งานระบบ</p>
                <p className="text-xs text-gray-400">NFC Shop System</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar - Desktop */}
      <div 
        className={cn(
          "bg-gradient-to-b from-blue-800 to-blue-900 text-white md:h-screen md:fixed z-10 transition-all duration-300 ease-in-out hidden md:block",
          collapsed ? "w-16" : "md:w-64"
        )}
      >
        <div className="flex items-center justify-between h-16 border-b border-blue-700/50 px-4">
          {!collapsed && (
            <h1 className="text-xl font-bold tracking-wider flex items-center">
              <ShoppingCart className="mr-2" />
              <span className="bg-gradient-to-r from-white to-blue-200 text-transparent bg-clip-text">
                ระบบชำระเงิน NFC
              </span>
            </h1>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-blue-700/50"
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
                "flex items-center mb-3 rounded-lg transition-colors cursor-pointer",
                location === item.href 
                  ? "text-white bg-blue-600 shadow-lg shadow-blue-600/30" 
                  : "text-blue-100 hover:bg-blue-700/50",
                collapsed ? "justify-center px-2 py-3" : "px-4 py-3"
              )}
              onClick={() => window.location.href = item.href}
            >
              <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
              {!collapsed && <span>{item.name}</span>}
            </div>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full border-t border-blue-700/50 p-4 md:block hidden">
          <div className={cn("flex items-center", collapsed && "justify-center")}>
            <Avatar className="h-10 w-10 mr-3 border-2 border-blue-500">
              <AvatarImage src="/avatar.png" alt="User" />
              <AvatarFallback className="bg-blue-600 text-white">NFC</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div>
                <p className="text-sm font-medium text-white">ผู้ใช้งานระบบ</p>
                <p className="text-xs text-blue-200">NFC Shop System</p>
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
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div className="ml-8 md:ml-0">
              <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                {getPageTitle()}
              </h2>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-8">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              ระบบชำระเงิน NFC &copy; {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;