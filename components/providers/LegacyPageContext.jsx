import { createContext, useContext } from 'react';

const LegacyPageContext = createContext(null);

export function LegacyPageProvider({ data, type, children }) {
    return (
        <LegacyPageContext.Provider value={{ data, type }}>
            {children}
        </LegacyPageContext.Provider>
    );
}

export function useLegacyPageData() {
    return useContext(LegacyPageContext);
}
