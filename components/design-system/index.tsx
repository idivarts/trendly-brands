/**
 * DesignSystemEditor — the full-page editor body: a section navigator with a
 * completeness meter, the active section's fields, and a live preview.
 *
 * Layout is responsive: on wide screens the navigator, editor and preview sit in
 * three columns; on mobile the navigator is a horizontal pill row and the preview
 * drops below the editor. The screen (design-system.tsx) owns the Design System
 * hook and the Save button; this component is purely the editing surface.
 */
import { useBreakpoints } from "@/hooks";
import {
    DS_SECTIONS,
    DSSectionKey,
    IDesignSystem,
    designSystemCompleteness,
    isDSSectionFilled,
} from "@/shared-libs/firestore/trendly-pro/models/design-system";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text as PaperText } from "react-native-paper";
import LivePreview from "./LivePreview";
import { SectionProps } from "./section-props";
import ColorsSection from "./sections/ColorsSection";
import IdentitySection from "./sections/IdentitySection";
import ImagerySection from "./sections/ImagerySection";
import LogoSection from "./sections/LogoSection";
import PlatformsSection from "./sections/PlatformsSection";
import RulesSection from "./sections/RulesSection";
import TypographySection from "./sections/TypographySection";
import VoiceSection from "./sections/VoiceSection";

const SECTION_META: Record<DSSectionKey, { label: string; component: React.FC<SectionProps> }> = {
    identity: { label: "Identity", component: IdentitySection },
    colors: { label: "Colors", component: ColorsSection },
    typography: { label: "Typography", component: TypographySection },
    logo: { label: "Logo & assets", component: LogoSection },
    imagery: { label: "Imagery", component: ImagerySection },
    voice: { label: "Voice & tone", component: VoiceSection },
    rules: { label: "Content rules", component: RulesSection },
    platforms: { label: "Platforms", component: PlatformsSection },
};

const DesignSystemEditor: React.FC<SectionProps> = ({ ds, onPatch }) => {
    const theme = useTheme();
    const colors = useMemo(() => Colors(theme), [theme]);
    const { xl } = useBreakpoints();
    const styles = useMemo(() => createStyles(colors, xl), [colors, xl]);

    const [active, setActive] = useState<DSSectionKey>("identity");
    const completeness = useMemo(() => designSystemCompleteness(ds), [ds]);
    const ActiveSection = SECTION_META[active].component;

    const nav = (
        <View style={styles.nav}>
            <View style={styles.meterWrap}>
                <View style={styles.meterHeader}>
                    <PaperText style={styles.meterLabel}>Completeness</PaperText>
                    <PaperText style={styles.meterValue}>{completeness}%</PaperText>
                </View>
                <View style={styles.meterTrack}>
                    <View style={[styles.meterFill, { width: `${completeness}%` }]} />
                </View>
            </View>

            <ScrollView
                horizontal={!xl}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={xl ? styles.navListV : styles.navListH}
            >
                {DS_SECTIONS.map((key) => {
                    const activeItem = active === key;
                    const filled = isDSSectionFilled(ds, key);
                    return (
                        <Pressable
                            key={key}
                            onPress={() => setActive(key)}
                            style={[styles.navItem, activeItem && styles.navItemActive]}
                        >
                            <View
                                style={[
                                    styles.navTick,
                                    filled && styles.navTickFilled,
                                    activeItem && filled && styles.navTickOnActive,
                                ]}
                            />
                            <PaperText
                                style={[styles.navText, activeItem && styles.navTextActive]}
                                numberOfLines={1}
                            >
                                {SECTION_META[key].label}
                            </PaperText>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );

    return (
        <View style={styles.root}>
            {xl && nav}
            <ScrollView
                style={styles.editorScroll}
                contentContainerStyle={styles.editorContent}
                showsVerticalScrollIndicator={false}
            >
                {!xl && nav}
                <View style={styles.columns}>
                    {/* On mobile the preview leads (it's the reference card) since the
                        editor can be long; on desktop it sits in the right column. */}
                    {!xl && (
                        <View style={styles.previewColMobile}>
                            <LivePreview ds={ds} />
                        </View>
                    )}
                    <View style={styles.editorCol}>
                        <ActiveSection ds={ds} onPatch={onPatch} />
                    </View>
                    {xl && (
                        <View style={styles.previewCol}>
                            <LivePreview ds={ds} />
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

function createStyles(colors: ReturnType<typeof Colors>, xl: boolean) {
    return StyleSheet.create({
        root: {
            flex: 1,
            flexDirection: xl ? "row" : "column",
            // Breathing space from the drawer (left) and the PageHeader (top),
            // matching the app's standard secondary-page body padding.
            paddingHorizontal: xl ? 28 : 16,
            paddingTop: xl ? 20 : 12,
        },
        // ── Navigator ──
        nav: {
            width: xl ? 232 : undefined,
            paddingRight: xl ? 16 : 0,
            paddingBottom: xl ? 0 : 12,
            gap: 16,
        },
        meterWrap: {
            gap: 8,
            paddingHorizontal: xl ? 4 : 0,
            paddingTop: xl ? 4 : 0,
        },
        meterHeader: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        meterLabel: {
            color: colors.textSecondary,
            fontSize: 12,
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: 0.5,
        },
        meterValue: {
            color: colors.primary,
            fontSize: 13,
            fontWeight: "800",
        },
        meterTrack: {
            height: 8,
            borderRadius: 999,
            backgroundColor: colors.tag,
            overflow: "hidden",
        },
        meterFill: {
            height: "100%",
            borderRadius: 999,
            backgroundColor: colors.primary,
        },
        navListV: {
            gap: 4,
        },
        navListH: {
            gap: 8,
            paddingRight: 16,
        },
        navItem: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor: xl ? "transparent" : colors.tag,
        },
        navItemActive: {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.25,
            elevation: 3,
        },
        navTick: {
            width: 8,
            height: 8,
            borderRadius: 999,
            backgroundColor: colors.gray300,
        },
        navTickFilled: {
            backgroundColor: colors.success,
        },
        navTickOnActive: {
            backgroundColor: colors.onPrimary,
        },
        navText: {
            color: colors.text,
            fontSize: 14,
            fontWeight: "600",
        },
        navTextActive: {
            color: colors.onPrimary,
        },
        // ── Editor + preview ──
        editorScroll: {
            flex: 1,
        },
        editorContent: {
            paddingBottom: 48,
        },
        columns: {
            flexDirection: xl ? "row" : "column",
            gap: 28,
            paddingTop: 4,
        },
        editorCol: {
            flex: xl ? 1 : undefined,
        },
        previewCol: {
            width: xl ? 320 : undefined,
        },
        previewColMobile: {
            marginBottom: 24,
        },
    });
}

export default DesignSystemEditor;
