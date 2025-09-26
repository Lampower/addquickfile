export const handle = (filename: string): string => {
    const res = `class ${capitalize(filename)}:
    pass
`;
    return res;
};


function capitalize(str: string): string {
  if (!str) { return str; }
  return str.charAt(0).toUpperCase() + str.slice(1);
}