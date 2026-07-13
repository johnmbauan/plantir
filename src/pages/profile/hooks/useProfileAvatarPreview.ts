import { useEffect, useMemo } from "react";

export function useProfileAvatarPreview(
  avatarFile: File | null,
  savedAvatarUrl: string | null,
  avatarRemoved: boolean,
): string | null {
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

  return filePreviewUrl ?? (!avatarRemoved ? savedAvatarUrl : null);
}
