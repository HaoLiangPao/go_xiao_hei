import React, { useEffect, useState } from "react";
import { characterRoute } from "./characterModel.js";
import { CharacterLibrary } from "./CharacterLibrary.jsx";

export function SiteRouter({ Game }) {
  const [route, setRoute] = useState(() => characterRoute(location.hash));
  useEffect(() => {
    const change = () => {
      setRoute(characterRoute(location.hash));
      window.scrollTo(0, 0);
    };
    addEventListener("hashchange", change);
    return () => removeEventListener("hashchange", change);
  }, []);
  return route.kind === "game" ? <Game /> : <CharacterLibrary route={route} />;
}
