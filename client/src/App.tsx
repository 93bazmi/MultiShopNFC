import { Route, Switch } from "wouter";
import ShopsPage from "@/pages/ShopsPage";
import ShopDetailPage from "@/pages/ShopDetailPage";
import ProductsPage from "@/pages/ProductsPage";
import POSPage from "@/pages/POSPage";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layouts/MainLayout";
import TopupPage from "@/pages/TopupPage";
import NFCTestPage from "@/pages/NFCTestPage"; // เพิ่ม import หน้าทดสอบ NFC
function App() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={ShopsPage} />
        <Route path="/shops" component={ShopsPage} />
        <Route path="/shop/:id" component={ShopDetailPage} />
        <Route path="/products" component={ProductsPage} />
        <Route path="/pos" component={POSPage} />
        <Route path="/topup" component={TopupPage} /> {/* เพิ่มเส้นทางสำหรับหน้าเติมเงิน */}
        <Route path="/nfc-test" component={NFCTestPage} /> {/* เพิ่มเส้นทางสำหรับหน้าทดสอบ NFC */}
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

export default App;
