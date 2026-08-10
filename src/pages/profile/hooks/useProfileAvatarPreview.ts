import { useEffect, useMemo } from "react";
import { AVATARS_BUCKET, isStorageImageUrl, toThumbnailUrl } from "@/utils/imageVariants";

export interface ProfileAvatarPreview {
  /** Small surfaces (leaf avatar). */
  leafSrc: string | null;
  /** Lightbox / expanded modal. */
  expandSrc: string | null;
}

export function useProfileAvatarPreview(
  avatarFile: File | null,
  savedAvatarUrl: string | null,
  avatarRemoved: boolean,
): ProfileAvatarPreview {
  const filePreviewUrl = useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : null),
    [avatarFile],
  );

  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  if (filePreviewUrl) {
    return { leafSrc: filePreviewUrl, expandSrc: filePreviewUrl };
  }

  if (avatarRemoved || !savedAvatarUrl) {
    return { leafSrc: null, expandSrc: null };
  }

  const leafSrc =
    isStorageImageUrl(savedAvatarUrl, AVATARS_BUCKET)
      ? (toThumbnailUrl(savedAvatarUrl) ?? savedAvatarUrl)
      : savedAvatarUrl;

  return { leafSrc, expandSrc: savedAvatarUrl };
}
