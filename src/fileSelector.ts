import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import fs from "node:fs/promises";

export type HandleFn = (...args: any[]) => any;


const loadHandle = async (ext: string): Promise<HandleFn | undefined> => {
  const modulePath = resolve(__dirname, "../out/templates", `${ext}.js`);
  try {
    await fs.access(modulePath);
  } catch {
    return undefined;
  }
  const mod = await import(pathToFileURL(modulePath).href);
  return (mod.handle ?? mod.default) as HandleFn | undefined;
};

const fileSelector = async (filename: string) => {
    const temp = filename.split(".");
    if (temp.length !== 2) {
        return "";
    }

    const className = temp[0];
    const ext = temp[1];
    const f = await loadHandle(ext);
    if (!f) {
        return "";
    }

    try {
        const res: string = await f(className);
        return res;    
    } catch (error) {
        return "";
    }

};

export {
    fileSelector
};
