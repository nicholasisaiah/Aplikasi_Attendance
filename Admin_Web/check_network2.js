async function testConnection() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch('https://coplcrymjcofwohudpzp.supabase.co', { signal: controller.signal });
    console.log("Status:", res.status);
  } catch (err) {
    console.error("Fetch failed:", err.message);
  } finally {
    clearTimeout(timeoutId);
  }
}

testConnection();
