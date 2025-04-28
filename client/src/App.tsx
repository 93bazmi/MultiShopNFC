import { Route, Switch } from "wouter";
import DashboardPage from "@/pages/DashboardPage";
import ShopsPage from "@/pages/ShopsPage";
import ProductsPage from "@/pages/ProductsPage";
import TransactionsPage from "@/pages/TransactionsPage";
import POSPage from "@/pages/POSPage";
import CoinsPage from "@/pages/CoinsPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layouts/MainLayout";

function App() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/shops" component={ShopsPage} />
        <Route path="/products" component={ProductsPage} />
        <Route path="/transactions" component={TransactionsPage} />
        <Route path="/pos" component={POSPage} />
        <Route path="/coins" component={CoinsPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

export default App;
