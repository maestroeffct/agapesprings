import { Devotional } from "@/api/devotional";
import {
  getFavedDevotionals,
  getFavedIds,
  toggleFave,
} from "@/store/devotionalFaves";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type DevotionalFavesContextType = {
  favIds: number[];
  favData: Devotional[];
  toggle: (id: number, devo?: Devotional) => Promise<void>;
  refresh: () => Promise<void>;
};

const DevotionalFavesContext = createContext<DevotionalFavesContextType | null>(
  null
);

export const DevotionalFavesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [favIds, setFavIds] = useState<number[]>([]);
  const [favData, setFavData] = useState<Devotional[]>([]);

  const refresh = useCallback(async () => {
    const ids = await getFavedIds();
    const favs = await getFavedDevotionals();
    setFavIds(ids);
    setFavData(favs);
  }, []);

  const toggle = useCallback(async (id: number, devo?: Devotional) => {
    const updated = await toggleFave(id, devo);
    setFavIds(updated);
    const favs = await getFavedDevotionals();
    setFavData(favs);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <DevotionalFavesContext.Provider
      value={{ favIds, favData, toggle, refresh }}
    >
      {children}
    </DevotionalFavesContext.Provider>
  );
};

export const useDevotionalFaves = () => {
  const ctx = useContext(DevotionalFavesContext);
  if (!ctx)
    throw new Error(
      "useDevotionalFaves must be used inside DevotionalFavesProvider"
    );
  return ctx;
};
