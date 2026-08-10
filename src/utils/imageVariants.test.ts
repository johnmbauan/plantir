import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  AVATARS_BUCKET,
  isStorageImageUrl,
  isThumbnailUrl,
  pairedThumbPath,
  PLANT_IMAGES_BUCKET,
  prepareImageVariants,
  resizeImageFile,
  storageObjectPathFromPublicUrl,
  toThumbnailUrl,
} from "@/utils/imageVariants";

describe("imageVariants URL helpers", () => {
  it("inserts _thumb before the extension", () => {
    expect(
      toThumbnailUrl(
        "https://x.supabase.co/storage/v1/object/public/plant-images/user/abc.jpg",
      ),
    ).toBe("https://x.supabase.co/storage/v1/object/public/plant-images/user/abc_thumb.jpg");
  });

  it("preserves query and hash fragments when deriving thumb URLs", () => {
    expect(toThumbnailUrl("https://cdn/a/photo.jpeg?v=1")).toBe(
      "https://cdn/a/photo_thumb.jpeg?v=1",
    );
    expect(toThumbnailUrl("https://cdn/a/photo.jpeg#crop")).toBe(
      "https://cdn/a/photo_thumb.jpeg#crop",
    );
  });

  it("returns null for empty input and leaves existing thumbs alone", () => {
    expect(toThumbnailUrl(null)).toBeNull();
    expect(toThumbnailUrl(undefined)).toBeNull();
    expect(toThumbnailUrl("")).toBeNull();
    expect(toThumbnailUrl("https://cdn/a/photo_thumb.jpg")).toBe(
      "https://cdn/a/photo_thumb.jpg",
    );
  });

  it("falls back to the original URL when there is no usable extension", () => {
    expect(toThumbnailUrl("https://cdn/a/photo")).toBe("https://cdn/a/photo");
    expect(pairedThumbPath("user-1/photo")).toBeNull();
  });

  it("detects thumbnail URLs", () => {
    expect(isThumbnailUrl("https://cdn/a/x_thumb.jpg")).toBe(true);
    expect(isThumbnailUrl("https://cdn/a/x.jpg")).toBe(false);
  });

  it("builds paired thumb storage paths", () => {
    expect(pairedThumbPath("user-1/abc.jpg")).toBe("user-1/abc_thumb.jpg");
    expect(pairedThumbPath("user-1/abc_thumb.jpg")).toBe("user-1/abc_thumb.jpg");
    expect(pairedThumbPath("abc.jpg")).toBe("abc_thumb.jpg");
  });

  it("extracts storage paths and detects bucket URLs", () => {
    const url =
      "https://x.supabase.co/storage/v1/object/public/plant-images/user-1/abc.jpg";
    expect(storageObjectPathFromPublicUrl(url, PLANT_IMAGES_BUCKET)).toBe("user-1/abc.jpg");
    expect(storageObjectPathFromPublicUrl(url, AVATARS_BUCKET)).toBeNull();
    expect(isStorageImageUrl(url, PLANT_IMAGES_BUCKET)).toBe(true);
    expect(isStorageImageUrl(url, AVATARS_BUCKET)).toBe(false);
  });
});

describe("imageVariants resize", () => {
  const originalCreateImageBitmap = globalThis.createImageBitmap;
  const originalCreateElement = document.createElement.bind(document);

  function mockCanvas(options?: {
    context?: CanvasRenderingContext2D | null;
    blob?: Blob | null;
  }) {
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName !== "canvas") return originalCreateElement(tagName);
      const canvas = originalCreateElement("canvas") as HTMLCanvasElement;
      Object.defineProperty(canvas, "width", { writable: true, value: 0 });
      Object.defineProperty(canvas, "height", { writable: true, value: 0 });
      const context =
        options && "context" in options
          ? options.context
          : ({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
      canvas.getContext = vi.fn(() => context) as unknown as HTMLCanvasElement["getContext"];
      canvas.toBlob = vi.fn((cb: BlobCallback) => {
        cb(options && "blob" in options ? options.blob! : new Blob(["jpeg"], { type: "image/jpeg" }));
      }) as unknown as HTMLCanvasElement["toBlob"];
      return canvas;
    });
  }

  beforeEach(() => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({
        width: 3200,
        height: 2400,
        close: vi.fn(),
      })),
    );
    mockCanvas();
  });

  afterEach(() => {
    vi.stubGlobal("createImageBitmap", originalCreateImageBitmap);
    vi.restoreAllMocks();
  });

  it("resizes and returns a JPEG blob", async () => {
    const blob = await resizeImageFile(new Blob(["src"]), {
      maxEdge: 1600,
      quality: 0.8,
    });
    expect(blob.type).toBe("image/jpeg");
    expect(createImageBitmap).toHaveBeenCalled();
  });

  it("keeps dimensions when the source is already within the max edge", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({
        width: 800,
        height: 600,
        close: vi.fn(),
      })),
    );

    const blob = await resizeImageFile(new Blob(["src"]), {
      maxEdge: 1600,
      quality: 0.8,
    });
    expect(blob.type).toBe("image/jpeg");
  });

  it("throws when the canvas context cannot be created", async () => {
    mockCanvas({ context: null });
    await expect(
      resizeImageFile(new Blob(["src"]), { maxEdge: 400, quality: 0.7 }),
    ).rejects.toThrow("Could not create canvas context for image resize");
  });

  it("throws when JPEG encoding fails", async () => {
    mockCanvas({ blob: null });
    await expect(
      resizeImageFile(new Blob(["src"]), { maxEdge: 400, quality: 0.7 }),
    ).rejects.toThrow("Failed to encode resized image as JPEG");
  });

  it("prepares full and thumb File variants", async () => {
    const { full, thumb } = await prepareImageVariants(
      new File(["src"], "photo.png", { type: "image/png" }),
      "photo",
    );
    expect(full.name).toBe("photo.jpg");
    expect(thumb.name).toBe("photo_thumb.jpg");
    expect(full.type).toBe("image/jpeg");
    expect(thumb.type).toBe("image/jpeg");
  });

  it("falls back to image.jpg when the base name is empty after stripping", async () => {
    const { full, thumb } = await prepareImageVariants(new Blob(["src"]), ".png");
    expect(full.name).toBe("image.jpg");
    expect(thumb.name).toBe("image_thumb.jpg");
  });
});
