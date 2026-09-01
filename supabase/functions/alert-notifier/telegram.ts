export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
): Promise<void> {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  const json = await res.json();
  if (!json.ok) console.error("Telegram sendMessage error:", json.description);
}

export async function sendTelegramPhoto(
  botToken: string,
  chatId: string,
  photo: string,
  caption: string,
): Promise<void> {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, photo, caption }),
  });
  const json = await res.json();
  if (!json.ok) console.error("Telegram sendPhoto error:", json.description);
}
