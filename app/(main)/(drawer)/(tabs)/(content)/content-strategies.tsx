import AIChatPanel, { FocusItem } from "@/components/shared/AIChatPanel";
import EmptyPromptView from "@/components/content-strategy/EmptyPromptView";
import StrategiesDrawer from "@/components/content-strategy/StrategiesDrawer";
import StrategyEditorPanel from "@/components/content-strategy/StrategyEditorPanel";
import StrategyShimmerPanel from "@/components/content-strategy/StrategyShimmerPanel";
import { CHATBOT_QUESTIONS } from "@/components/content-strategy/mock-data";
import { ChatMessage, ContentStrategy, ScreenState } from "@/components/content-strategy/types";
import { View } from "@/components/theme/Themed";
import PageHeader from "@/components/ui/page-header";
import { useStrategies } from "@/hooks/use-strategies";
import AppLayout from "@/layouts/app-layout";
import Colors from "@/shared-uis/constants/Colors";
import { faBars, faCalendarDays, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";

let msgCounter = 0;
const newId = () => `msg-${++msgCounter}-${Date.now()}`;

const ContentStrategiesScreen = () => {
    const theme = useTheme();
    const colors = Colors(theme);

    const { strategies, addStrategy, updateStrategyContent } = useStrategies();

    const [screenState, setScreenState] = useState<ScreenState>("empty");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [strategyContent, setStrategyContent] = useState("");
    const [activeStrategyId, setActiveStrategyId] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [chatFocusItems, setChatFocusItems] = useState<FocusItem[]>([]);
    const [isAITyping, setIsAITyping] = useState(false);

    // 0 = collecting layout (left:narrow, right:wide), 1 = strategy-ready layout (left:wide, right:narrow)
    const panelRatio = useRef(new Animated.Value(0)).current;

    const styles = useMemo(() => useStyles(colors), [colors]);

    const addMessage = useCallback((sender: "ai" | "user", text: string) => {
        setMessages((prev) => [...prev, { id: newId(), sender, text, timestamp: Date.now() }]);
    }, []);

    const askNextQuestion = useCallback(
        (index: number) => {
            if (index >= CHATBOT_QUESTIONS.length) {
                setIsAITyping(true);
                addMessage("ai", "Perfect! I have everything I need. Generating your content strategy now...");
                setTimeout(async () => {
                    setIsAITyping(false);
                    // In future: call an AI API here to generate real content.
                    // For now, use a placeholder markdown body that the brand can edit.
                    const generatedContent = `# New Content Strategy\n\n*AI-generated strategy based on your inputs.*\n\nEdit this document to refine your strategy.`;
                    const title = "New Strategy";

                    // Persist to Firestore — the onSnapshot listener updates `strategies` reactively
                    const newId = await addStrategy(title, generatedContent);

                    setActiveStrategyId(newId);
                    setStrategyContent(generatedContent);
                    setScreenState("strategy-ready");
                    Animated.timing(panelRatio, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: false,
                    }).start();
                }, 2500);
                return;
            }

            setIsAITyping(true);
            setTimeout(() => {
                setIsAITyping(false);
                addMessage("ai", CHATBOT_QUESTIONS[index]);
            }, 800);
        },
        [addMessage, panelRatio, addStrategy]
    );

    const handleFirstPromit = useCallback(
        (prompt: string) => {
            addMessage("user", prompt);
            setScreenState("collecting");
            panelRatio.setValue(0);
            setQuestionIndex(0);
            askNextQuestion(0);
        },
        [addMessage, askNextQuestion, panelRatio]
    );

    const handleChatSend = useCallback(
        (text: string) => {
            if (isAITyping) return;
            const refs = chatFocusItems.map((f) => `[Ref: "${f.label}"]`).join(" ");
            const fullText = refs ? `${refs}\n${text}` : text;
            addMessage("user", fullText);
            setChatFocusItems([]);

            const nextIndex = questionIndex + 1;
            setQuestionIndex(nextIndex);
            askNextQuestion(nextIndex);
        },
        [isAITyping, chatFocusItems, questionIndex, addMessage, askNextQuestion]
    );

    const handleSendToChat = useCallback((text: string) => {
        const label = text.length > 120 ? text.slice(0, 120) + "..." : text;
        setChatFocusItems((prev) => {
            const id = `focus-${Date.now()}`;
            return [...prev, { id, label }];
        });
    }, []);

    const handleNewStrategy = useCallback(() => {
        setScreenState("empty");
        setMessages([]);
        setQuestionIndex(0);
        setActiveStrategyId(null);
        setStrategyContent("");
        setChatFocusItems([]);
        panelRatio.setValue(0);
    }, [panelRatio]);

    const handleSelectStrategy = useCallback((strategy: ContentStrategy) => {
        setActiveStrategyId(strategy.id);
        setStrategyContent(strategy.content);
        setScreenState("strategy-ready");
        panelRatio.setValue(1);
    }, [panelRatio]);

    // Persist editor changes back to Firestore when the user edits the markdown
    const handleStrategyContentChange = useCallback(
        async (newContent: string) => {
            setStrategyContent(newContent);
            if (activeStrategyId) {
                await updateStrategyContent(activeStrategyId, newContent);
            }
        },
        [activeStrategyId, updateStrategyContent]
    );

    const leftFlex = panelRatio.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 3],
    });
    const rightFlex = panelRatio.interpolate({
        inputRange: [0, 1],
        outputRange: [3, 1],
    });

    const headerActionButtons = useMemo(() => {
        if (screenState !== "strategy-ready") return [];
        return [
            <Pressable
                key="seal"
                style={({ pressed }) => [styles.headerBtn, styles.headerBtnOutline, pressed && styles.headerBtnPressed]}
                onPress={() => { }}
            >
                <FontAwesomeIcon icon={faCalendarDays} size={14} color={colors.primary} />
                <Text style={styles.headerBtnOutlineText}>Seal → Calendar</Text>
            </Pressable>,
            <Pressable
                key="new"
                style={({ pressed }) => [styles.headerBtn, styles.headerBtnPrimary, pressed && styles.headerBtnPressed]}
                onPress={handleNewStrategy}
            >
                <FontAwesomeIcon icon={faPlus} size={14} color={colors.onPrimary} />
                <Text style={styles.headerBtnPrimaryText}>New Strategy</Text>
            </Pressable>,
            strategies.length > 0 ? (
                <Pressable
                    key="hamburger"
                    style={({ pressed }) => [styles.iconBtn, pressed && styles.headerBtnPressed]}
                    onPress={() => setDrawerOpen(true)}
                >
                    <FontAwesomeIcon icon={faBars} size={18} color={colors.text} />
                </Pressable>
            ) : null,
        ].filter(Boolean) as React.ReactElement[];
    }, [screenState, strategies.length, colors, handleNewStrategy, styles]);

    return (
        <AppLayout>
            <PageHeader
                title="Content Strategy"
                subtitle="Form a strategy before putting it in actionable content"
                showBackButton={false}
                actionButtons={headerActionButtons}
                mobileActions="all"
            />

            {screenState === "empty" && (
                <EmptyPromptView onSubmit={handleFirstPromit} />
            )}

            {(screenState === "collecting" || screenState === "strategy-ready") && (
                <View style={styles.splitContainer}>
                    <Animated.View style={[styles.leftPanel, { flex: leftFlex }]}>
                        {screenState === "collecting" ? (
                            <StrategyShimmerPanel />
                        ) : (
                            <StrategyEditorPanel
                                content={strategyContent}
                                onChange={handleStrategyContentChange}
                                onSendToChat={handleSendToChat}
                            />
                        )}
                    </Animated.View>

                    <Animated.View style={[styles.rightPanel, { flex: rightFlex }]}>
                        <AIChatPanel
                            messages={messages}
                            onSend={handleChatSend}
                            focusItems={chatFocusItems}
                            onRemoveFocusItem={(id) =>
                                setChatFocusItems((prev) => prev.filter((f) => f.id !== id))
                            }
                            isCompact={screenState === "strategy-ready"}
                            isAITyping={isAITyping}
                        />
                    </Animated.View>
                </View>
            )}

            <StrategiesDrawer
                visible={drawerOpen}
                strategies={strategies}
                activeId={activeStrategyId}
                onSelect={handleSelectStrategy}
                onClose={() => setDrawerOpen(false)}
            />
        </AppLayout>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                splitContainer: {
                    flex: 1,
                    flexDirection: "row",
                    overflow: "hidden",
                },
                leftPanel: {
                    overflow: "hidden",
                },
                rightPanel: {
                    overflow: "hidden",
                },
                headerBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 8,
                },
                headerBtnPrimary: {
                    backgroundColor: colors.primary,
                },
                headerBtnPrimaryText: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.onPrimary,
                },
                headerBtnOutline: {
                    borderWidth: 1,
                    borderColor: colors.primary,
                },
                headerBtnOutlineText: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.primary,
                },
                headerBtnPressed: {
                    opacity: 0.7,
                },
                iconBtn: {
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: colors.border,
                },
            }),
        [colors]
    );
}

export default ContentStrategiesScreen;
