const axios = require("axios");

const HIGH   = [/\bkill\b/i,/\bmurder\b/i,/\bthreaten\b/i,/\battack\b/i,/\bbomb\b/i,/\bstab\b/i,/\bshoot\b/i,/\bterror\b/i];
const MEDIUM = [/\bhate\b/i,/\babuse\b/i,/\bracist\b/i,/\bviolent\b/i,/\bharassment\b/i];
const LOW    = [/\bstupid\b/i,/\bidiot\b/i,/\bmoron\b/i,/\bloser\b/i,/\bdumb\b/i,/\bscum\b/i];

const keywordCheck = (text) => {
  for (const p of HIGH)   if (p.test(text)) return { isFlagged:true, severity:"HIGH",   reason:"Content contains violent or threatening language.", source:"keyword" };
  for (const p of MEDIUM) if (p.test(text)) return { isFlagged:true, severity:"MEDIUM", reason:"Content contains abusive or hateful language.",     source:"keyword" };
  for (const p of LOW)    if (p.test(text)) return { isFlagged:true, severity:"LOW",    reason:"Content contains inappropriate language.",           source:"keyword" };
  return { isFlagged:false, source:"keyword" };
};

const checkHuggingFace = async (text) => {
  if (!process.env.INTERFACE_API_KEY) return null;
  try {
    const res = await axios.post(
      process.env.INTERFACE_API_URL || "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
      { inputs: text, parameters: { candidate_labels: ["hate speech","violence","harassment","toxic","safe content"] } },
      { headers: { Authorization: "Bearer " + process.env.INTERFACE_API_KEY }, timeout: 8000 }
    );
    const scores = {};
    (res.data.labels || []).forEach((l, i) => { scores[l] = res.data.scores[i]; });
    console.log("HF scores:", scores);
    if (scores["hate speech"] > 0.6 || scores["violence"] > 0.6)
      return { isFlagged:true, severity:"HIGH",   reason:"AI detected hate speech or violent content.", source:"huggingface" };
    if (scores["harassment"]  > 0.6 || scores["toxic"]    > 0.6)
      return { isFlagged:true, severity:"MEDIUM", reason:"AI detected harassment or toxic content.",     source:"huggingface" };
    if (scores["safe content"] < 0.4)
      return { isFlagged:true, severity:"LOW",    reason:"AI flagged content as potentially unsafe.",    source:"huggingface" };
    return { isFlagged:false, source:"huggingface" };
  } catch (e) { console.error("HF error:", e.message); return null; }
};

const checkTextRazor = async (text) => {
  if (!process.env.TEXTRAZOR_API_KEY) return null;
  try {
    const params = new URLSearchParams();
    params.append("text", text); params.append("extractors", "topics"); params.append("apiKey", process.env.TEXTRAZOR_API_KEY);
    const res     = await axios.post(process.env.TEXTRAZOR_API_URL || "https://api.textrazor.com/", params, { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 8000 });
    const topics  = res.data?.response?.coarseTopics || [];
    const bad     = ["Violence","Hate Speech","Discrimination","Crime","Terrorism"];
    const matched = topics.filter(t => bad.includes(t.label));
    if (matched.length) return { isFlagged:true, severity:"HIGH", reason:"TextRazor detected: " + matched.map(t=>t.label).join(", "), source:"textrazor" };
    return { isFlagged:false, source:"textrazor" };
  } catch (e) { console.error("TextRazor error:", e.message); return null; }
};

const moderateContent = async (text) => {
  if (!text || !text.trim()) return { isFlagged: false };
  const hf = await checkHuggingFace(text);
  if (hf?.isFlagged) return hf;
  const tr = await checkTextRazor(text);
  if (tr?.isFlagged) return tr;
  return keywordCheck(text);
};

module.exports = { moderateContent };
