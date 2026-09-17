import { createContext, useContext, useState, type ReactNode } from 'react';

// Holds Step 1's fields while the student fills in Step 2, so nothing
// (especially the password) has to round-trip through route params/URLs.
// Submitted to the API only once, at the end of Step 2.
export type RegistrationDraft = {
  firstName: string;
  middleName: string;
  lastName: string;
  age: string;
  mobileNumber: string;
};

const emptyDraft: RegistrationDraft = {
  firstName: '',
  middleName: '',
  lastName: '',
  age: '',
  mobileNumber: '',
};

type Ctx = {
  draft: RegistrationDraft;
  setDraft: (draft: RegistrationDraft) => void;
};

const RegistrationDraftContext = createContext<Ctx | undefined>(undefined);

export function RegistrationDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<RegistrationDraft>(emptyDraft);
  return (
    <RegistrationDraftContext.Provider value={{ draft, setDraft }}>
      {children}
    </RegistrationDraftContext.Provider>
  );
}

export function useRegistrationDraft() {
  const ctx = useContext(RegistrationDraftContext);
  if (!ctx) throw new Error('useRegistrationDraft() must be used within <RegistrationDraftProvider>');
  return ctx;
}
