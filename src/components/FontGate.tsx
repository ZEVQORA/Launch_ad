import React, { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { loadBrandFonts } from "../config/brand";

/** Blocks every frame until Satoshi and JetBrains Mono are loaded (local files only). */
export const FontGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [handle] = useState(() => delayRender("Loading brand fonts"));
  useEffect(() => {
    loadBrandFonts()
      .then(() => continueRender(handle))
      .catch((e) => {
        console.error(e);
        throw e;
      });
  }, [handle]);
  return <>{children}</>;
};
