import { createContext, type ReactNode, useContext } from 'react';

type CoverArtUrlBuilder = (id: string, size: number) => string;

const CoverArtContext = createContext<CoverArtUrlBuilder | null>(null);

export function CoverArtProvider({
  getCoverArtUrl,
  children,
}: {
  getCoverArtUrl: CoverArtUrlBuilder;
  children: ReactNode;
}) {
  return <CoverArtContext.Provider value={getCoverArtUrl}>{children}</CoverArtContext.Provider>;
}

export function useCoverArtUrl(): CoverArtUrlBuilder | null {
  return useContext(CoverArtContext);
}
