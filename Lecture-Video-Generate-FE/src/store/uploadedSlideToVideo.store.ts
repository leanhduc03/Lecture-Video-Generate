import { create } from "zustand";

import type {
  SlideData,
  SlideMetadata,
  PresentationMetadata,
} from "../services/slideService";

type VoiceMode = "preset" | "clone";
type AudioMode = "upload" | "existing";
type VideoSourceType = "sample" | "deepfake" | "custom";

type UploadedSlideState = {
  // core data
  metadata: PresentationMetadata | null;
  slides: SlideMetadata[];
  savedSlideData: SlideData[];

  // edit mode
  editMode: boolean;
  editedSlideData: SlideData[];
  isSavingMetadata: boolean;

  // video selection
  selectedVideoFile: File | null; // OK (không persist)
  selectedVideoUrl: string;
  videoSourceType: VideoSourceType;

  // voice selection
  voiceMode: VoiceMode;
  audioMode: AudioMode;

  // clone voice
  referenceAudioFile: File | null; // OK (không persist)
  referenceAudioUrl: string;
  referenceText: string;
  tempReferenceText: string;

  // preset voice
  gender: string;
  area: string;
  group: string;
  emotion: string;

  // ui states
  userUploadedPptx: File | null; // OK (không persist)
  isUploadingPptx: boolean;

  isProcessing: boolean;
  processingMessage: string;
  finalVideoUrl: string | null;

  error: string | null;

  // actions
  setField: <K extends keyof UploadedSlideState>(
    key: K,
    value: UploadedSlideState[K]
  ) => void;

  patch: (partial: Partial<UploadedSlideState>) => void;

  resetAll: () => void;

  updateOriginalContent: (slideIndex: number, value: string) => void;
};

const initialState: Omit<
  UploadedSlideState,
  "setField" | "patch" | "resetAll" | "updateOriginalContent"
> = {
  metadata: null,
  slides: [],
  savedSlideData: [],

  editMode: false,
  editedSlideData: [],
  isSavingMetadata: false,

  selectedVideoFile: null,
  selectedVideoUrl: "",
  videoSourceType: "sample",

  voiceMode: "preset",
  audioMode: "upload",

  referenceAudioFile: null,
  referenceAudioUrl: "",
  referenceText: "",
  tempReferenceText: "",

  gender: "male",
  area: "northern",
  group: "news",
  emotion: "neutral",

  userUploadedPptx: null,
  isUploadingPptx: false,

  isProcessing: false,
  processingMessage: "",
  finalVideoUrl: null,

  error: null,
};

export const useUploadedSlideToVideoStore = create<UploadedSlideState>(
  (set, get) => ({
    ...initialState,

    setField: (key, value) => set({ [key]: value } as any),

    patch: (partial) => set(partial),

    resetAll: () => set({ ...initialState }),

    updateOriginalContent: (slideIndex, value) => {
      const current = get().editedSlideData;
      if (!current[slideIndex]) return;

      const next = [...current];
      next[slideIndex] = { ...next[slideIndex], original_content: value };
      set({ editedSlideData: next });
    },
  })
);
