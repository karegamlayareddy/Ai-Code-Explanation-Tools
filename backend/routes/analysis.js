const express = require("express");
const { analyzeCode, makeTitle } = require("../utils/analyzer");
const supabase = require("../supabase");

const router = express.Router();

function validBrowserId(value) {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

router.post("/", async (req, res, next) => {
  try {
    const browserId = req.get("X-Browser-Id");
    if (!validBrowserId(browserId)) return res.status(400).json({ error: "Browser identifier is missing or invalid. Refresh the page and try again." });

    const { language, code } = req.body || {};
    if (typeof language !== "string") return res.status(400).json({ error: "Select a programming language." });

    const analysis = analyzeCode(language, code);
    const record = {
      browser_id: browserId,
      language,
      code,
      title: makeTitle(code),
      summary: analysis.summary,
      analysis
    };

    const { data, error } = await supabase
      .from("code_explanations")
      .insert(record)
      .select("id, language, code, title, summary, analysis, created_at")
      .single();

    if (error) {
      console.error("Supabase insert failed:", error.message);
      return res.status(503).json({ error: "Could not save the explanation. Check your Supabase setup and try again." });
    }
    return res.status(201).json({ message: "Code analyzed and saved.", item: data, analysis });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
