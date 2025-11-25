import { useDiscovery } from "@/components/discover/Discover";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { Text, View } from "@/shared-uis/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { Button, Chip, HelperText, Menu, TextInput } from "react-native-paper";
import ModashFilter from "./modash/ModashFilter";
import TrendlyAdvancedFilter from "./trendly/TrendlyAdvancedFilter";
import { IAdvanceFilters } from "@/shared-libs/firestore/trendly-pro/models/collaborations";

// --------------------
// Component
// --------------------

export type DB_TYPE = "" | "trendly" | "phyllo" | "modash";

interface IProps {
  style?: StyleProp<ViewStyle>;
  defaultAdvanceFilters?: IAdvanceFilters;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  styles: any;
}

interface DropdownProps {
  label: string;
  placeholder?: string;
  options: string[];
  styles: any;
  flex?: number;
  value?: string;
  onChange?: (value: string | undefined) => void;
}

interface RangeInputProps {
  label: string;
  min?: string;
  max?: string;
  setMin: (value: string) => void;
  setMax: (value: string) => void;
  styles: any;
}

const RightPanelDiscover: React.FC<IProps> = ({ style, defaultAdvanceFilters }) => {
  const {
    selectedDb,
    setSelectedDb: dbWrapper,
    setRightPanel,
    showFilters,
    setShowFilters,
  } = useDiscovery();

  const theme = useTheme();
  const colors = Colors(theme);
  const filterApply = useRef<((action: "apply" | "clear") => void) | undefined>(
    undefined
  );
  const { isCollapsed, setIsCollapsed } = useDiscovery();
  const slideAnim = useRef(new Animated.Value(0)).current;

  const { selectedBrand } = useBrandContext();
  const planKey = selectedBrand?.billing?.planKey;

  const styles = useMemo(() => styleFn(colors), [colors]);

  const toggleCollapse = () => {
    const nextCollapsed = !isCollapsed;
    const toValue = nextCollapsed ? 1 : 0;
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: true,
      tension: 65,
      friction: 10,
    }).start();

    setIsCollapsed(nextCollapsed);
    setRightPanel(!nextCollapsed);
  };

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 400],
  });

  const setSelectedDb = (type: string) => {
    if (type == selectedDb) {
      dbWrapper("");
    } else {
      dbWrapper(type);
    }
  };
  useEffect(() => {
    if (selectedDb == "trendly") {
      setShowFilters(true);
    }
  }, []);

  // Friendly label for current selection
  const selectedDbLabel =
    selectedDb === "trendly"
      ? "Trendly Internal"
      : selectedDb === "phyllo"
      ? "Phyllo"
      : selectedDb === "modash"
      ? "Modash"
      : "";

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          transform: [{ translateX: translateX }],
          maxWidth: isCollapsed ? 0 : 400,
          width: isCollapsed ? 0 : "100%",
        },
      ]}
    >
      <Pressable
        style={[
          styles.collapseButton,
          isCollapsed
            ? { right: 392, left: undefined }
            : { left: -20, right: undefined },
        ]}
        onPress={toggleCollapse}
      >
        <MaterialCommunityIcons
          name={isCollapsed ? "chevron-left" : "chevron-right"}
          size={24}
          color="white"
        />
      </Pressable>
      {!showFilters ? (
        <View style={styles.headerWrap}>
          <Text style={styles.headerTitle}>Access Multiple Databases</Text>
          <Text style={styles.headerSubtitle}>
            Toggle between databases to discover influencers with the best
            filters and pricing.
          </Text>
        </View>
      ) : (
        <View style={styles.headerWrap}>
          <View style={styles.filterHeaderRow}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Text style={styles.dbCardEmoji}>
                {selectedDb === "trendly"
                  ? "🟡"
                  : selectedDb === "phyllo"
                  ? "🌍"
                  : "⚡"}
              </Text>
              <Text style={styles.headerTitle}>{selectedDbLabel}</Text>
              <Chip
                compact
                style={[
                  styles.planBadge,
                  selectedDb === "trendly"
                    ? styles.planBadgePro
                    : styles.planBadgeEnterprise,
                ]}
                // contentStyle={styles.chipContent}
                textStyle={styles.planBadgeText}
              >
                {selectedDb === "trendly" ? "PRO" : "ENTERPRISE"}
              </Chip>
            </View>
            <Button
              mode="text"
              icon="swap-horizontal"
              onPress={() => {
                setShowFilters(false);
                setRightPanel(true);
              }}
            >
              Change database
            </Button>
          </View>
          <Text style={styles.headerSubtitle}>
            Filters for {selectedDbLabel}
          </Text>
        </View>
      )}

      {!showFilters && (
        <View
          style={[styles.headerWrap, { flex: 1, justifyContent: "center" }]}
        >
          {/* Interactive database cards */}
          <View style={styles.dbCards}>
            <DatabaseCard
              title="Trendly Internal"
              badge="PRO"
              planTone="pro"
              emoji="🟡"
              description="Perfect for startup brands. 30k+ Instagram creators under 100k followers. Included in Pro."
              selected={selectedDb === "trendly"}
              onPress={() => setSelectedDb("trendly")}
            />

            <DatabaseCard
              title="Phyllo"
              badge="ENTERPRISE"
              planTone="enterprise"
              emoji="🌍"
              description="250M+ global creators with powerful Phyllo filters. Access via Trendly at ~1/3rd direct cost."
              selected={selectedDb === "phyllo"}
              onPress={() => setSelectedDb("phyllo")}
            />

            <DatabaseCard
              title="Modash"
              badge="ENTERPRISE"
              planTone="enterprise"
              emoji="⚡"
              description="Modash discovery, integrated into Trendly. Available on Enterprise plan."
              selected={selectedDb === "modash"}
              onPress={() => setSelectedDb("modash")}
            />
          </View>

          {/* Selection hint */}
          <HelperText type="info" style={styles.selectionHint}>
            Selected:{" "}
            <Text style={{ fontWeight: "600" }}>{selectedDbLabel}</Text>
          </HelperText>
        </View>
      )}

      {showFilters && (
        <>
          <ScrollView>
            {/* Pass the selected DB downstream when you wire logic later */}
            {selectedDb == "trendly" && (
              <TrendlyAdvancedFilter
                FilterApplyRef={filterApply}
                defaultAdvanceFilters={defaultAdvanceFilters}
              />
            )}
            {selectedDb == "modash" && <ModashFilter />}
            {selectedDb == "phyllo" && <ModashFilter />}
          </ScrollView>
          {/* Actions */}
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <View style={styles.actions}>
              <Button
                mode="text"
                style={styles.clearBtn}
                onPress={() => {
                  filterApply.current?.("clear");
                  // FilterApplySubject.next({ action: "clear" })
                }}
              >
                Clear all
              </Button>
              <Button
                mode="contained"
                style={styles.actionBtn}
                icon="filter-variant"
                onPress={() => {
                  filterApply.current?.("apply");
                  // FilterApplySubject.next({ action: "apply" })
                }}
              >
                Apply
              </Button>
            </View>

            <HelperText type="info" style={styles.helper}>
              Tip: You can refine these later. Values are placeholders for now.
            </HelperText>
          </View>
        </>
      )}

      {!showFilters && (
        <>
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <View style={styles.actions}>
              <Button
                mode="contained"
                style={styles.actionBtn}
                icon="database"
                onPress={() => setShowFilters(true)}
                disabled={
                  (planKey != "enterprise" &&
                    (selectedDb == "phyllo" || selectedDb == "modash")) ||
                  (planKey != "enterprise" && planKey != "pro") ||
                  selectedDb == ""
                }
              >
                Select Database
              </Button>
            </View>

            <HelperText type="info" style={styles.helper}>
              Tip: If you are a startup, Trendly database should be sufficient.
            </HelperText>
          </View>
        </>
      )}
    </Animated.View>
  );
};

// --------------------
// Small helper: clickable database card
// --------------------
const DatabaseCard = ({
  title,
  badge,
  planTone,
  description,
  selected,
  onPress,
  emoji,
}: {
  title: string;
  badge: "PRO" | "ENTERPRISE";
  planTone: "pro" | "enterprise";
  description: string;
  selected?: boolean;
  onPress?: () => void;
  emoji?: string;
}) => {
  const theme = useTheme();
  const colors = Colors(theme);
  const s = styleFn(colors);

  return (
    <Pressable
      onPress={onPress}
      style={[s.dbCard, selected ? s.dbCardSelected : null]}
    >
      <View style={s.dbCardTop}>
        <Text style={s.dbCardEmoji}>{emoji ?? "🔎"}</Text>
        <Chip
          compact
          style={[
            s.planBadge,
            planTone === "pro" ? s.planBadgePro : s.planBadgeEnterprise,
          ]}
          // contentStyle={s.chipContent}
          textStyle={s.planBadgeText}
        >
          {badge}
        </Chip>
      </View>
      <Text style={s.dbCardTitle}>{title}</Text>
      <Text style={s.dbCardDesc}>{description}</Text>
      <View style={s.dbCardFooter}>
        <View style={[s.selectorDot, selected ? s.selectorDotActive : null]} />
        <Text style={s.selectorText}>
          {selected ? "Selected" : "Tap to select"}
        </Text>
      </View>
    </Pressable>
  );
};

// --------------------
// Reusable bits
// --------------------
export const Section: React.FC<SectionProps> = ({
  title,
  children,
  styles,
}) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Chip
        compact
        mode="outlined"
        style={styles.sectionChip}
        textStyle={{ fontSize: 10 }}
      >
        Clear
      </Chip>
    </View>
    {children}
  </View>
);

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  placeholder,
  options,
  styles,
  flex,
  value,
  onChange,
}) => {
  const theme = useTheme();
  const [visible, setVisible] = React.useState(false);
  const [selected, setSelected] = React.useState<string | undefined>(value);

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const handleSelect = (opt: string) => {
    setSelected(opt === "Any" ? undefined : opt);
    onChange?.(opt === "Any" ? undefined : opt);
    closeMenu();
  };

  return (
    <View style={[styles.field, flex ? { flex } : null]}>
      <Text style={styles.label}>{label}</Text>
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        style={{ backgroundColor: Colors(theme).background }}
        anchor={
          <Pressable onPress={openMenu}>
            <TextInput
              mode="outlined"
              dense
              editable={false}
              right={<TextInput.Icon icon="menu-down" />}
              value={selected}
              placeholder={placeholder}
              style={styles.input}
            />
          </Pressable>
        }
      >
        {(options || []).map((opt: string) => (
          <Menu.Item key={opt} onPress={() => handleSelect(opt)} title={opt} />
        ))}
      </Menu>
    </View>
  );
};

export const RangeInput: React.FC<RangeInputProps> = ({
  label,
  min,
  max,
  setMin,
  setMax,
  styles,
}) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inlineInputs}>
      <TextInput
        mode="outlined"
        dense
        keyboardType="numeric"
        value={min}
        onChangeText={setMin}
        placeholder="From"
        style={[styles.input, styles.inputInline]}
      />
      <Text style={styles.hyphen}>-</Text>
      <TextInput
        mode="outlined"
        dense
        keyboardType="numeric"
        value={max}
        onChangeText={setMax}
        placeholder="To"
        style={[styles.input, styles.inputInline]}
      />
    </View>
  </View>
);

// --------------------
// Styles
// --------------------
const styleFn = (colors: ReturnType<typeof Colors>) =>
  StyleSheet.create({
    container: {
      maxWidth: 400,
      width: "100%",
      borderLeftWidth: 1,
      borderLeftColor: colors.border,
      position: "relative",
      transform: [{ translateX: 0 }],
    },
    collapseButton: {
      position: "absolute",
      top: "50%",
      transform: [{ translateY: -20 }],
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      zIndex: 2000,
    },
    collapsedPanel: {
      transform: [{ translateX: 400 }],
    },
    actions: {
      gap: 6,
      paddingTop: 6,
      flexDirection: "row",
      justifyContent: "flex-end",
    },
    actionBtn: {
      borderRadius: 10,
    },
    clearBtn: {
      alignSelf: "center",
    },
    helper: {
      textAlign: "right",
      fontSize: 11,
      opacity: 0.6,
      marginTop: 4,
    },
    headerWrap: {
      padding: 16,
      gap: 10,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.textSecondary ?? colors.text,
      opacity: 0.9,
    },
    filterHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    dbCards: {
      gap: 10,
    },
    dbCard: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      gap: 6,
    },
    dbCardSelected: {
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    dbCardTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    dbCardEmoji: {
      fontSize: 18,
    },
    dbCardTitle: {
      fontSize: 14,
      fontWeight: "600",
    },
    dbCardDesc: {
      fontSize: 12,
      lineHeight: 16,
      opacity: 0.9,
    },
    dbCardFooter: {
      marginTop: 4,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    selectorDot: {
      width: 10,
      height: 10,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: "transparent",
    },
    selectorDotActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    selectorText: {
      fontSize: 11,
      opacity: 0.8,
    },
    planBadge: {
      borderRadius: 8,
      // Remove fixed height which caused uneven vertical padding
      // height: 22,
      justifyContent: "center",
      borderWidth: 0, // border colors set in plan variations
    },
    planBadgePro: {
      backgroundColor: "rgba(255, 215, 0, 0.16)",
      borderColor: colors.success ?? "gold",
      borderWidth: 1,
    },
    planBadgeEnterprise: {
      backgroundColor: "rgba(147, 112, 219, 0.16)",
      borderColor: "purple",
      borderWidth: 1,
    },
    planBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.3,
      color: colors.text,
    },
    chipContent: {
      // Ensure even vertical rhythm and avoid clipping
      minHeight: 24,
      paddingVertical: 2,
      paddingHorizontal: 8,
      alignItems: "center",
    },
    sectionChip: {
      borderColor: colors.border,
      borderRadius: 8,
    },
    selectionHint: {
      marginTop: 2,
      fontSize: 11,
      opacity: 0.7,
    },
  });

export default RightPanelDiscover;
