import { Dispatch, SetStateAction, useState } from 'react';

type ToggleValueHook<T> = [T, () => void, Dispatch<SetStateAction<boolean>>];
type ToggleHook = [boolean, () => void, Dispatch<SetStateAction<boolean>>];

export function useToggleValue<T>(initial: T, secondary: T): ToggleValueHook<T> {
  const [toggle, setToggle] = useState<boolean>(false);
  const toggleCallback = () => setToggle(p => !p);

  return [toggle ? initial : secondary, toggleCallback, setToggle];
}

export function useToggle(init: boolean = false): ToggleHook {
  const [toggle, setToggle] = useState<boolean>(init);
  const toggleCallback = () => setToggle(p => !p);

  return [toggle, toggleCallback, setToggle];
}
