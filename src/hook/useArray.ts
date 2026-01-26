import { useState, useRef, useCallback } from 'react';

export function useArray<T>(initial: Array<T> = []) {
  const [array, setArray] = useState<Array<T>>(initial);
  const arrayRef = useRef(array);

  // Sync ref whenever array changes
  arrayRef.current = array;

  const forceUpdate = useCallback(() => setArray([...arrayRef.current]), []);

  const push = useCallback(
    (...items: Array<T>) => {
      arrayRef.current.push(...items);
      forceUpdate();
    },
    [forceUpdate],
  );

  const pop = useCallback((): T | undefined => {
    const item = arrayRef.current.pop();
    forceUpdate();
    return item;
  }, [forceUpdate]);

  const shift = useCallback((): T | undefined => {
    const item = arrayRef.current.shift();
    forceUpdate();
    return item;
  }, [forceUpdate]);

  const unshift = useCallback(
    (...items: Array<T>) => {
      arrayRef.current.unshift(...items);
      forceUpdate();
    },
    [forceUpdate],
  );

  const remove = useCallback(
    (index: number) => {
      if (index >= 0 && index < arrayRef.current.length) {
        arrayRef.current.splice(index, 1);
        forceUpdate();
      }
    },
    [forceUpdate],
  );

  const clear = useCallback(() => {
    arrayRef.current.length = 0;
    forceUpdate();
  }, [forceUpdate]);

  const set = useCallback(
    (newArray: Array<T>) => {
      arrayRef.current = newArray;
      forceUpdate();
    },
    [forceUpdate],
  );

  const modify = useCallback(
    (mod: Partial<T>, idx: number) => {
      arrayRef.current[idx] = { ...arrayRef.current[idx], ...mod };
      forceUpdate();
    },
    [forceUpdate],
  );

  const sorted = (sortFn: (a: T, b: T) => number) => {
    const copy = [...array];
    return copy.sort(sortFn);
  };

  const filter = useCallback(
    (predicate: (item: T, index: number, array: Array<T>) => boolean) => {
      let writeIndex = 0;
      for (let readIndex = 0; readIndex < arrayRef.current.length; readIndex++) {
        if (predicate(arrayRef.current[readIndex], readIndex, arrayRef.current)) {
          arrayRef.current[writeIndex] = arrayRef.current[readIndex];
          writeIndex++;
        }
      }
      arrayRef.current.length = writeIndex;
      forceUpdate();
    },
    [forceUpdate],
  );

  return {
    array,
    set,
    push,
    pop,
    shift,
    unshift,
    remove,
    clear,
    modify,
    sorted,
    filter,
  };
}
