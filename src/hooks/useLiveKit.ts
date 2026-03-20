import { useEffect, useRef, useState, useCallback } from "react";
import { Room, RoomEvent, Track, RemoteTrackPublication, RemoteParticipant, VideoPresets } from "livekit-client";
import { supabase } from "@/integrations/supabase/client";

interface UseLiveKitParams {
  streamId: string | null;
  isCreator?: boolean;
}

interface UseLiveKitReturn {
  status: "idle" | "connecting" | "connected" | "error" | "disconnected";
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  audioRef: React.RefObject<HTMLAudioElement>;
  room: Room | null;
  disconnect: () => void;
}

export function useLiveKit({ streamId, isCreator = false }: UseLiveKitParams): UseLiveKitReturn {
  const [status, setStatus] = useState<UseLiveKitReturn["status"]>("idle");
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null!);
  const audioRef = useRef<HTMLAudioElement>(null!);
  const roomRef = useRef<Room | null>(null);

  const disconnect = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    setStatus("disconnected");
  }, []);

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
        // Get token from edge function
        const fnName = isCreator ? "create-live-stream" : "join-live-stream";
        const body = isCreator ? { title: "Live Stream" } : { stream_id: streamId };

        const { data, error: fnError } = await supabase.functions.invoke(fnName, { body });

        if (fnError) throw new Error(fnError.message);
        if (!data?.success) throw new Error(data?.error || "Failed to get stream token");

        const token = data.token;
        const wsUrl = data.ws_url || "wss://botvio-knua21jl.livekit.cloud";

        if (cancelled) return;

        // Connect to LiveKit room
        await room.connect(wsUrl, token);

        if (cancelled) {
          room.disconnect();
          return;
        }

        setStatus("connected");

        // For creator: enable camera + mic
        if (isCreator) {
          await room.localParticipant.enableCameraAndMicrophone();
          const camTrack = room.localParticipant.getTrackPublication(Track.Source.Camera);
          if (camTrack?.track && videoRef.current) {
            camTrack.track.attach(videoRef.current);
          }
        }

        // For viewer: attach remote tracks
        const handleTrackSubscribed = (
          track: any,
          publication: RemoteTrackPublication,
          participant: RemoteParticipant
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
  }, [streamId, isCreator]);

  return { status, error, videoRef, audioRef, room: roomRef.current, disconnect };
}
