import { Text } from "@/components/theme/Themed";
import { useBreakpoints } from "@/hooks";
import { useMyNavigation } from "@/shared-libs/utils/router";
import Colors from "@/shared-uis/constants/Colors";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fs } from "@/constants/Typography";

export interface PageHeaderProps {
    customMainContent?: React.ReactNode;
    title: string;
    /**
     * Makes the title editable in place: press it, type, Enter or blur to
     * save, Escape to abandon. Called only when the name actually changed
     * and is not blank.
     *
     * Omit it and the title is plain text, which is what every other
     * screen wants — a page title is usually a fact about where you are,
     * not a field. A document's name is the exception.
     */
    onTitleChange?: (next: string) => void;
    subtitle?: string;
    /** Show back button. On mobile (!xl), defaults to true unless explicitly false. */
    showBackButton?: boolean;
    onBackPress?: () => void;
    /**
     * Generic action buttons rendered on the right (legacy single-group API).
     * For two-group split with divider/second-row behavior, use
     * viewingActionButtons + workflowActionButtons instead.
     */
    actionButtons?: React.ReactNode[];
    /**
     * Lightweight, navigation-oriented buttons (presence, comments, chat
     * toggles). On xl, render on the right before the divider. On !xl,
     * stay on the right of the header row.
     */
    viewingActionButtons?: React.ReactNode[];
    /**
     * High-stakes workflow buttons (Send for Review, New Strategy, etc.).
     * On xl, render on the right after the divider. On !xl, drop to a
     * second row below the header.
     */
    workflowActionButtons?: React.ReactNode[];
    /**
     * Rendered on the left, immediately after the back button (if any)
     * and before the title. Use for sibling-document switchers like a
     * hamburger that opens a list drawer.
     */
    leftAction?: React.ReactNode;
    rightComponent?: React.ReactNode;
    /** On mobile, hide action buttons/rightComponent except when explicitly allowed */
    mobileActions?: "none" | "notification-only" | "all";
}

/**
 * A page title you can rename where it is written.
 *
 * ── Why in place and not a dialog ────────────────────────────────────────
 * The name is already on screen in the size it will be read at. A modal
 * asking for it again shows the same string in a different box and makes
 * the user confirm a thing they can see. Pressing the words and typing is
 * the whole interaction.
 *
 * Committed on blur as well as on Enter, because a person who types a name
 * and then clicks into the thing they were naming has finished — losing it
 * there would be the only way this could annoy anyone. Escape abandons,
 * and so does a blank: a document with no name at all is worse than the
 * one it had.
 */
const EditableTitle: React.FC<{
    value: string;
    onChange: (next: string) => void;
    style: object;
    inputStyle: object;
}> = ({ value, onChange, style, inputStyle }) => {
    const [editing, setEditing] = React.useState(false);
    const [draft, setDraft] = React.useState(value);

    // While not editing the field follows the document — a rename made
    // somewhere else, or one the server corrected, must not be overwritten
    // by a draft left in local state.
    React.useEffect(() => {
        if (!editing) setDraft(value);
    }, [value, editing]);

    const commit = () => {
        setEditing(false);
        const next = draft.trim();
        if (!next || next === value) {
            setDraft(value);
            return;
        }
        onChange(next);
    };

    if (!editing) {
        return (
            <Pressable
                onPress={() => {
                    setDraft(value);
                    setEditing(true);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Rename ${value}`}
            >
                <Text style={style}>{value}</Text>
            </Pressable>
        );
    }
    return (
        <TextInput
            value={draft}
            onChangeText={setDraft}
            onBlur={commit}
            onSubmitEditing={commit}
            onKeyPress={(e) => {
                if (e.nativeEvent.key === "Escape") {
                    setDraft(value);
                    setEditing(false);
                }
            }}
            style={[style, inputStyle]}
            autoFocus
            selectTextOnFocus
            returnKeyType="done"
            accessibilityLabel="Design name"
        />
    );
};

const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    onTitleChange,
    subtitle,
    customMainContent,
    showBackButton,
    onBackPress,
    actionButtons = [],
    viewingActionButtons = [],
    workflowActionButtons = [],
    leftAction,
    rightComponent,
    mobileActions = "none",
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const router = useRouter();
    const nav = useMyNavigation();
    const insets = useSafeAreaInsets();
    const styles = useStyles(colors, insets.top, xl);

    const handleBack = () => {
        if (onBackPress) {
            onBackPress();
        } else if (router.canGoBack()) {
            router.back();
        } else {
            nav.resetAndNavigate("/discover");
        }
    };

    // On mobile, show back button by default unless explicitly disabled
    const showBack =
        showBackButton === true || (showBackButton !== false && !xl);
    const showActions =
        xl ||
        mobileActions === "all" ||
        (mobileActions === "notification-only" && rightComponent);

    const hasActionButtons = actionButtons && actionButtons.length > 0;
    const hasViewingButtons = viewingActionButtons && viewingActionButtons.length > 0;
    const hasWorkflowButtons = workflowActionButtons && workflowActionButtons.length > 0;
    const hasRightComponent = Boolean(rightComponent);
    const hasSplitButtons = hasViewingButtons || hasWorkflowButtons;
    // Workflow actions render inline next to viewing actions, separated by a
    // divider on xl. On !xl they sit flush (screens are expected to render
    // them as icon-only to fit). Screens with too many actions to fit
    // comfortably should host workflow buttons elsewhere (e.g. a toolbar
    // row), not pass them here.
    const showWorkflowInline = hasWorkflowButtons;

    return (
        <View style={styles.headerWrapper}>
            <View style={styles.headerRow}>
                {showBack && (
                    <Pressable onPress={handleBack} style={styles.headerBack}>
                        <FontAwesomeIcon
                            icon={faArrowLeft}
                            size={20}
                            color={colors.text}
                        />
                    </Pressable>
                )}
                {leftAction ? (
                    <View style={styles.headerLeftAction}>{leftAction}</View>
                ) : null}
                {customMainContent ? customMainContent :
                    <View style={styles.headerTitleBlock}>
                        {onTitleChange ? (
                            <EditableTitle
                                value={title}
                                onChange={onTitleChange}
                                style={styles.headerTitle}
                                inputStyle={styles.headerTitleInput}
                            />
                        ) : (
                            <Text style={styles.headerTitle}>{title}</Text>
                        )}
                        {subtitle && xl ? (
                            <Text style={styles.headerSubtitle}>{subtitle}</Text>
                        ) : null}
                    </View>}
                {showActions && (hasActionButtons || hasSplitButtons || hasRightComponent) && (
                    <View style={styles.headerActions}>
                        {hasActionButtons && actionButtons.map((btn, index) => (
                            <React.Fragment key={`a-${index}`}>{btn}</React.Fragment>
                        ))}
                        {hasViewingButtons && viewingActionButtons.map((btn, index) => (
                            <React.Fragment key={`v-${index}`}>{btn}</React.Fragment>
                        ))}
                        {showWorkflowInline && hasViewingButtons && xl && (
                            <View style={styles.headerDivider} />
                        )}
                        {showWorkflowInline && workflowActionButtons.map((btn, index) => (
                            <React.Fragment key={`w-${index}`}>{btn}</React.Fragment>
                        ))}
                        {hasRightComponent && rightComponent}
                    </View>
                )}
            </View>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>, topInset: number, xl: boolean) {
    return useMemo(
        () =>
            StyleSheet.create({
                headerWrapper: {
                    // Shadow + background live on the wrapper so the second
                    // row (mobile workflow actions) sits inside the elevated
                    // surface instead of below it.
                    shadowColor: colors.panelShadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.6,
                    elevation: 2,
                    zIndex: 5,
                    overflow: "visible",
                    backgroundColor: colors.background,
                },
                headerRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: xl ? 16 : 12,
                    paddingTop: 12 + topInset,
                    paddingBottom: 12,
                },
                headerBack: {
                    padding: xl ? 8 : 6,
                    marginRight: xl ? 8 : 4,
                },
                headerLeftAction: {
                    marginRight: 12,
                    flexShrink: 0,
                },
                headerTitleBlock: {
                    flex: 1,
                    flexShrink: 1,
                    minWidth: 0,
                },
                headerTitle: {
                    fontSize: fs(22),
                    fontWeight: "700",
                    color: colors.text,
                },
                // The same words in the same place, with just enough of a
                // field around them to say they can be typed into. No
                // border: the background does that job everywhere else in
                // this app.
                headerTitleInput: {
                    marginLeft: -8,
                    marginVertical: -2,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 8,
                    backgroundColor: colors.tag,
                },
                headerSubtitle: {
                    fontSize: fs(12),
                    fontWeight: "600",
                    color: colors.textSecondary,
                    marginTop: 2,
                    letterSpacing: 1,
                },
                headerActions: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: xl ? 12 : 6,
                    flexShrink: 0,
                },
                headerDivider: {
                    width: 1,
                    height: 24,
                    backgroundColor: colors.border,
                    marginHorizontal: 4,
                },
            }),
        [colors, topInset, xl]
    );
}

export default PageHeader;
