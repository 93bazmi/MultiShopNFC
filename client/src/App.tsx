import { Route, Switch } from "wouter";
import ShopsPage from "@/pages/ShopsPage";
import ShopDetailPage from "@/pages/ShopDetailPage";
import ProductsPage from "@/pages/ProductsPage";
import POSPage from "@/pages/POSPage";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layouts/MainLayout";

function App() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={ShopsPage} />
        <Route path="/shops" component={ShopsPage} />
        <Route path="/shop/:id" component={ShopDetailPage} />
        <Route path="/products" component={ProductsPage} />
        <Route path="/pos" component={POSPage} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

export default App;
