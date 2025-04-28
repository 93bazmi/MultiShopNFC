import { useQuery } from "@tanstack/react-query";
import { API } from "@/lib/airtable";
import ShopList from "@/components/shop/ShopList";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ShopsPage = () => {
  const { data: shops, isLoading } = useQuery({
    queryKey: [API.SHOPS],
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Shops</CardTitle>
          <CardDescription>
            Manage all your shops from one place. Create new shops and view existing ones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShopList shops={shops || []} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ShopsPage;
