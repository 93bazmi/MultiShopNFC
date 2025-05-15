import { Route, Switch } from "wouter";
import ShopsPage from "@/pages/ShopsPage";
import ProductsPage from "@/pages/ProductsPage";
import POSPage from "@/pages/POSPage";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layouts/MainLayout";
import NFCPaymentPage from "@/pages/NFCPaymentPage";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";
import ReceiptPage from "@/pages/ReceiptPage";

function App() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={ShopsPage} />
        <Route path="/shops" component={ShopsPage} />
        <Route path="/products" component={ProductsPage} />
        <Route path="/pos" component={POSPage} />
        <Route path="/payment/:shopId/:amount" component={NFCPaymentPage} />
        <Route path="/payment-success" component={PaymentSuccessPage} />
        <Route path="/receipt" component={ReceiptPage} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

export default App;
