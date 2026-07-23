const ALLOWED_HOSTS = new Set(["www.airbnb.com.br", "www.airbnb.com"]);

module.exports = async function handler(req, res) {
  const { url } = req.query || {};

  if (typeof url !== "string") {
    res.status(400).json({ error: "Missing calendar URL." });
    return;
  }

  let calendarUrl;
  try {
    calendarUrl = new URL(url);
  } catch {
    res.status(400).json({ error: "Invalid calendar URL." });
    return;
  }

  if (calendarUrl.protocol !== "https:" || !ALLOWED_HOSTS.has(calendarUrl.hostname)) {
    res.status(400).json({ error: "Unsupported calendar URL." });
    return;
  }

  try {
    const upstream = await fetch(calendarUrl.toString(), {
      headers: {
        "User-Agent": "CabanaWeCalendarProxy/1.0",
      },
    });

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: "Calendar fetch failed." });
      return;
    }

    const body = await upstream.text();
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(200).send(body);
  } catch {
    res.status(502).json({ error: "Calendar fetch failed." });
  }
};
