import { useAWSContext } from "@/contexts";
import {
    DS_LOGO_VARIANTS,
    IDSLogo,
} from "@/shared-libs/firestore/trendly-pro/models/design-system";
import ImageUpload from "@/shared-uis/components/image-upload";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import {
    AddRowButton,
    DSTextInput,
    FieldLabel,
    OptionSelect,
    RemovableRow,
    SectionIntro,
} from "../fields";
import { SectionProps } from "../section-props";

const LogoSection: React.FC<SectionProps> = ({ ds, onPatch }) => {
    const theme = useTheme();
    const styles = useMemo(() => createStyles(), []);
    const { uploadFile, uploadFileUri } = useAWSContext();

    const logos = ds.logos ?? [];
    const setLogos = (next: IDSLogo[]) => onPatch({ logos: next });
    const updateAt = (i: number, patch: Partial<IDSLogo>) =>
        setLogos(logos.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
    const removeAt = (i: number) => setLogos(logos.filter((_, idx) => idx !== i));
    const add = () => setLogos([...logos, { variant: "primary" }]);

    // Upload to S3 immediately (via the same AWS context brand-profile uses) so
    // each logo row stores a durable URL rather than a transient local file.
    const handleUpload = async (i: number, image: string | File) => {
        try {
            const att =
                typeof image === "string"
                    ? await uploadFileUri({ id: image, localUri: image, uri: image, type: "image" })
                    : await uploadFile(image);
            const url = att?.imageUrl || "";
            if (url) updateAt(i, { url });
            else Toaster.error("Upload failed");
        } catch {
            Toaster.error("Upload failed");
        }
    };

    return (
        <View>
            <SectionIntro
                title="Logo & brand assets"
                subtitle="Upload the logo in the variants you use. The primary logo is what the AI drops into generated designs."
            />

            <View style={styles.list}>
                {logos.map((logo, i) => (
                    <RemovableRow key={i} onRemove={() => removeAt(i)}>
                        <View style={styles.cardBody}>
                            <FieldLabel>Logo image</FieldLabel>
                            <ImageUpload
                                initialImage={logo.url}
                                onUploadImage={(image) => handleUpload(i, image)}
                                theme={theme}
                            />

                            <OptionSelect
                                label="Variant"
                                options={DS_LOGO_VARIANTS.map((v) => ({ value: v, label: v }))}
                                value={logo.variant}
                                clearable={false}
                                onChange={(variant) =>
                                    updateAt(i, { variant: variant as IDSLogo["variant"] })
                                }
                            />

                            <DSTextInput
                                label="Usage note (optional)"
                                value={logo.clearSpaceNote}
                                onChangeText={(clearSpaceNote) => updateAt(i, { clearSpaceNote })}
                                placeholder="e.g. Keep clear space equal to the dot height. Never recolor."
                                multiline
                                numberOfLines={2}
                            />
                        </View>
                    </RemovableRow>
                ))}
            </View>

            <AddRowButton label="Add logo variant" onPress={add} />

            <View style={styles.guidelines}>
                <DSTextInput
                    label="Logo guidelines (optional)"
                    value={ds.logoGuidelines}
                    onChangeText={(logoGuidelines) => onPatch({ logoGuidelines })}
                    placeholder="Minimum size, misuse rules, backgrounds to avoid…"
                    multiline
                    numberOfLines={3}
                />
            </View>
        </View>
    );
};

function createStyles() {
    return StyleSheet.create({
        list: {
            gap: 18,
        },
        cardBody: {
            gap: 12,
        },
        guidelines: {
            marginTop: 18,
        },
    });
}

export default LogoSection;
