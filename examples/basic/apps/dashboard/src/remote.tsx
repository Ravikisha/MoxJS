import { RemoteApp } from '@mfjs/runtime';
import { pages } from './mfjs.routes.js';

export default function RemoteRoot({ subpath = '/' }: { subpath?: string }) {
  return <RemoteApp subpath={subpath} pages={pages} />;
}
