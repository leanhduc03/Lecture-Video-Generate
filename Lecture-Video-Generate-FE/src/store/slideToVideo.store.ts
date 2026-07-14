import { create } from "zustand";
import type {
  SlideMetadata,
  SlideData,
  PresentationMetadata,
} from "../services/slideService";
import type { MediaVideo } from "../services/mediaVideoService";
import type { UploadedAudio } from "../services/uploadedAudioService";

export type VideoSourceType = "sample" | "deepfake" | "custom";
export type VoiceMode = "preset" | "clone";
export type AudioMode = "upload" | "existing";

type SlideToVideoState = {
  // Input content
  inputContent: string;
  numSlides?: number;
  isGeneratingSlides: boolean;

  // Presentation metadata
  metadata: PresentationMetadata | null;
  slides: SlideMetadata[];
  savedSlideData: SlideData[];

  // User uploaded PPTX (edit/upload)
  userUploadedPptx: File | null;
  isUploadingPptx: boolean;

  // Edit mode
  editMode: boolean;
  editedSlideData: SlideData[];
  isSavingMetadata: boolean;
  editModeSlides: SlideMetadata[];

  // Video selection
  selectedVideoFile: File | null;
  selectedVideoUrl: string;
  loadingVideos: boolean;
  videoOptions: MediaVideo[];

  // Deepfake video selection
  deepfakeVideos: MediaVideo[];
  loadingDeepfakeVideos: boolean;
  videoSourceType: VideoSourceType;

  // Voice mode
  voiceMode: VoiceMode;

  // Voice cloning
  audioMode: AudioMode;
  referenceAudioFile: File | null;
  referenceAudioUrl: string;
  referenceText: string;
  myAudios: UploadedAudio[];
  isUploadingAudio: boolean;
  tempReferenceText: string;
  showAudioWarning: boolean;
  audioDuration: number;

  // Preset voice
  gender: string;
  area: string;
  group: string;
  emotion: string;

  // Process state
  isProcessing: boolean;
  processingMessage: string;
  finalVideoUrl: string | null;
  error: string | null;

  // Video player
  isPlaying: boolean;
  currentTime: number;
  duration: number;

  // Actions
  setField: <K extends keyof SlideToVideoState>(
    key: K,
    value: SlideToVideoState[K]
  ) => void;
  patch: (partial: Partial<SlideToVideoState>) => void;

  resetAll: () => void;

  updateOriginalContent: (slideIndex: number, value: string) => void;
};

const initialState: Omit<
  SlideToVideoState,
  "setField" | "patch" | "resetAll" | "updateOriginalContent"
> = {
  inputContent: "",
  numSlides: undefined,
  isGeneratingSlides: false,

  metadata: null,
  slides: [],
  savedSlideData: [],

  userUploadedPptx: null,
  isUploadingPptx: false,

  editMode: false,
  editedSlideData: [],
  isSavingMetadata: false,
  editModeSlides: [],

  selectedVideoFile: null,
  selectedVideoUrl: "",
  loadingVideos: true,
  videoOptions: [],

  deepfakeVideos: [],
  loadingDeepfakeVideos: false,
  videoSourceType: "sample",

  voiceMode: "preset",

  audioMode: "upload",
  referenceAudioFile: null,
  referenceAudioUrl: "",
  referenceText: "",
  myAudios: [],
  isUploadingAudio: false,
  tempReferenceText: "",
  showAudioWarning: false,
  audioDuration: 0,

  gender: "male",
  area: "northern",
  group: "news",
  emotion: "neutral",

  isProcessing: false,
  processingMessage: "",
  finalVideoUrl: null,
  error: null,

  isPlaying: false,
  currentTime: 0,
  duration: 0,
};

export const useSlideToVideoStore = create<SlideToVideoState>((set, get) => ({
  ...initialState,

  setField: (key, value) => set({ [key]: value } as any),
  patch: (partial) => set(partial),

  resetAll: () => {
    const s = get();
    const keep = {
      videoOptions: s.videoOptions,
      deepfakeVideos: s.deepfakeVideos,
      selectedVideoUrl:
        s.videoOptions?.[0]?.video_url ||
        s.deepfakeVideos?.[0]?.video_url ||
        "",
    };

    set({ ...initialState, ...keep, loadingVideos: false, loadingDeepfakeVideos: false });
  },

  updateOriginalContent: (slideIndex, value) => {
    const arr = [...get().editedSlideData];
    if (!arr[slideIndex]) return;
    arr[slideIndex] = { ...arr[slideIndex], original_content: value };
    set({ editedSlideData: arr });
  },
}));
