export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    return (err as { message: string }).message;
  }
  return "An unknown error occurred";
}
