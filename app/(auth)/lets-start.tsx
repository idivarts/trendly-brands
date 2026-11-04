import LetsStartMobile from "@/components/pre-signin/LetsStartMobile";
import LetsStartWeb from "@/components/pre-signin/LetsStartWeb";
import { useBreakpoints } from "@/hooks";
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";
import { useMyNavigation } from "@/shared-libs/utils/router";
import { chooseWeb, hasChosenWeb, isGateableViewport, isWebBypassParam } from "@/utils/app-download-gate";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Platform } from "react-native";

const TrendlyScreen = () => {
    const { xl } = useBreakpoints()
    const { resetAndNavigate } = useMyNavigation()
    const { web } = useLocalSearchParams<{ web?: string }>()

    // Both gates below need a storage read, so nothing can render until they
    // resolve: painting the page first and redirecting a tick later shows the
    // visitor a screen that is snatched away, which reads as a bug.
    const [resolved, setResolved] = useState(false)

    useEffect(() => {
        let cancelled = false

        const resolve = async () => {
            // `?web=1` is an explicit "I want the browser" — the website's
            // /download page puts it on its "Open the web app" link, where the
            // visitor has just read a page about the apps and picked the
            // browser anyway. Record it up front rather than as its own exit:
            // the gate below already defers to `hasChosenWeb()`, so this needs
            // no second branch, and the choice still lands when the sign-out
            // redirect takes over on the very next line.
            if (isWebBypassParam(web)) await chooseWeb().catch(() => { })

            // Signing out sets this (15-minute TTL), so an existing user who just
            // logged out goes straight back to the auth card. They have already
            // chosen their platform — don't sell them the app on the way out.
            const suppressed = await PersistentStorage.getItemWithExpiry("suppress_lets_start")
            if (cancelled) return
            if (suppressed) {
                resetAndNavigate("/pre-signin")
                return
            }

            // First-time visitor on a phone browser — almost always a marketing
            // CTA ("Start free" / "Get Started"), which points at the bare origin
            // and lands here. Offer the native app before the web app.
            if (isGateableViewport(xl) && !(await hasChosenWeb())) {
                if (cancelled) return
                resetAndNavigate("/get-the-app")
                return
            }

            if (!cancelled) setResolved(true)
        }

        // A rejection here must still end in a rendered page. `resolved` is
        // only ever set on the success path, so an unhandled throw — from a
        // router call, or from anything added to `resolve` later — would leave
        // the app's entry route showing `null` forever, with no retry and no
        // error. Failing open costs at worst a missed gate; failing closed is a
        // white screen on the one route every visitor lands on.
        resolve().catch(() => {
            if (!cancelled) setResolved(true)
        })
        return () => { cancelled = true }
        // `xl` and `web` are deliberately not dependencies: this runs once, on
        // entry. A viewport that crosses the breakpoint mid-session (desktop
        // window resized down) should not suddenly bounce the user out of the
        // page they are already using.
    }, [])

    if (!resolved) return null

    if (Platform.OS === 'web' && xl) {
        return <LetsStartWeb />
    }
    return <LetsStartMobile />
};

export default TrendlyScreen;
