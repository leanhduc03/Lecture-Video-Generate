import { create } from "zustand";
import type { UploadedImage } from "../services/uploadedImageService";
import type { MediaVideo } from "../services/mediaVideoService";

type SourceMode = "upload" | "existing";
type TargetMode = "upload" | "existing";

type DeepfakeVideoState = {
  // Source (Image)
  sourceMode: SourceMode;
  sourceFile: File | null;
  selectedImageUrl: string | null;
  myImages: UploadedImage[];
  isUploadingSource: boolean;

  // Target (Video)
  targetMode: TargetMode;
  targetFile: File | null;
  selectedVideoUrl: string | null;
  myVideos: MediaVideo[];
  isUploadingTarget: boolean;

  // Processing
  resultVideo: string | null;
  isLoading: boolean;
  error: string | null;
  jobId: string | null;
  processingProgress: string;
  isSavingVideo: boolean;
  savedSuccess: boolean;

  // Video player
  isPlaying: boolean;
  currentTime: number;
  duration: number;

  // Actions
  setField: <K extends keyof DeepfakeVideoState>(
    key: K,
    value: DeepfakeVideoState[K]
  ) => void;
  patch: (partial: Partial<DeepfakeVideoState>) => void;

  reset: () => void;
  resetAll: () => void;
};

const initialState: Omit<
  DeepfakeVideoState,
  "setField" | "patch" | "reset" | "resetAll"
> = {
  sourceMode: "upload",
  sourceFile: null,
  selectedImageUrl: null,
  myImages: [],
  isUploadingSource: false,

  targetMode: "upload",
  targetFile: null,
  selectedVideoUrl: null,
  myVideos: [],
  isUploadingTarget: false,

  resultVideo: null,
  isLoading: false,
  error: null,
  jobId: null,
  processingProgress: "Đang chuẩn bị...",
  isSavingVideo: false,
  savedSuccess: false,

  isPlaying: false,
  currentTime: 0,
  duration: 0,
};

export const useDeepfakeVideoStore = create<DeepfakeVideoState>((set, get) => ({
  ...initialState,

  setField: (key, value) => set({ [key]: value } as any),
  patch: (partial) => set(partial),

  reset: () => {
    const s = get();
    set({
      ...initialState,
      myImages: s.myImages,
      myVideos: s.myVideos,
    });
  },

  resetAll: () => set({ ...initialState }),
}));
