import { useEffect, useRef, useState, useCallback } from "react";
import { Room, RoomEvent, Track, RemoteTrackPublication, RemoteParticipant, VideoPresets } from "livekit-client";
import { supabase } from "@/integrations/supabase/client";

interface UseLiveKitParams {
  streamId: string | null;
  isCreator?: boolean;
  streamMode?: "camera" | "screen" | "camera_screen";
}

interface UseLiveKitReturn {
  status: "idle" | "connecting" | "connected" | "error" | "disconnected";
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  audioRef: React.RefObject<HTMLAudioElement>;
  room: Room | null;
  disconnect: () => void;
  cameraEnabled: boolean;
  micEnabled: boolean;
  screenEnabled: boolean;
  toggleCamera: () => Promise<void>;
  toggleMic: () => Promise<void>;
  toggleScreen: () => Promise<void>;
}

export function useLiveKit({ streamId, isCreator = false, streamMode = "camera" }: UseLiveKitParams): UseLiveKitReturn {
  const [status, setStatus] = useState<UseLiveKitReturn["status"]>("idle");
  const [error, setError] = useState<string | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [screenEnabled, setScreenEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null!);
  const audioRef = useRef<HTMLAudioElement>(null!);
  const roomRef = useRef<Room | null>(null);

  const disconnect = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    setStatus("disconnected");
    setCameraEnabled(false);
    setMicEnabled(false);
    setScreenEnabled(false);
  }, []);

  const toggleCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !cameraEnabled;
    await room.localParticipant.setCameraEnabled(next);
    setCameraEnabled(next);
    if (next) {
      const pub = room.localParticipant.getTrackPublication(Track.Source.Camera);
      if (pub?.track && videoRef.current) {
        pub.track.attach(videoRef.current);
      }
    }
  }, [cameraEnabled]);

  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !micEnabled;
    await room.localParticipant.setMicrophoneEnabled(next);
    setMicEnabled(next);
  }, [micEnabled]);

  const toggleScreen = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !screenEnabled;
    try {
      await room.localParticipant.setScreenShareEnabled(next);
      setScreenEnabled(next);
      if (next) {
        const pub = room.localParticipant.getTrackPublication(Track.Source.ScreenShare);
        if (pub?.track && videoRef.current) {
          pub.track.attach(videoRef.current);
        }
      }
    } catch (err: any) {
      console.error("Screen share error:", err);
    }
  }, [screenEnabled]);

  useEffect(() => {
    if (!streamId) return;

    let cancelled = false;
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: VideoPresets.h720.resolution,
      },
    });
    roomRef.current = room;

    async function connect() {
      setStatus("connecting");
      setError(null);

      try {
        const fnName = isCreator ? "create-live-stream" : "join-live-stream";
        const body = isCreator ? { title: "Live Stream" } : { stream_id: streamId };

        const { data, error: fnError } = await supabase.functions.invoke(fnName, { body });

        if (fnError) throw new Error(fnError.message);
        if (!data?.success) throw new Error(data?.error || "Failed to get stream token");

        const token = data.token;
        const wsUrl = data.ws_url || "wss://botvio-knua21jl.livekit.cloud";

        if (cancelled) return;

        await room.connect(wsUrl, token);

        if (cancelled) {
          room.disconnect();
          return;
        }

        setStatus("connected");

        // For creator: enable media based on stream mode
        if (isCreator) {
          try {
            // Always enable mic
            await room.localParticipant.setMicrophoneEnabled(true);
            setMicEnabled(true);

            if (streamMode === "camera" || streamMode === "camera_screen") {
              await room.localParticipant.setCameraEnabled(true);
              setCameraEnabled(true);
              const camPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
              if (camPub?.track && videoRef.current) {
                camPub.track.attach(videoRef.current);
              }
            }

            if (streamMode === "screen" || streamMode === "camera_screen") {
              await room.localParticipant.setScreenShareEnabled(true);
              setScreenEnabled(true);
              const screenPub = room.localParticipant.getTrackPublication(Track.Source.ScreenShare);
              if (screenPub?.track && videoRef.current) {
                screenPub.track.attach(videoRef.current);
              }
            }
          } catch (mediaErr: any) {
            console.error("Media enable error:", mediaErr);
            // Still connected, just media failed
          }
        }

        // For viewer: attach remote tracks
        const handleTrackSubscribed = (
          track: any,
          _publication: RemoteTrackPublication,
          _participant: RemoteParticipant
        ) => {
          if (track.kind === Track.Kind.Video && videoRef.current) {
            track.attach(videoRef.current);
          }
          if (track.kind === Track.Kind.Audio && audioRef.current) {
            track.attach(audioRef.current);
          }
        };

        room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);

        // Attach already-subscribed tracks
        room.remoteParticipants.forEach((participant) => {
          participant.trackPublications.forEach((pub) => {
            if (pub.track && pub.isSubscribed) {
              if (pub.track.kind === Track.Kind.Video && videoRef.current) {
                pub.track.attach(videoRef.current);
              }
              if (pub.track.kind === Track.Kind.Audio && audioRef.current) {
                pub.track.attach(audioRef.current);
              }
            }
          });
        });

        room.on(RoomEvent.Disconnected, () => {
          if (!cancelled) setStatus("disconnected");
        });

      } catch (err: any) {
        if (!cancelled) {
          console.error("LiveKit connection error:", err);
          setError(err.message || "Connection failed");
          setStatus("error");
        }
      }
    }

    connect();

    return () => {
      cancelled = true;
      room.disconnect();
      roomRef.current = null;
    };
  }, [streamId, isCreator, streamMode]);

  return {
    status, error, videoRef, audioRef,
    room: roomRef.current, disconnect,
    cameraEnabled, micEnabled, screenEnabled,
    toggleCamera, toggleMic, toggleScreen,
  };
}
