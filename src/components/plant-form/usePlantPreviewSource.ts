import { useEffect, useMemo } from "react";

interface UsePlantPreviewSourceParams {
  existingImageUrl: string | null;
  imageFile: File | null;
  useSpeciesImage: boolean;
  speciesImageUrl?: string | null;
}

export function usePlantPreviewSource({
  existingImageUrl,
  imageFile,
  useSpeciesImage,
  speciesImageUrl,
}: UsePlantPreviewSourceParams) {
  const filePreviewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile],
  );

  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  if (useSpeciesImage && speciesImageUrl) {
    return speciesImageUrl;
  }

  return filePreviewUrl ?? existingImageUrl;
}
