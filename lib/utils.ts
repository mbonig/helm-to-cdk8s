// @ts-ignore
import {argv} from "yargs";
import {getYaml} from "../test/utils";

export function randAlphaNum(length: number) {
    return (Math.random() * 1e32).toString(36).substring(0, length);
}


export function base64(s: string) {
    return new Buffer(s).toString('base64');
}

export function undefinedIfEmpty(obj: any) {
    if (obj === undefined || obj === null) {
        return undefined;
    }
    if (Object.keys(obj).length === 0) {
        return undefined;
    }
    return obj;
}

export var getKeys = (obj: any) => Object.keys(obj).map(function (key) {
    return {key, value: obj[key]};
});

export function getValues() {
    let files = argv.f;
    if (!files) {
        return getYaml('./values.yaml');
    }
    if (files === true) {
        throw new Error("Please provide a filename with the -f flag.")
    }

    let valuesToLoad: any[];
    if (Array.isArray(files)) {
        valuesToLoad = ['values.yaml', ...files];
    } else {
        valuesToLoad = ['values.yaml', files];
    }
    return valuesToLoad.reduce((acc, file) => {
        return {...acc, ...getYaml(file)}
    }, {});
}

export function getReleaseName(): string {
    return (argv.n || argv.name || 'release-name') as string;
}

export function getNamespace() {
    return argv.namespace as string;
}
