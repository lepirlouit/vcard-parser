import { randomUUID } from "node:crypto";

export type vCardEntry = {
    value: string | string[];
    meta?: {
        type?: string[];
        value?: string[];
        charset?: string[];
    };
    namespace?: string;
}
export type vCard = {
    [key: string]: vCardEntry[];
}

const PREFIX = "BEGIN:VCARD",
    POSTFIX = "END:VCARD";

/**
 * Return json representation of vCard
 * @param {string} string raw vCard
 * @returns {vCard}
 */
export function parse(string: string): vCard {
    const result = {};
    const lines = string.split(/\r\n|\r|\n/);
    const count = lines.length;
    let pieces: any[];
    let key: string;
    let value: string | string[];
    let meta:
        | { type?: string[]; value?: string[]; charset?: string[] }
        | undefined;
    let namespace: string | boolean | undefined;

    for (let i = 0; i < count; i++) {
        if (lines[i] === "") {
            continue;
        }
        if (
            lines[i].toUpperCase() === PREFIX ||
            lines[i].toUpperCase() === POSTFIX
        ) {
            continue;
        }
        let data = lines[i];

        /**
         * Check that next line continues current
         * @param {number} i
         * @returns {boolean}
         */
        const isValueContinued = function (i: number) {
            return (
                i + 1 < count &&
                (lines[i + 1][0] === " " || lines[i + 1][0] === "\t")
            );
        };
        // handle multiline properties (i.e. photo).
        // next line should start with space or tab character
        if (isValueContinued(i)) {
            while (isValueContinued(i)) {
                data += lines[i + 1].trim();
                i++;
            }
        }

        pieces = data.split(":");
        key = pieces.shift();
        value = pieces.join(":");
        namespace = false;
        meta = {};

        // meta fields in property
        if (key!.match(/;/)) {
            key = key!.replace(/\\;/g, "ΩΩΩ").replace(/\\,/, ",");
            const metaArr = key.split(";").map(function (item: string) {
                return item.replace(/ΩΩΩ/g, ";");
            });
            key = metaArr.shift()!;
            metaArr.forEach(function (item: string) {
                const arr = item.split("=");
                arr[0] = arr[0].toLowerCase();
                if (arr[0].length === 0) {
                    return;
                }
                if (meta![arr[0]]) {
                    meta![arr[0]].push(arr[1]);
                } else {
                    meta![arr[0]] = [arr[1]];
                }
            });
        }

        // values with \n
        value = value.replace(/\\n/g, "\n");

        value = tryToSplit(value);

        // Grouped properties
        if (key.match(/\./)) {
            const arr = key.split(".");
            key = arr[1];
            namespace = arr[0];
        }

        const newValue: vCardEntry = {
            value: value,
        };
        if (Object.keys(meta).length) {
            newValue.meta = meta;
        }
        if (namespace) {
            newValue.namespace = namespace;
        }

        if (key.indexOf("X-") !== 0) {
            key = key.toLowerCase();
        }

        if (typeof result[key] === "undefined") {
            result[key] = [newValue];
        } else {
            result[key].push(newValue);
        }
    }

    return result;
}

const HAS_SEMICOLON_SEPARATOR = /[^\\];|^;/,
    HAS_COMMA_SEPARATOR = /[^\\],|^,/;
/**
 * Split value by "," or ";" and remove escape sequences for this separators
 * @param {string} value
 * @returns {string|string[]
 */
function tryToSplit(value: string) {
    if (value.match(HAS_SEMICOLON_SEPARATOR)) {
        value = value.replace(/\\,/g, ",");
        return splitValue(value, ";");
    } else if (value.match(HAS_COMMA_SEPARATOR)) {
        value = value.replace(/\\;/g, ";");
        return splitValue(value, ",");
    } else {
        return value.replace(/\\,/g, ",").replace(/\\;/g, ";");
    }
}
/**
 * Split vcard field value by separator
 * @param {string|string[]} value
 * @param {string} separator
 * @returns {string|string[]}
 */
function splitValue(
    value: string,
    separator: string
) {
    const separatorRegexp = new RegExp(separator);
    const escapedSeparatorRegexp = new RegExp("\\\\" + separator, "g");
    // easiest way, replace it with really rare character sequence
    let newValue: string | string[] = value.replace(escapedSeparatorRegexp, "ΩΩΩ");
    if (value.match(separatorRegexp)) {
        newValue = newValue.split(separator);

        newValue = newValue.map(function (item: string) {
            return item.replace(/ΩΩΩ/g, separator);
        });
    } else {
        newValue = newValue.replace(/ΩΩΩ/g, separator);
    }
    return newValue;
}

const guid = () => randomUUID();

const COMMA_SEPARATED_FIELDS = ["nickname", "related", "categories", "pid"];

const REQUIRED_FIELDS = ["fn"];

/**
 * Generate vCard representation af object
 * @param {*} data
 * @param {boolean=} addRequired determine if generator should add required properties (version and uid)
 * @returns {string}
 */
export function generate(data: vCard, addRequired: boolean = false) {
    const lines = [PREFIX];
    let line = "";

    if (addRequired && !data.version) {
        data.version = [{ value: "3.0" }];
    }
    if (addRequired && !data.uid) {
        data.uid = [{ value: guid() }];
    }

    const escapeCharacters = function (v: string) {
        if (typeof v === "undefined") {
            return "";
        }
        return v
            .replace(/\n/g, "\\n")
            .replace(/;/g, "\\;")
            .replace(/,/g, "\\,");
    };

    const escapeTypeCharacters = function (v: string) {
        if (typeof v === "undefined") {
            return "";
        }
        return v.replace(/\n/g, "\\n").replace(/;/g, "\\;");
    };

    Object.keys(data).forEach(function (key) {
        if (!data[key] || typeof data[key].forEach !== "function") {
            return;
        }
        data[key].forEach(function (value) {
            // ignore undefined values
            if (typeof value.value === "undefined") {
                return;
            }

            // ignore empty values (unless it's a required field)
            if (value.value === "" && REQUIRED_FIELDS.indexOf(key) === -1) {
                return;
            }

            // ignore empty array values
            if (value.value instanceof Array) {
                const empty = value.value.every(
                    (v) => typeof v === "undefined"
                );
                if (empty) {
                    return;
                }
            }
            line = "";

            // add namespace if exists
            if (value.namespace) {
                line += value.namespace + ".";
            }
            line += key.indexOf("X-") === 0 ? key : key.toUpperCase();

            // add meta properties
            if (typeof value.meta === "object") {
                Object.keys(value.meta).forEach(function (metaKey) {
                    // values of meta tags must be an array
                    if (typeof value.meta![metaKey].forEach !== "function") {
                        return;
                    }
                    value.meta![metaKey].forEach(function (metaValue: any) {
                        if (metaKey.length > 0) {
                            if (metaKey.toUpperCase() === "TYPE") {
                                // Do not escape the comma when it is the type property. This breaks a lot.
                                line +=
                                    ";" +
                                    escapeCharacters(metaKey.toUpperCase()) +
                                    "=" +
                                    escapeTypeCharacters(metaValue);
                            } else {
                                line +=
                                    ";" +
                                    escapeCharacters(metaKey.toUpperCase()) +
                                    "=" +
                                    escapeCharacters(metaValue);
                            }
                        }
                    });
                });
            }

            line += ":";

            if (typeof value.value === "string") {
                line += escapeCharacters(value.value);
            } else {
                // list-values
                const separator =
                    COMMA_SEPARATED_FIELDS.indexOf(key) !== -1 ? "," : ";";
                line += value.value
                    .map(function (item) {
                        return escapeCharacters(item);
                    })
                    .join(separator);
            }

            // line-length limit. Content lines
            // SHOULD be folded to a maximum width of 75 octets, excluding the line break.
            if (line.length > 75) {
                const firstChunk = line.substring(0, 75),
                    least = line.substring(75);
                const splitted = least.match(/.{1,74}/g);
                lines.push(firstChunk);
                splitted!.forEach(function (chunk) {
                    lines.push(" " + chunk);
                });
            } else {
                lines.push(line);
            }
        });
    });

    lines.push(POSTFIX);
    return lines.join("\r\n");
}

