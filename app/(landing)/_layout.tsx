import { BrandContextProvider } from "@/contexts/brand-context.provider";
import { Stack } from "expo-router";

export default function Layout() {
    return <BrandContextProvider restrictForPayment={false}>
        <Stack />
    </BrandContextProvider>;
}