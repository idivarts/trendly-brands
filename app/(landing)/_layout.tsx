import { BrandContextProvider } from "@/contexts/brand-context.provider";
import GrowthBookProvider from "@/contexts/growthbook-context-provider";
import { Stack } from "expo-router";

export default function Layout() {
    return <GrowthBookProvider>
        <BrandContextProvider restrictForPayment={false}>
            <Stack screenOptions={{
                headerShown: false
            }} />
        </BrandContextProvider>
    </GrowthBookProvider>;
}