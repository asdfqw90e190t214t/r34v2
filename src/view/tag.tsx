import { useContext } from 'react';
import { TagDTO } from '../api/TagDTO';
import { MainContext } from './main';

export function Tag({ tag }: { tag: TagDTO }) {
  const { removeTagCallback } = useContext(MainContext);

  return (
    <div onClick={() => removeTagCallback(tag)} className="tag">
      {tag.name}
    </div>
  );
}
