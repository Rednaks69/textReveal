import React, { createContext, useContext, useMemo, useRef, useState, useCallback } from "react";
import { Atlas } from "../core/Atlas";

interface BlotterContextValue {
  atlas: Atlas;
  requestUpdate: () => void;
}

const BlotterContext = createContext<BlotterContextValue | null>(null);

export interface BlotterProviderProps {
  children: React.ReactNode;
}

/**
 * Wrap any part of your R3F scene that contains <BlotterText> elements.
 * All texts under one provider share a single atlas texture (and therefore
 * a single draw call per material), same as texts sharing an effect in the
 * original Blotter.js.
 */
export function BlotterProvider({ children }: BlotterProviderProps) {
  const atlasRef = useRef<Atlas | null>(null);
  if (!atlasRef.current) atlasRef.current = new Atlas();

  const [, setVersion] = useState(0);
  const requestUpdate = useCallback(() => setVersion((v) => v + 1), []);

  const value = useMemo<BlotterContextValue>(
    () => ({ atlas: atlasRef.current as Atlas, requestUpdate }),
    [requestUpdate],
  );

  return <BlotterContext.Provider value={value}>{children}</BlotterContext.Provider>;
}

export function useBlotterAtlas(): BlotterContextValue {
  const ctx = useContext(BlotterContext);
  if (!ctx) {
    throw new Error("blotter-r3f: <BlotterText> must be rendered inside a <BlotterProvider>");
  }
  return ctx;
}
