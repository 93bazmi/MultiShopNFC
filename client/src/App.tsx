import { Route, Switch } from "wouter";
import ShopsPage from "@/pages/ShopsPage";
import ProductsPage from "@/pages/ProductsPage";
import POSPage from "@/pages/POSPage";
import ReceiptPage from "@/pages/ReceiptPage";
import TransactionsPage from "@/pages/TransactionsPage";
import CoinsPage from "@/pages/CoinsPage";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layouts/MainLayout";

function App() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={ShopsPage} />
        <Route path="/shops" component={ShopsPage} />
        <Route path="/products" component={ProductsPage} />
        <Route path="/pos" component={POSPage} />
        <Route path="/transactions" component={TransactionsPage} />
        <Route path="/coins" component={CoinsPage} />
        <Route path="/receipt" component={ReceiptPage} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

export default App;
