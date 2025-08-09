import { BrandContextProvider } from "@/contexts/brand-context.provider";
import GBProvider from "@/contexts/growthbook-context-provider";
import { Stack } from "expo-router";

export default function Layout() {
    return <BrandContextProvider restrictForPayment={false}>
        <GBProvider>
            <Stack screenOptions={{
                headerShown: false
            }} />
        </GBProvider>
    </BrandContextProvider>;
}