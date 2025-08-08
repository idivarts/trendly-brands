import { BrandContextProvider } from "@/contexts/brand-context.provider";
import GBProvider from "@/contexts/growthbook-context-provider";
import { Stack } from "expo-router";

export default function Layout() {
    return <GBProvider>
        <BrandContextProvider restrictForPayment={false}>
            <Stack screenOptions={{
                headerShown: false
            }} />
        </BrandContextProvider>
    </GBProvider>;
}