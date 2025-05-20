import { useLocation } from "wouter";
import { 
  Store, 
  PlusCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [location] = useLocation();

  const navigation = [
    { name: "ร้านค้า", href: "/shops", icon: Store },
    { name: "เติมเงิน", href: "/topup", icon: PlusCircle }, // เพิ่มเมนูเติมเงิน
  ];


  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 w-full max-w-5xl mx-auto">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div>
              {/* เพิ่มเมนูนำทาง */}
              <nav className="flex space-x-8">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900",
                      location === item.href ? "border-b-2 border-primary" : "hover:border-b-2 hover:border-gray-300"
                    )}
                  >
                    <item.icon className="mr-2 h-5 w-5" aria-hidden="true" />
                    {item.name}
                  </a>
                ))}
              </nav>
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