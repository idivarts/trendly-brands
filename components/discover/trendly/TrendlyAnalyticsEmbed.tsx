import { useAuthContext } from "@/contexts/auth-context.provider";
import {
  ISocialAnalytics,
  ISocials,
} from "@/shared-libs/firestore/trendly-pro/models/bq-socials";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { View } from "@/shared-uis/components/theme/Themed";
import { Brand } from "@/types/Brand";
import { collection, doc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Image, Linking, ScrollView } from "react-native";
import {
  ActivityIndicator,
  Card,
  Chip,
  Divider,
  List,
  Text,
} from "react-native-paper";
import { InfluencerItem, StatChip } from "../DiscoverInfluencer";
import EditSocialMetricsModal from "./EditSocialMetricsModal";

interface IProps {
  influencer: InfluencerItem;
  selectedBrand: Brand;
}

const TrendlyAnalyticsEmbed = React.forwardRef<any, IProps>(
  ({ influencer, selectedBrand }, ref) => {
    const { manager } = useAuthContext();
    const [loading, setLoading] = useState(false);
    const [social, setSocial] = useState<ISocials | null>(null);
    const [analytics, setAnalytics] = useState<ISocialAnalytics | null>(null);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [editedSocial, setEditedSocial] = useState<Partial<ISocials>>({});
    const isAdmin = manager?.isAdmin === true;
    const hasChanges = Object.keys(editedSocial).length > 0;

    const loadInfluencer = async () => {
      try {
        setLoading(true);
        const body = await HttpWrapper.fetch(
          `/discovery/brands/${selectedBrand?.id || ""}/influencers/${
            influencer.id
          }`,
          {
            method: "GET",
            headers: {
              "content-type": "application/json",
            },
          }
        ).then(async (res) => res.json());

        const s = body.social as ISocials | undefined;
        const a = body.analysis as ISocialAnalytics | undefined;

        if (s) setSocial(s);
        if (a) setAnalytics(a);
      } catch (e) {
        // no-op; you can hook to your toast/snackbar here
      } finally {
        setLoading(false);
      }
    };

    const handleSaveChanges = async () => {
      if (!social?.id || !hasChanges) return;

      try {
        setIsSaving(true);
        setSaveError(null);
        const updatedSocial = { ...social, ...editedSocial };
        const col = collection(FirestoreDB, "scrapped-socials");
        const docRef = doc(col, social.id);

        await updateDoc(docRef, updatedSocial);

        setSocial(updatedSocial);
        setIsEditModalVisible(false);
        setEditedSocial({});
      } catch (e: any) {
        console.error("Error saving social data:", e);
        const errorMessage =
          e?.message || "Failed to save changes. Please try again.";
        setSaveError(errorMessage);
      } finally {
        setIsSaving(false);
      }
    };

    const handleEditClick = () => {
      if (social) {
        setEditedSocial({});
        setSaveError(null);
        setIsEditModalVisible(true);
      }
    };

    React.useImperativeHandle(
      ref,
      () => ({
        handleEditClick,
        isAdmin,
        openEditModal: handleEditClick,
      }),
      [handleEditClick, isAdmin]
    );

    useEffect(() => {
      if (!selectedBrand?.id) return;

      loadInfluencer();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedBrand]);

    const formatNumber = (n?: number | null) => {
      if (n === null || n === undefined) return "—";
      try {
        return new Intl.NumberFormat(undefined, {
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(n);
      } catch {
        return `${n}`;
      }
    };

    const formatPercent = (p?: number | null) => {
      if (p === null || p === undefined) return "—";
      return `${(p * 100).toFixed(2)}%`;
    };

    const formatCurrency = (n?: number | null) => {
      if (n === null || n === undefined) return "—";
      try {
        return new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: "INR",
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(n);
      } catch {
        return `₹${formatNumber(n)}`;
      }
    };

    const formatDate = (epoch?: number | null) => {
      if (!epoch) return "—";
      try {
        return new Date(epoch * 1000).toLocaleString();
      } catch {
        return `${epoch}`;
      }
    };

    const HeaderCards = ({ analytics }: { analytics: ISocialAnalytics }) => (
      <View style={{ marginHorizontal: 12, marginBottom: 12 }}>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          <Card style={{ width: "31%", marginBottom: 12 }}>
            <Card.Content>
              <Text
                variant="labelLarge"
                style={{ opacity: 0.7, marginBottom: 6 }}
              >
                Quality
              </Text>
              <Text variant="displaySmall">
                {analytics.quality}
                <Text variant="labelLarge">%</Text>
              </Text>
              <Text variant="bodySmall" style={{ opacity: 0.7, marginTop: 6 }}>
                Higher = richer, classy, aesthetic creators
              </Text>
            </Card.Content>
          </Card>

          <Card style={{ width: "31%", marginBottom: 12 }}>
            <Card.Content>
              <Text
                variant="labelLarge"
                style={{ opacity: 0.7, marginBottom: 6 }}
              >
                Trustability
              </Text>
              <Text variant="displaySmall">
                {analytics.trustablity}
                <Text variant="labelLarge">%</Text>
              </Text>
              <Text variant="bodySmall" style={{ opacity: 0.7, marginTop: 6 }}>
                Signals from past collabs, engagement quality
              </Text>
            </Card.Content>
          </Card>
          <Card style={{ width: "31%", marginBottom: 12 }}>
            <Card.Content>
              <Text
                variant="labelLarge"
                style={{ opacity: 0.7, marginBottom: 6 }}
              >
                CPM
              </Text>
              <Text variant="displaySmall">
                {formatCurrency(analytics.cpm)}{" "}
              </Text>
              <Text variant="bodySmall" style={{ opacity: 0.7, marginTop: 6 }}>
                Cost per Mille (1000 views)
              </Text>
            </Card.Content>
          </Card>

          <Card style={{ width: "48%", marginBottom: 12 }}>
            <Card.Content>
              <Text
                variant="labelLarge"
                style={{ opacity: 0.7, marginBottom: 6 }}
              >
                Estimated Budget
              </Text>
              <Text variant="headlineLarge">
                {formatCurrency(analytics.estimatedBudget?.min)} —{" "}
                {formatCurrency(analytics.estimatedBudget?.max)}
              </Text>
              <Text variant="bodySmall" style={{ opacity: 0.7, marginTop: 6 }}>
                Typical creator ask for one deliverable
              </Text>
            </Card.Content>
          </Card>

          <Card style={{ width: "48%", marginBottom: 12 }}>
            <Card.Content>
              <Text
                variant="labelLarge"
                style={{ opacity: 0.7, marginBottom: 6 }}
              >
                Estimated Reach
              </Text>
              <Text variant="headlineLarge">
                {formatNumber(analytics.estimatedReach?.min)} —{" "}
                {formatNumber(analytics.estimatedReach?.max)}
              </Text>
              <Text variant="bodySmall" style={{ opacity: 0.7, marginTop: 6 }}>
                Projected unique views per post
              </Text>
            </Card.Content>
          </Card>
        </View>
      </View>
    );

    const ProfileOverviewCard = ({ social }: { social: ISocials }) => (
      <Card style={{ marginHorizontal: 12, marginBottom: 12 }}>
        <Card.Title
          title={social.name || social.username}
          subtitle={[
            social.username ? `@${social.username}` : "",
            social.category,
          ]
            .filter(Boolean)
            .join(" · ")}
          right={(props) => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingRight: 12,
              }}
            >
              {social.profile_verified && (
                <Chip compact icon="check-decagram" style={{ marginRight: 6 }}>
                  Verified
                </Chip>
              )}
            </View>
          )}
        />

        <Card.Content>
          <Text
            variant="bodyMedium"
            style={{ marginBottom: 8 }}
            numberOfLines={2}
          >
            {social.bio != "unknown" ? social.bio : ""}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {!!social.location && social.location != "unknown" && (
              <Chip
                style={{ marginRight: 8, marginBottom: 8 }}
                icon="map-marker"
              >
                {social.location}
              </Chip>
            )}
            {!!social.gender && social.gender != "unknown" && (
              <Chip
                style={{ marginRight: 8, marginBottom: 8 }}
                icon="gender-male-female"
              >
                {social.gender}
              </Chip>
            )}
            {typeof social.quality_score === "number" && (
              <Chip style={{ marginRight: 8, marginBottom: 8 }} icon="star">
                Quality: {social.quality_score}/100
              </Chip>
            )}
          </View>

          {Array.isArray(social.niches) && social.niches.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text variant="labelLarge" style={{ marginBottom: 6 }}>
                Niches
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {social.niches.map((n) => (
                  <Chip key={n} style={{ marginRight: 8, marginBottom: 8 }}>
                    {n}
                  </Chip>
                ))}
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
    );

    const TotalsCard = ({ social }: { social: ISocials }) => (
      <Card style={{ marginHorizontal: 12, marginBottom: 12 }}>
        <Card.Title title="Totals" />
        <Card.Content>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            <StatChip label="Followers" value={social.follower_count} />
            <StatChip label="Following" value={social.following_count} />
            <StatChip label="Posts" value={social.content_count} />
            <StatChip label="Total Views" value={social.views_count} />
            <StatChip
              label="Total Engagements"
              value={social.engagement_count}
            />
          </View>
        </Card.Content>
      </Card>
    );

    const AveragesCard = ({ social }: { social: ISocials }) => (
      <Card style={{ marginHorizontal: 12, marginBottom: 12 }}>
        <Card.Title title="Averages & Rates" />
        <Card.Content>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            <StatChip label="Median Views" value={social.average_views} />
            <StatChip label="Median Likes" value={social.average_likes} />
            <StatChip label="Median Comments" value={social.average_comments} />
            <StatChip
              label="Engagement Rate %"
              value={social.engagement_rate || 0}
            />
            <StatChip label="Quality Score" value={social.quality_score} />
          </View>
        </Card.Content>
      </Card>
    );

    const ReelsCard = ({ social }: { social: ISocials }) =>
      Array.isArray(social.reels) && social.reels.length > 0 ? (
        <Card style={{ marginHorizontal: 12, marginBottom: 12 }}>
          <Card.Title title={`Reels`} />
          <Card.Content>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row" }}>
                {social.reels.map((r) => (
                  <Card
                    key={r.id}
                    style={{ width: 140, marginRight: 12 }}
                    onPress={() => r.url && Linking.openURL(r.url)}
                  >
                    {!!r.thumbnail_url && (
                      <Image
                        source={{ uri: r.thumbnail_url }}
                        style={{
                          width: "100%",
                          height: 180,
                          borderTopLeftRadius: 12,
                          borderTopRightRadius: 12,
                        }}
                      />
                    )}
                    <Card.Content>
                      <Text
                        numberOfLines={2}
                        variant="bodySmall"
                        style={{ marginTop: 6 }}
                      >
                        {r.caption || "Reel"}
                      </Text>
                      <Divider style={{ marginVertical: 6 }} />
                      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                        <Chip
                          compact
                          style={{ marginRight: 6, marginBottom: 6 }}
                          icon="play-circle"
                        >
                          {formatNumber(r.views_count)}
                        </Chip>
                        <Chip
                          compact
                          style={{ marginRight: 6, marginBottom: 6 }}
                          icon="heart"
                        >
                          {formatNumber(r.likes_count)}
                        </Chip>
                        <Chip
                          compact
                          style={{ marginRight: 6, marginBottom: 6 }}
                          icon="comment-text"
                        >
                          {formatNumber(r.comments_count)}
                        </Chip>
                      </View>
                    </Card.Content>
                  </Card>
                ))}
              </View>
            </ScrollView>
          </Card.Content>
        </Card>
      ) : null;

    const LinksList = ({ social }: { social: ISocials }) =>
      Array.isArray(social.links) && social.links.length > 0 ? (
        <Card style={{ marginHorizontal: 12, marginBottom: 12 }}>
          <Card.Title title="Links" />
          <Card.Content>
            <List.Section>
              {social.links.map((l, idx) => (
                <List.Item
                  key={`${l.url}-${idx}`}
                  title={l.text || l.url}
                  description={l.url}
                  onPress={() => Linking.openURL(l.url)}
                  left={(props) => <List.Icon {...props} icon="link-variant" />}
                  right={(props) => <List.Icon {...props} icon="open-in-new" />}
                />
              ))}
            </List.Section>
          </Card.Content>
        </Card>
      ) : null;

    const MetaCard = ({ social }: { social: ISocials }) => (
      <Card style={{ marginHorizontal: 12, marginBottom: 12 }}>
        <Card.Title title="Meta" />
        <Card.Content>
          <List.Section>
            <List.Item
              title="ID"
              description={social.id}
              left={(p) => <List.Icon {...p} icon="identifier" />}
            />
            <List.Item
              title="Last Updated"
              description={formatDate(social.last_update_time / 1000000)}
              left={(p) => <List.Icon {...p} icon="update" />}
            />
            <List.Item
              title="Platform"
              description={social.social_type || "—"}
              left={(p) => <List.Icon {...p} icon="target" />}
            />
          </List.Section>
        </Card.Content>
      </Card>
    );

    return (
      <>
        <Card.Content>
          {loading && <ActivityIndicator size={"small"} />}

          {!loading && !social && (
            <Text
              variant="bodyMedium"
              style={{ opacity: 0.7, paddingHorizontal: 16, marginBottom: 12 }}
            >
              Detailed analytics are not available for this creator yet.
            </Text>
          )}

          {!loading && social && (
            <ScrollView contentContainerStyle={{ paddingBottom: 12 }}>
              {analytics && <HeaderCards analytics={analytics} />}
              <TotalsCard social={social} />
              <AveragesCard social={social} />
              <ReelsCard social={social} />
              <LinksList social={social} />
            </ScrollView>
          )}
        </Card.Content>

        <EditSocialMetricsModal
          visible={isEditModalVisible}
          social={social}
          editedSocial={editedSocial}
          setEditedSocial={setEditedSocial}
          saveError={saveError}
          onClose={() => setIsEditModalVisible(false)}
          onSave={handleSaveChanges}
          isSaving={isSaving}
          hasChanges={hasChanges}
        />
      </>
    );
  }
);

TrendlyAnalyticsEmbed.displayName = "TrendlyAnalyticsEmbed";
export default TrendlyAnalyticsEmbed;
