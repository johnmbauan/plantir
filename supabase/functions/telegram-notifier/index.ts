Deno.serve(async (req) => {
  const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')
  // This secret is used to verify that the request is coming from an authorized source (e.g., your backend or a trusted service)
  // SUPABASE_SERVICE_ROLE_KEY is a default environment variable always provided by Supabase that contains the service role key, which has elevated permissions.
  // you can't edit this variable from the Dashboard or the CLI. 
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!SERVICE_ROLE_KEY || !BOT_TOKEN || !CHAT_ID) {
    return new Response(JSON.stringify({ error: "Missing environment variables" }), { status: 500 });
  }

  const isAuthorized = req.headers.get('apikey') === SERVICE_ROLE_KEY;

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: "Ciao! Test manuale riuscito. 🚀",
      }),
    })

    const result = await response.json()
    
    if (!result.ok) {
      console.error("Telegram error response:", result.description);
      return new Response(JSON.stringify({ success: false, reason: result.description }), { status: 200 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error catch:", errorMessage);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), { status: 500 });
  }
})
