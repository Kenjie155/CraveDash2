import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type T = { id: number; text: string; bad: boolean };
const Ctx = createContext<(text: string, bad?: boolean) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<T[]>([]);
  const push = useCallback((text: string, bad = false) => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x, { id, text, bad }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 4000);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="toasts" role="status">{items.map((i) => <div key={i.id} className={i.bad ? 'toast bad' : 'toast'}>{i.text}</div>)}</div>
    </Ctx.Provider>
  );
}
