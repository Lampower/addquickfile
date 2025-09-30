export const handle = (filename: string): string => {
    const finalFileName = capitalize(
      filename.replace(
        /_([a-zA-Zа-яА-ЯёЁ])/g,
        (_, ch: string) => ch.toUpperCase()
      )
    );

    const res = `class ${finalFileName}:
    pass
`;
    return res;
};


function capitalize(str: string): string {
  if (!str) { return str; }
  return str.charAt(0).toUpperCase() + str.slice(1);
}