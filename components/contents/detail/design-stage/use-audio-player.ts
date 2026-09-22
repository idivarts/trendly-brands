/**
 * Audio players for the soundtrack module (expo-av, cross-platform incl. web).
 *
 * useAudition — audition a single clip on demand (music rows, voice samples):
 *   one clip plays at a time; toggling the same url stops it.
 *
 * useSoundtrackPlayer — the video-synced mix: plays the music bed + voiceover
 *   together, driven by the video's play/pause/seek so "Preview with sound"
 *   reflects the final result (music auto-ducked under the voice).
 */
import { IContentAudio } from "@/shared-libs/firestore/trendly-pro/models/design";
import { Audio } from "expo-av";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

export function useAudition() {
    const soundRef = useRef<Audio.Sound | null>(null);
    const [playingUrl, setPlayingUrl] = useState<string | null>(null);

    const stop = async () => {
        const s = soundRef.current;
        soundRef.current = null;
        setPlayingUrl(null);
        if (s) {
            try {
                await s.stopAsync();
            } catch {}
            try {
                await s.unloadAsync();
            } catch {}
        }
    };

    const toggle = async (url: string) => {
        if (!url) return;
        if (playingUrl === url) {
            await stop();
            return;
        }
        await stop();
        try {
            const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
            soundRef.current = sound;
            setPlayingUrl(url);
            sound.setOnPlaybackStatusUpdate((st) => {
                if (st.isLoaded && st.didJustFinish) stop();
            });
        } catch {
            setPlayingUrl(null);
        }
    };

    useEffect(() => () => void stop(), []);

    return { playingUrl, toggle, stop };
}

interface SyncedPlayer {
    playFrom: (ms: number) => Promise<void>;
    pause: () => Promise<void>;
    seek: (ms: number) => Promise<void>;
    stop: () => Promise<void>;
}

const DUCK_FACTOR = 0.35;

const warnAudio = (e: unknown) => {
    // Surface (don't swallow) — a blocked/failed play is otherwise invisible.
    if (typeof __DEV__ === "undefined" || __DEV__) console.warn("[soundtrack] audio error", e);
};

/** Coerce a volume-like value to a finite number in [0,1], else the default. */
export const safeVolume = (v: number | undefined | null, fallback: number): number =>
    typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(v, 1)) : fallback;

/**
 * useAudioDuration — read a clip's duration (ms) without playing it. Returns null
 * until known. Used to show "how long is my voiceover" in the UI.
 *
 * Web uses fetch + Web Audio `decodeAudioData` (this needs CORS, which our asset
 * CloudFront distributions now send). A plain `<audio preload="metadata">` is
 * unreliable here — a service worker / range-request quirk stalls metadata-only
 * loads (audition only works because *playing* forces a full fetch) — whereas
 * decodeAudioData reads the whole clip and always yields an exact duration.
 * Native falls back to expo-av (it reports duration on load).
 */
export function useAudioDuration(url: string | undefined): number | null {
    const [ms, setMs] = useState<number | null>(null);
    useEffect(() => {
        setMs(null);
        if (!url) return;

        if (Platform.OS === "web" && typeof window !== "undefined") {
            let cancelled = false;
            (async () => {
                try {
                    const res = await fetch(url, { mode: "cors" });
                    if (!res.ok) return;
                    const buf = await res.arrayBuffer();
                    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
                    if (!AC) return;
                    const ctx = new AC();
                    try {
                        const decoded = await ctx.decodeAudioData(buf);
                        if (!cancelled && Number.isFinite(decoded.duration) && decoded.duration > 0) {
                            setMs(decoded.duration * 1000);
                        }
                    } finally {
                        try {
                            await ctx.close();
                        } catch {}
                    }
                } catch (e) {
                    warnAudio(e);
                }
            })();
            return () => {
                cancelled = true;
            };
        }

        // Native: expo-av reports durationMillis once the sound is loaded.
        let cancelled = false;
        let sound: Audio.Sound | null = null;
        (async () => {
            try {
                const created = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: false });
                sound = created.sound;
                for (let i = 0; i < 50 && !cancelled; i++) {
                    const st = await created.sound.getStatusAsync();
                    if (st.isLoaded && Number.isFinite(st.durationMillis) && (st.durationMillis ?? 0) > 0) {
                        if (!cancelled) setMs(st.durationMillis ?? null);
                        break;
                    }
                    await new Promise((r) => setTimeout(r, 100));
                }
            } catch (e) {
                warnAudio(e);
            } finally {
                if (sound) {
                    try {
                        await sound.unloadAsync();
                    } catch {}
                }
            }
        })();
        return () => {
            cancelled = true;
            if (sound) void sound.unloadAsync();
        };
    }, [url]);
    return ms;
}

export function useSoundtrackPlayer(audio: IContentAudio | undefined): SyncedPlayer {
    const musicRef = useRef<Audio.Sound | null>(null);
    const voiceRef = useRef<Audio.Sound | null>(null);

    const musicUrl = audio?.musicUrl;
    const voiceUrl = audio?.voiceoverUrl;
    const musicVol = safeVolume(audio?.musicVolume, 0.7);
    const voiceVol = safeVolume(audio?.voiceoverVolume, 1);
    const duck = audio?.duckMusic ?? true;
    // Music is a bed — duck it under the voice and loop it so it fills the whole
    // video (mirrors the render's `music.loop = true`).
    const effectiveMusicVol = duck && voiceUrl ? musicVol * DUCK_FACTOR : musicVol;

    // (Re)load the sounds when the urls change.
    useEffect(() => {
        let cancelled = false;
        const load = async (
            url: string | undefined,
            ref: React.MutableRefObject<Audio.Sound | null>,
            volume: number,
            loop: boolean
        ) => {
            if (ref.current) {
                try {
                    await ref.current.unloadAsync();
                } catch {}
                ref.current = null;
            }
            if (!url) return;
            try {
                const { sound } = await Audio.Sound.createAsync(
                    { uri: url },
                    { shouldPlay: false, volume, isLooping: loop }
                );
                if (cancelled) {
                    await sound.unloadAsync();
                    return;
                }
                ref.current = sound;
            } catch (e) {
                warnAudio(e);
            }
        };
        load(musicUrl, musicRef, effectiveMusicVol, true);
        load(voiceUrl, voiceRef, voiceVol, false);
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [musicUrl, voiceUrl, musicVol, voiceVol, duck]);

    const each = async (fn: (s: Audio.Sound) => Promise<any>) => {
        await Promise.all(
            [musicRef.current, voiceRef.current].filter(Boolean).map((s) => fn(s as Audio.Sound).catch(warnAudio))
        );
    };

    // Start playback at `ms`. CRITICAL (web): fire ONE atomic call
    // (`playFromPositionAsync`) synchronously from the click so the browser keeps
    // the user-activation. A separate `setPositionAsync().then(playAsync())` runs
    // `media.play()` a hop later, loses the gesture, and is blocked → silent.
    const playFrom = async (ms: number) => {
        const pos = Math.max(0, ms);
        const starts: Promise<any>[] = [];
        const start = (
            ref: React.MutableRefObject<Audio.Sound | null>,
            url: string | undefined,
            volume: number,
            loop: boolean
        ) => {
            const s = ref.current;
            if (s) {
                starts.push(s.playFromPositionAsync(pos).catch(warnAudio));
                return;
            }
            // Not preloaded yet — create-and-play in one shot (same path the track
            // auditions use), then keep it for pause/seek.
            if (!url) return;
            starts.push(
                Audio.Sound.createAsync(
                    { uri: url },
                    { shouldPlay: true, positionMillis: pos, volume, isLooping: loop }
                )
                    .then(({ sound }) => {
                        ref.current = sound;
                    })
                    .catch(warnAudio)
            );
        };
        start(musicRef, musicUrl, effectiveMusicVol, true);
        start(voiceRef, voiceUrl, voiceVol, false);
        await Promise.all(starts);
    };
    const pause = async () => each((s) => s.pauseAsync());
    const seek = async (ms: number) => each((s) => s.setPositionAsync(Math.max(0, ms)));
    const stop = async () =>
        each(async (s) => {
            await s.stopAsync();
        });

    useEffect(
        () => () => {
            void musicRef.current?.unloadAsync();
            void voiceRef.current?.unloadAsync();
        },
        []
    );

    return { playFrom, pause, seek, stop };
}
