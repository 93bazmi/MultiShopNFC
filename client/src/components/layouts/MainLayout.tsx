import { useLocation } from "wouter";
import { 
  Store, 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [location] = useLocation();

  const navigation = [
    { name: "ร้านค้า", href: "/shops", icon: Store },
  ];

  const getPageTitle = () => {
    const route = navigation.find(item => item.href === location);
    return route ? route.name : "หน้า";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 w-full max-w-5xl mx-auto">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-8">
          <div className="mx-auto px-4 py-4 sm:px-6 lg:px-8">
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