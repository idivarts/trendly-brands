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

export function useSoundtrackPlayer(audio: IContentAudio | undefined): SyncedPlayer {
    const musicRef = useRef<Audio.Sound | null>(null);
    const voiceRef = useRef<Audio.Sound | null>(null);

    const musicUrl = audio?.musicUrl;
    const voiceUrl = audio?.voiceoverUrl;
    const musicVol = audio?.musicVolume ?? 0.7;
    const voiceVol = audio?.voiceoverVolume ?? 1;
    const duck = audio?.duckMusic ?? true;

    // (Re)load the sounds when the urls change.
    useEffect(() => {
        let cancelled = false;
        const load = async (url: string | undefined, ref: React.MutableRefObject<Audio.Sound | null>, volume: number) => {
            if (ref.current) {
                try {
                    await ref.current.unloadAsync();
                } catch {}
                ref.current = null;
            }
            if (!url) return;
            try {
                const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: false, volume });
                if (cancelled) {
                    await sound.unloadAsync();
                    return;
                }
                ref.current = sound;
            } catch {}
        };
        const effectiveMusicVol = duck && voiceUrl ? musicVol * DUCK_FACTOR : musicVol;
        load(musicUrl, musicRef, effectiveMusicVol);
        load(voiceUrl, voiceRef, voiceVol);
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [musicUrl, voiceUrl, musicVol, voiceVol, duck]);

    const each = async (fn: (s: Audio.Sound) => Promise<any>) => {
        await Promise.all(
            [musicRef.current, voiceRef.current].filter(Boolean).map((s) => fn(s as Audio.Sound).catch(() => {}))
        );
    };

    const playFrom = async (ms: number) => {
        await each(async (s) => {
            await s.setPositionAsync(Math.max(0, ms));
            await s.playAsync();
        });
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
