import { useEffect, useRef, useState, useCallback } from "react";
import { Room, RoomEvent, Track, RemoteTrackPublication, RemoteParticipant, VideoPresets, LocalTrackPublication, createLocalVideoTrack, facingModeFromLocalTrack } from "livekit-client";
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
  screenVideoRef: React.RefObject<HTMLVideoElement>;
  audioRef: React.RefObject<HTMLAudioElement>;
  room: Room | null;
  disconnect: () => void;
  cameraEnabled: boolean;
  micEnabled: boolean;
  screenEnabled: boolean;
  facingMode: "user" | "environment";
  toggleCamera: () => Promise<void>;
  toggleMic: () => Promise<void>;
  toggleScreen: () => Promise<void>;
  flipCamera: () => Promise<void>;
  viewerCount: number;
}

export function useLiveKit({ streamId, isCreator = false, streamMode = "camera" }: UseLiveKitParams): UseLiveKitReturn {
  const [status, setStatus] = useState<UseLiveKitReturn["status"]>("idle");
  const [error, setError] = useState<string | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [screenEnabled, setScreenEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [viewerCount, setViewerCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null!);
  const screenVideoRef = useRef<HTMLVideoElement>(null!);
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
    try {
      await room.localParticipant.setCameraEnabled(next);
      setCameraEnabled(next);
      if (next) {
        const pub = room.localParticipant.getTrackPublication(Track.Source.Camera);
        if (pub?.track && videoRef.current) {
          pub.track.attach(videoRef.current);
        }
      }
    } catch (err) {
      console.error("Toggle camera error:", err);
    }
  }, [cameraEnabled]);

  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !micEnabled;
    try {
      await room.localParticipant.setMicrophoneEnabled(next);
      setMicEnabled(next);
    } catch (err) {
      console.error("Toggle mic error:", err);
    }
  }, [micEnabled]);

  const toggleScreen = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !screenEnabled;
    try {
      await room.localParticipant.setScreenShareEnabled(next);
      setScreenEnabled(next);
      if (next) {
        // Attach screen share to the screen video element or main video
        const pub = room.localParticipant.getTrackPublication(Track.Source.ScreenShare);
        const target = screenVideoRef.current || videoRef.current;
        if (pub?.track && target) {
          pub.track.attach(target);
        }
      }
    } catch (err: any) {
      console.error("Screen share error:", err);
      // User cancelled the screen picker
    }
  }, [screenEnabled]);

  const flipCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room || !cameraEnabled) return;
    try {
      const nextFacing = facingMode === "user" ? "environment" : "user";
      // Disable current camera
      await room.localParticipant.setCameraEnabled(false);
      // Create new track with opposite facing mode
      const newTrack = await createLocalVideoTrack({
        facingMode: nextFacing,
        resolution: VideoPresets.h720.resolution,
      });
      await room.localParticipant.publishTrack(newTrack);
      setFacingMode(nextFacing);
      if (videoRef.current) {
        newTrack.attach(videoRef.current);
      }
    } catch (err) {
      console.error("Flip camera error:", err);
      // Re-enable original camera on failure
      await room.localParticipant.setCameraEnabled(true);
    }
  }, [facingMode, cameraEnabled]);

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

        // Track viewer count from participant count
        const updateViewerCount = () => {
          setViewerCount(room.remoteParticipants.size);
        };
        room.on(RoomEvent.ParticipantConnected, updateViewerCount);
        room.on(RoomEvent.ParticipantDisconnected, updateViewerCount);
        updateViewerCount();

        // For creator: enable media based on stream mode
        if (isCreator) {
          try {
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
              const target = screenVideoRef.current || videoRef.current;
              if (screenPub?.track && target) {
                screenPub.track.attach(target);
              }
            }
          } catch (mediaErr: any) {
            console.error("Media enable error:", mediaErr);
          }
        }

        // For viewer: attach remote tracks
        const handleTrackSubscribed = (
          track: any,
          publication: RemoteTrackPublication,
          _participant: RemoteParticipant
        ) => {
          if (track.kind === Track.Kind.Video) {
            // If it's screen share, try to use screen ref
            if (publication.source === Track.Source.ScreenShare && screenVideoRef.current) {
              track.attach(screenVideoRef.current);
            } else if (videoRef.current) {
              track.attach(videoRef.current);
            }
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
    status, error, videoRef, screenVideoRef, audioRef,
    room: roomRef.current, disconnect,
    cameraEnabled, micEnabled, screenEnabled,
    facingMode, viewerCount,
    toggleCamera, toggleMic, toggleScreen, flipCamera,
  };
}
