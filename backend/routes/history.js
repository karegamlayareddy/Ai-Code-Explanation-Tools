const express = require("express");
const supabase = require("../supabase");

const router = express.Router();
function validBrowserId(value) {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
function requireBrowserId(req, res, next) {
  if (!validBrowserId(req.get("X-Browser-Id"))) {
    return res.status(400).json({ error: "Browser identifier is missing or invalid. Refresh the page and try again." });
  }
  next();
}

router.use(requireBrowserId);

router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("code_explanations")
    .select("id, language, code, title, summary, analysis, created_at")
    .eq("browser_id", req.get("X-Browser-Id"))
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) {
    console.error("Supabase history query failed:", error.message);
    return res.status(503).json({ error: "Could not load history. Check your Supabase setup and try again." });
  }
  res.json({ items: data || [] });
});

router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return res.status(400).json({ error: "Invalid history item ID." });
  }
  const { data, error } = await supabase
    .from("code_explanations")
    .delete()
    .eq("id", id)
    .eq("browser_id", req.get("X-Browser-Id"))
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Supabase delete failed:", error.message);
    return res.status(503).json({ error: "Could not delete this item. Please try again." });
  }
  if (!data) return res.status(404).json({ error: "History item not found for this browser." });
  res.json({ message: "History item deleted." });
});

module.exports = router;
