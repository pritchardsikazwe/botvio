import { useEffect, useRef, useState, useCallback } from "react";
import {
  Room,
  RoomEvent,
  Track,
  RemoteTrackPublication,
  RemoteParticipant,
  VideoPresets,
  LocalTrackPublication,
  createLocalVideoTrack,
} from "livekit-client";
import { supabase } from "@/integrations/supabase/client";

interface UseLiveKitParams {
  streamId: string | null;
  isCreator?: boolean;
  streamMode?: "camera" | "screen" | "camera_screen";
  accessToken?: string | null;
  wsUrl?: string | null;
  preferredFacingMode?: "user" | "environment";
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
  canFlipCamera: boolean;
  toggleCamera: () => Promise<void>;
  toggleMic: () => Promise<void>;
  toggleScreen: () => Promise<void>;
  flipCamera: () => Promise<void>;
  viewerCount: number;
}

export function useLiveKit({
  streamId,
  isCreator = false,
  streamMode = "camera",
  accessToken = null,
  wsUrl = null,
  preferredFacingMode = "user",
}: UseLiveKitParams): UseLiveKitReturn {
  const [status, setStatus] = useState<UseLiveKitReturn["status"]>("idle");
  const [error, setError] = useState<string | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [screenEnabled, setScreenEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(preferredFacingMode);
  const [canFlipCamera, setCanFlipCamera] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null!);
  const screenVideoRef = useRef<HTMLVideoElement>(null!);
  const audioRef = useRef<HTMLAudioElement>(null!);
  const roomRef = useRef<Room | null>(null);

  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return;

    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const cameras = devices.filter((device) => device.kind === "videoinput");
        setCanFlipCamera(cameras.length > 1);
      })
      .catch(() => {
        setCanFlipCamera(false);
      });
  }, []);

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
      if (next) {
        const existingPublication = room.localParticipant.getTrackPublication(
          Track.Source.Camera,
        ) as LocalTrackPublication | undefined;

        if (existingPublication?.track) {
          await room.localParticipant.setCameraEnabled(true);
        } else {
          const track = await createLocalVideoTrack({
            facingMode,
            resolution: VideoPresets.h720.resolution,
          });
          await room.localParticipant.publishTrack(track);
        }
      } else {
        await room.localParticipant.setCameraEnabled(false);
      }

      setCameraEnabled(next);

      if (next) {
        const publication = room.localParticipant.getTrackPublication(Track.Source.Camera);
        if (publication?.track && videoRef.current) {
          publication.track.attach(videoRef.current);
        }
      }
    } catch (err) {
      console.error("Toggle camera error:", err);
    }
  }, [cameraEnabled, facingMode]);

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
        const publication = room.localParticipant.getTrackPublication(Track.Source.ScreenShare);
        const target = screenVideoRef.current || videoRef.current;
        if (publication?.track && target) {
          publication.track.attach(target);
        }
      }
    } catch (err) {
      console.error("Screen share error:", err);
    }
  }, [screenEnabled]);

  const flipCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room || !cameraEnabled || !canFlipCamera) return;

    try {
      const nextFacing = facingMode === "user" ? "environment" : "user";
      const currentPublication = room.localParticipant.getTrackPublication(
        Track.Source.Camera,
      ) as LocalTrackPublication | undefined;

      const newTrack = await createLocalVideoTrack({
        facingMode: nextFacing,
        resolution: VideoPresets.h720.resolution,
      });

      if (currentPublication?.track) {
        await room.localParticipant.unpublishTrack(currentPublication.track);
        currentPublication.track.stop();
      }

      await room.localParticipant.publishTrack(newTrack);
      setFacingMode(nextFacing);
      setCameraEnabled(true);

      if (videoRef.current) {
        newTrack.attach(videoRef.current);
      }
    } catch (err) {
      console.error("Flip camera error:", err);
    }
  }, [cameraEnabled, canFlipCamera, facingMode]);

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
        let token = accessToken;
        let livekitWsUrl = wsUrl || "wss://botvio-knua21jl.livekit.cloud";

        if (!token) {
          const fnName = isCreator ? "create-live-stream" : "join-live-stream";
          const body = isCreator
            ? { title: "Live Stream", stream_mode: streamMode }
            : { stream_id: streamId };
          const { data, error: fnError } = await supabase.functions.invoke(fnName, { body });

          if (fnError) throw new Error(fnError.message);
          if (!data?.success) throw new Error(data?.error || "Failed to get stream token");

          token = data.token;
          livekitWsUrl = data.ws_url || livekitWsUrl;
        }

        if (cancelled) return;

        await room.connect(livekitWsUrl, token);

        if (cancelled) {
          room.disconnect();
          return;
        }

        setStatus("connected");

        const updateViewerCount = () => {
          setViewerCount(room.remoteParticipants.size);
        };

        room.on(RoomEvent.ParticipantConnected, updateViewerCount);
        room.on(RoomEvent.ParticipantDisconnected, updateViewerCount);
        updateViewerCount();

        if (isCreator) {
          try {
            await room.localParticipant.setMicrophoneEnabled(true);
            setMicEnabled(true);

            if (streamMode === "camera" || streamMode === "camera_screen") {
              const track = await createLocalVideoTrack({
                facingMode: preferredFacingMode,
                resolution: VideoPresets.h720.resolution,
              });
              await room.localParticipant.publishTrack(track);
              setCameraEnabled(true);

              if (videoRef.current) {
                track.attach(videoRef.current);
              }
            }

            if (streamMode === "screen" || streamMode === "camera_screen") {
              await room.localParticipant.setScreenShareEnabled(true);
              setScreenEnabled(true);
              const screenPublication = room.localParticipant.getTrackPublication(Track.Source.ScreenShare);
              const target = screenVideoRef.current || videoRef.current;
              if (screenPublication?.track && target) {
                screenPublication.track.attach(target);
              }
            }
          } catch (mediaErr) {
            console.error("Media enable error:", mediaErr);
          }
        }

        const attachTrack = (track: any, publication: RemoteTrackPublication) => {
          if (track.kind === Track.Kind.Video) {
            if (publication.source === Track.Source.ScreenShare) {
              setScreenEnabled(true);
              if (screenVideoRef.current) {
                track.attach(screenVideoRef.current);
              }
            } else {
              setCameraEnabled(true);
              if (videoRef.current) {
                track.attach(videoRef.current);
              }
            }
          }

          if (track.kind === Track.Kind.Audio && audioRef.current) {
            track.attach(audioRef.current);
          }
        };

        const handleTrackSubscribed = (
          track: any,
          publication: RemoteTrackPublication,
          _participant: RemoteParticipant,
        ) => {
          attachTrack(track, publication);
        };

        const handleTrackUnsubscribed = (_track: any, publication: RemoteTrackPublication) => {
          if (publication.source === Track.Source.ScreenShare) {
            setScreenEnabled(false);
          }

          if (publication.source === Track.Source.Camera) {
            setCameraEnabled(false);
          }
        };

        room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
        room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);

        room.remoteParticipants.forEach((participant) => {
          participant.trackPublications.forEach((publication) => {
            if (publication.track && publication.isSubscribed) {
              attachTrack(publication.track, publication as RemoteTrackPublication);
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
  }, [accessToken, isCreator, preferredFacingMode, streamId, streamMode, wsUrl]);

  return {
    status,
    error,
    videoRef,
    screenVideoRef,
    audioRef,
    room: roomRef.current,
    disconnect,
    cameraEnabled,
    micEnabled,
    screenEnabled,
    facingMode,
    canFlipCamera,
    toggleCamera,
    toggleMic,
    toggleScreen,
    flipCamera,
    viewerCount,
  };
}
