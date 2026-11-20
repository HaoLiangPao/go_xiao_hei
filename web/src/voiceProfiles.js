export const voiceProfiles = {
  adultMale: {
    label: "成熟男声",
    rate: 0.78,
    pitch: 0.72,
    preferred:
      /male|云[希健扬]|yunxi|yunjian|yunyang|liang|yusheng|guoqiang|sin-ji-m|zhiwei/i,
  },
  adultFemale: {
    label: "成年女声",
    rate: 0.92,
    pitch: 1.04,
    preferred:
      /female|女声|晓[晓伊]|xiaoxiao|xiaoyi|xiaoxuan|ting.?ting|meijia|huihui/i,
  },
  child: {
    label: "男童声",
    rate: 1.06,
    pitch: 1.13,
    preferred: /boy|child|男童|云夏|yunxia/i,
  },
};

export function mandarinVoices(all) {
  const chinese = all.filter((voice) => /^zh(?:-|$)/i.test(voice.lang));
  const mandarin = chinese.filter((voice) =>
    /^zh(?:-(?:CN|TW|SG|Hans|Hant))*$/i.test(voice.lang),
  );
  return mandarin.length ? mandarin : chinese;
}

export function castVoice(voices, role, overrides) {
  const chosen =
    overrides[role] &&
    voices.find((voice) => voice.voiceURI === overrides[role]);
  if (chosen) return chosen;
  const nameMatch = voices.find((voice) => {
    // "female" contains "male"; check the male label as a separate word.
    if (role === "adultMale" && /female|女声/i.test(voice.name)) return false;
    return voiceProfiles[role].preferred.test(voice.name);
  });
  if (nameMatch) return nameMatch;
  if (role === "child") return voices[2] || voices[1] || voices[0];
  return voices[role === "adultFemale" ? 1 : 0] || voices[0];
}
