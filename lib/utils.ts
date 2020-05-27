// @ts-ignore
export function randAlphaNum(length: number) {
    return (Math.random() * 1e32).toString(36).substring(0, length);
}


export function base64(s: string) {
    return new Buffer(s).toString('base64');
}

export function undefinedIfEmpty(obj: any) {
    if (obj === undefined || obj === null){
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

