declare module "jsfive" {
  /** A dataset or attribute value read from an HDF5 file. */
  interface Dataset {
    value: number[] | string[] | unknown;
    shape: number[];
    attrs: Record<string, unknown>;
  }

  export class File {
    constructor(arrayBuffer: ArrayBuffer, filename?: string);
    /** Names of all datasets/groups at the root. */
    keys: string[];
    /** Fetch a dataset by name, or undefined if absent. */
    get(name: string): Dataset | undefined;
  }
}
