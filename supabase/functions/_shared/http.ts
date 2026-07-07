export function jsonResponse(
  body: unknown,
  corsOriginHeaders: Record<string, string>,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsOriginHeaders },
  });
}

export function optionsResponse(req: Request, corsOriginHeaders: Record<string, string>): Response {
  const requestedHeaders = req.headers.get("Access-Control-Request-Headers") ?? "";
  return new Response(null, {
    status: 204,
    headers: {
      ...corsOriginHeaders,
      "Access-Control-Allow-Headers": requestedHeaders,
    },
  });
}
