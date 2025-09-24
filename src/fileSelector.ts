import * as fs from "fs";


const fileSelector = (filename: string) => {
    const temp = filename.split(".");
    if (temp.length !== 2) {
        return "";
    }

    const className = temp[0];
    const ext = temp[1];
    const doesTemplateExist = fs.existsSync(`./templates/${ext}`);
    if (doesTemplateExist) {
        const res = fs.readFileSync(`./templates/${ext}`, "utf-8");
        return res;
    }
    else {
        return "";
    }
};

export {
    fileSelector
};