import { Dispatch, SetStateAction, useCallback, useState } from 'react';

type IncrementHook = [number, () => void, Dispatch<SetStateAction<number>>];

export function useIncrement(initial: number, initial_increment: number = 0): IncrementHook {
  const [value, setValue] = useState<number>(initial);
  const [increment, setIncrement] = useState<number>(initial_increment);

  const inc = useCallback(() => setValue(p => p + increment), [increment]);

  return [value, inc, setIncrement];
}
