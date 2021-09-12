import yargs from 'yargs';
import { format, inspect } from 'util';
import * as Fs from 'fs';
import { readFileSync, statSync, readdirSync, writeFile } from 'fs';
import * as Path from 'path';
import { normalize, resolve, dirname, basename, extname, relative } from 'path';
import { notStrictEqual, strictEqual } from 'assert';
import { fileURLToPath } from 'url';
import * as Minikin from 'minikin';
import * as Playwright from 'playwright';
import * as FsExtra from 'fs-extra';

class YError extends Error {
    constructor(msg) {
        super(msg || 'yargs error');
        this.name = 'YError';
        Error.captureStackTrace(this, YError);
    }
}

function getProcessArgvBinIndex() {
    if (isBundledElectronApp())
        return 0;
    return 1;
}
function isBundledElectronApp() {
    return isElectronApp() && !process.defaultApp;
}
function isElectronApp() {
    return !!process.versions.electron;
}
function hideBin(argv) {
    return argv.slice(getProcessArgvBinIndex() + 1);
}
function getProcessArgvBin() {
    return process.argv[getProcessArgvBinIndex()];
}

/**
 * @license
 * Copyright (c) 2016, Contributors
 * SPDX-License-Identifier: ISC
 */
function camelCase(str) {
    // Handle the case where an argument is provided as camel case, e.g., fooBar.
    // by ensuring that the string isn't already mixed case:
    const isCamelCase = str !== str.toLowerCase() && str !== str.toUpperCase();
    if (!isCamelCase) {
        str = str.toLowerCase();
    }
    if (str.indexOf('-') === -1 && str.indexOf('_') === -1) {
        return str;
    }
    else {
        let camelcase = '';
        let nextChrUpper = false;
        const leadingHyphens = str.match(/^-+/);
        for (let i = leadingHyphens ? leadingHyphens[0].length : 0; i < str.length; i++) {
            let chr = str.charAt(i);
            if (nextChrUpper) {
                nextChrUpper = false;
                chr = chr.toUpperCase();
            }
            if (i !== 0 && (chr === '-' || chr === '_')) {
                nextChrUpper = true;
            }
            else if (chr !== '-' && chr !== '_') {
                camelcase += chr;
            }
        }
        return camelcase;
    }
}
function decamelize(str, joinString) {
    const lowercase = str.toLowerCase();
    joinString = joinString || '-';
    let notCamelcase = '';
    for (let i = 0; i < str.length; i++) {
        const chrLower = lowercase.charAt(i);
        const chrString = str.charAt(i);
        if (chrLower !== chrString && i > 0) {
            notCamelcase += `${joinString}${lowercase.charAt(i)}`;
        }
        else {
            notCamelcase += chrString;
        }
    }
    return notCamelcase;
}
function looksLikeNumber(x) {
    if (x === null || x === undefined)
        return false;
    // if loaded from config, may already be a number.
    if (typeof x === 'number')
        return true;
    // hexadecimal.
    if (/^0x[0-9a-f]+$/i.test(x))
        return true;
    // don't treat 0123 as a number; as it drops the leading '0'.
    if (/^0[^.]/.test(x))
        return false;
    return /^[-]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(x);
}

/**
 * @license
 * Copyright (c) 2016, Contributors
 * SPDX-License-Identifier: ISC
 */
// take an un-split argv string and tokenize it.
function tokenizeArgString(argString) {
    if (Array.isArray(argString)) {
        return argString.map(e => typeof e !== 'string' ? e + '' : e);
    }
    argString = argString.trim();
    let i = 0;
    let prevC = null;
    let c = null;
    let opening = null;
    const args = [];
    for (let ii = 0; ii < argString.length; ii++) {
        prevC = c;
        c = argString.charAt(ii);
        // split on spaces unless we're in quotes.
        if (c === ' ' && !opening) {
            if (!(prevC === ' ')) {
                i++;
            }
            continue;
        }
        // don't split the string if we're in matching
        // opening or closing single and double quotes.
        if (c === opening) {
            opening = null;
        }
        else if ((c === "'" || c === '"') && !opening) {
            opening = c;
        }
        if (!args[i])
            args[i] = '';
        args[i] += c;
    }
    return args;
}

/**
 * @license
 * Copyright (c) 2016, Contributors
 * SPDX-License-Identifier: ISC
 */
var DefaultValuesForTypeKey;
(function (DefaultValuesForTypeKey) {
    DefaultValuesForTypeKey["BOOLEAN"] = "boolean";
    DefaultValuesForTypeKey["STRING"] = "string";
    DefaultValuesForTypeKey["NUMBER"] = "number";
    DefaultValuesForTypeKey["ARRAY"] = "array";
})(DefaultValuesForTypeKey || (DefaultValuesForTypeKey = {}));

/**
 * @license
 * Copyright (c) 2016, Contributors
 * SPDX-License-Identifier: ISC
 */
let mixin$1;
class YargsParser {
    constructor(_mixin) {
        mixin$1 = _mixin;
    }
    parse(argsInput, options) {
        const opts = Object.assign({
            alias: undefined,
            array: undefined,
            boolean: undefined,
            config: undefined,
            configObjects: undefined,
            configuration: undefined,
            coerce: undefined,
            count: undefined,
            default: undefined,
            envPrefix: undefined,
            narg: undefined,
            normalize: undefined,
            string: undefined,
            number: undefined,
            __: undefined,
            key: undefined
        }, options);
        // allow a string argument to be passed in rather
        // than an argv array.
        const args = tokenizeArgString(argsInput);
        // aliases might have transitive relationships, normalize this.
        const aliases = combineAliases(Object.assign(Object.create(null), opts.alias));
        const configuration = Object.assign({
            'boolean-negation': true,
            'camel-case-expansion': true,
            'combine-arrays': false,
            'dot-notation': true,
            'duplicate-arguments-array': true,
            'flatten-duplicate-arrays': true,
            'greedy-arrays': true,
            'halt-at-non-option': false,
            'nargs-eats-options': false,
            'negation-prefix': 'no-',
            'parse-numbers': true,
            'parse-positional-numbers': true,
            'populate--': false,
            'set-placeholder-key': false,
            'short-option-groups': true,
            'strip-aliased': false,
            'strip-dashed': false,
            'unknown-options-as-args': false
        }, opts.configuration);
        const defaults = Object.assign(Object.create(null), opts.default);
        const configObjects = opts.configObjects || [];
        const envPrefix = opts.envPrefix;
        const notFlagsOption = configuration['populate--'];
        const notFlagsArgv = notFlagsOption ? '--' : '_';
        const newAliases = Object.create(null);
        const defaulted = Object.create(null);
        // allow a i18n handler to be passed in, default to a fake one (util.format).
        const __ = opts.__ || mixin$1.format;
        const flags = {
            aliases: Object.create(null),
            arrays: Object.create(null),
            bools: Object.create(null),
            strings: Object.create(null),
            numbers: Object.create(null),
            counts: Object.create(null),
            normalize: Object.create(null),
            configs: Object.create(null),
            nargs: Object.create(null),
            coercions: Object.create(null),
            keys: []
        };
        const negative = /^-([0-9]+(\.[0-9]+)?|\.[0-9]+)$/;
        const negatedBoolean = new RegExp('^--' + configuration['negation-prefix'] + '(.+)');
        [].concat(opts.array || []).filter(Boolean).forEach(function (opt) {
            const key = typeof opt === 'object' ? opt.key : opt;
            // assign to flags[bools|strings|numbers]
            const assignment = Object.keys(opt).map(function (key) {
                const arrayFlagKeys = {
                    boolean: 'bools',
                    string: 'strings',
                    number: 'numbers'
                };
                return arrayFlagKeys[key];
            }).filter(Boolean).pop();
            // assign key to be coerced
            if (assignment) {
                flags[assignment][key] = true;
            }
            flags.arrays[key] = true;
            flags.keys.push(key);
        });
        [].concat(opts.boolean || []).filter(Boolean).forEach(function (key) {
            flags.bools[key] = true;
            flags.keys.push(key);
        });
        [].concat(opts.string || []).filter(Boolean).forEach(function (key) {
            flags.strings[key] = true;
            flags.keys.push(key);
        });
        [].concat(opts.number || []).filter(Boolean).forEach(function (key) {
            flags.numbers[key] = true;
            flags.keys.push(key);
        });
        [].concat(opts.count || []).filter(Boolean).forEach(function (key) {
            flags.counts[key] = true;
            flags.keys.push(key);
        });
        [].concat(opts.normalize || []).filter(Boolean).forEach(function (key) {
            flags.normalize[key] = true;
            flags.keys.push(key);
        });
        if (typeof opts.narg === 'object') {
            Object.entries(opts.narg).forEach(([key, value]) => {
                if (typeof value === 'number') {
                    flags.nargs[key] = value;
                    flags.keys.push(key);
                }
            });
        }
        if (typeof opts.coerce === 'object') {
            Object.entries(opts.coerce).forEach(([key, value]) => {
                if (typeof value === 'function') {
                    flags.coercions[key] = value;
                    flags.keys.push(key);
                }
            });
        }
        if (typeof opts.config !== 'undefined') {
            if (Array.isArray(opts.config) || typeof opts.config === 'string') {
                [].concat(opts.config).filter(Boolean).forEach(function (key) {
                    flags.configs[key] = true;
                });
            }
            else if (typeof opts.config === 'object') {
                Object.entries(opts.config).forEach(([key, value]) => {
                    if (typeof value === 'boolean' || typeof value === 'function') {
                        flags.configs[key] = value;
                    }
                });
            }
        }
        // create a lookup table that takes into account all
        // combinations of aliases: {f: ['foo'], foo: ['f']}
        extendAliases(opts.key, aliases, opts.default, flags.arrays);
        // apply default values to all aliases.
        Object.keys(defaults).forEach(function (key) {
            (flags.aliases[key] || []).forEach(function (alias) {
                defaults[alias] = defaults[key];
            });
        });
        let error = null;
        checkConfiguration();
        let notFlags = [];
        const argv = Object.assign(Object.create(null), { _: [] });
        // TODO(bcoe): for the first pass at removing object prototype  we didn't
        // remove all prototypes from objects returned by this API, we might want
        // to gradually move towards doing so.
        const argvReturn = {};
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            const truncatedArg = arg.replace(/^-{3,}/, '---');
            let broken;
            let key;
            let letters;
            let m;
            let next;
            let value;
            // any unknown option (except for end-of-options, "--")
            if (arg !== '--' && isUnknownOptionAsArg(arg)) {
                pushPositional(arg);
                // ---, ---=, ----, etc,
            }
            else if (truncatedArg.match(/---+(=|$)/)) {
                // options without key name are invalid.
                pushPositional(arg);
                continue;
                // -- separated by =
            }
            else if (arg.match(/^--.+=/) || (!configuration['short-option-groups'] && arg.match(/^-.+=/))) {
                // Using [\s\S] instead of . because js doesn't support the
                // 'dotall' regex modifier. See:
                // http://stackoverflow.com/a/1068308/13216
                m = arg.match(/^--?([^=]+)=([\s\S]*)$/);
                // arrays format = '--f=a b c'
                if (m !== null && Array.isArray(m) && m.length >= 3) {
                    if (checkAllAliases(m[1], flags.arrays)) {
                        i = eatArray(i, m[1], args, m[2]);
                    }
                    else if (checkAllAliases(m[1], flags.nargs) !== false) {
                        // nargs format = '--f=monkey washing cat'
                        i = eatNargs(i, m[1], args, m[2]);
                    }
                    else {
                        setArg(m[1], m[2]);
                    }
                }
            }
            else if (arg.match(negatedBoolean) && configuration['boolean-negation']) {
                m = arg.match(negatedBoolean);
                if (m !== null && Array.isArray(m) && m.length >= 2) {
                    key = m[1];
                    setArg(key, checkAllAliases(key, flags.arrays) ? [false] : false);
                }
                // -- separated by space.
            }
            else if (arg.match(/^--.+/) || (!configuration['short-option-groups'] && arg.match(/^-[^-]+/))) {
                m = arg.match(/^--?(.+)/);
                if (m !== null && Array.isArray(m) && m.length >= 2) {
                    key = m[1];
                    if (checkAllAliases(key, flags.arrays)) {
                        // array format = '--foo a b c'
                        i = eatArray(i, key, args);
                    }
                    else if (checkAllAliases(key, flags.nargs) !== false) {
                        // nargs format = '--foo a b c'
                        // should be truthy even if: flags.nargs[key] === 0
                        i = eatNargs(i, key, args);
                    }
                    else {
                        next = args[i + 1];
                        if (next !== undefined && (!next.match(/^-/) ||
                            next.match(negative)) &&
                            !checkAllAliases(key, flags.bools) &&
                            !checkAllAliases(key, flags.counts)) {
                            setArg(key, next);
                            i++;
                        }
                        else if (/^(true|false)$/.test(next)) {
                            setArg(key, next);
                            i++;
                        }
                        else {
                            setArg(key, defaultValue(key));
                        }
                    }
                }
                // dot-notation flag separated by '='.
            }
            else if (arg.match(/^-.\..+=/)) {
                m = arg.match(/^-([^=]+)=([\s\S]*)$/);
                if (m !== null && Array.isArray(m) && m.length >= 3) {
                    setArg(m[1], m[2]);
                }
                // dot-notation flag separated by space.
            }
            else if (arg.match(/^-.\..+/) && !arg.match(negative)) {
                next = args[i + 1];
                m = arg.match(/^-(.\..+)/);
                if (m !== null && Array.isArray(m) && m.length >= 2) {
                    key = m[1];
                    if (next !== undefined && !next.match(/^-/) &&
                        !checkAllAliases(key, flags.bools) &&
                        !checkAllAliases(key, flags.counts)) {
                        setArg(key, next);
                        i++;
                    }
                    else {
                        setArg(key, defaultValue(key));
                    }
                }
            }
            else if (arg.match(/^-[^-]+/) && !arg.match(negative)) {
                letters = arg.slice(1, -1).split('');
                broken = false;
                for (let j = 0; j < letters.length; j++) {
                    next = arg.slice(j + 2);
                    if (letters[j + 1] && letters[j + 1] === '=') {
                        value = arg.slice(j + 3);
                        key = letters[j];
                        if (checkAllAliases(key, flags.arrays)) {
                            // array format = '-f=a b c'
                            i = eatArray(i, key, args, value);
                        }
                        else if (checkAllAliases(key, flags.nargs) !== false) {
                            // nargs format = '-f=monkey washing cat'
                            i = eatNargs(i, key, args, value);
                        }
                        else {
                            setArg(key, value);
                        }
                        broken = true;
                        break;
                    }
                    if (next === '-') {
                        setArg(letters[j], next);
                        continue;
                    }
                    // current letter is an alphabetic character and next value is a number
                    if (/[A-Za-z]/.test(letters[j]) &&
                        /^-?\d+(\.\d*)?(e-?\d+)?$/.test(next) &&
                        checkAllAliases(next, flags.bools) === false) {
                        setArg(letters[j], next);
                        broken = true;
                        break;
                    }
                    if (letters[j + 1] && letters[j + 1].match(/\W/)) {
                        setArg(letters[j], next);
                        broken = true;
                        break;
                    }
                    else {
                        setArg(letters[j], defaultValue(letters[j]));
                    }
                }
                key = arg.slice(-1)[0];
                if (!broken && key !== '-') {
                    if (checkAllAliases(key, flags.arrays)) {
                        // array format = '-f a b c'
                        i = eatArray(i, key, args);
                    }
                    else if (checkAllAliases(key, flags.nargs) !== false) {
                        // nargs format = '-f a b c'
                        // should be truthy even if: flags.nargs[key] === 0
                        i = eatNargs(i, key, args);
                    }
                    else {
                        next = args[i + 1];
                        if (next !== undefined && (!/^(-|--)[^-]/.test(next) ||
                            next.match(negative)) &&
                            !checkAllAliases(key, flags.bools) &&
                            !checkAllAliases(key, flags.counts)) {
                            setArg(key, next);
                            i++;
                        }
                        else if (/^(true|false)$/.test(next)) {
                            setArg(key, next);
                            i++;
                        }
                        else {
                            setArg(key, defaultValue(key));
                        }
                    }
                }
            }
            else if (arg.match(/^-[0-9]$/) &&
                arg.match(negative) &&
                checkAllAliases(arg.slice(1), flags.bools)) {
                // single-digit boolean alias, e.g: xargs -0
                key = arg.slice(1);
                setArg(key, defaultValue(key));
            }
            else if (arg === '--') {
                notFlags = args.slice(i + 1);
                break;
            }
            else if (configuration['halt-at-non-option']) {
                notFlags = args.slice(i);
                break;
            }
            else {
                pushPositional(arg);
            }
        }
        // order of precedence:
        // 1. command line arg
        // 2. value from env var
        // 3. value from config file
        // 4. value from config objects
        // 5. configured default value
        applyEnvVars(argv, true); // special case: check env vars that point to config file
        applyEnvVars(argv, false);
        setConfig(argv);
        setConfigObjects();
        applyDefaultsAndAliases(argv, flags.aliases, defaults, true);
        applyCoercions(argv);
        if (configuration['set-placeholder-key'])
            setPlaceholderKeys(argv);
        // for any counts either not in args or without an explicit default, set to 0
        Object.keys(flags.counts).forEach(function (key) {
            if (!hasKey(argv, key.split('.')))
                setArg(key, 0);
        });
        // '--' defaults to undefined.
        if (notFlagsOption && notFlags.length)
            argv[notFlagsArgv] = [];
        notFlags.forEach(function (key) {
            argv[notFlagsArgv].push(key);
        });
        if (configuration['camel-case-expansion'] && configuration['strip-dashed']) {
            Object.keys(argv).filter(key => key !== '--' && key.includes('-')).forEach(key => {
                delete argv[key];
            });
        }
        if (configuration['strip-aliased']) {
            [].concat(...Object.keys(aliases).map(k => aliases[k])).forEach(alias => {
                if (configuration['camel-case-expansion'] && alias.includes('-')) {
                    delete argv[alias.split('.').map(prop => camelCase(prop)).join('.')];
                }
                delete argv[alias];
            });
        }
        // Push argument into positional array, applying numeric coercion:
        function pushPositional(arg) {
            const maybeCoercedNumber = maybeCoerceNumber('_', arg);
            if (typeof maybeCoercedNumber === 'string' || typeof maybeCoercedNumber === 'number') {
                argv._.push(maybeCoercedNumber);
            }
        }
        // how many arguments should we consume, based
        // on the nargs option?
        function eatNargs(i, key, args, argAfterEqualSign) {
            let ii;
            let toEat = checkAllAliases(key, flags.nargs);
            // NaN has a special meaning for the array type, indicating that one or
            // more values are expected.
            toEat = typeof toEat !== 'number' || isNaN(toEat) ? 1 : toEat;
            if (toEat === 0) {
                if (!isUndefined(argAfterEqualSign)) {
                    error = Error(__('Argument unexpected for: %s', key));
                }
                setArg(key, defaultValue(key));
                return i;
            }
            let available = isUndefined(argAfterEqualSign) ? 0 : 1;
            if (configuration['nargs-eats-options']) {
                // classic behavior, yargs eats positional and dash arguments.
                if (args.length - (i + 1) + available < toEat) {
                    error = Error(__('Not enough arguments following: %s', key));
                }
                available = toEat;
            }
            else {
                // nargs will not consume flag arguments, e.g., -abc, --foo,
                // and terminates when one is observed.
                for (ii = i + 1; ii < args.length; ii++) {
                    if (!args[ii].match(/^-[^0-9]/) || args[ii].match(negative) || isUnknownOptionAsArg(args[ii]))
                        available++;
                    else
                        break;
                }
                if (available < toEat)
                    error = Error(__('Not enough arguments following: %s', key));
            }
            let consumed = Math.min(available, toEat);
            if (!isUndefined(argAfterEqualSign) && consumed > 0) {
                setArg(key, argAfterEqualSign);
                consumed--;
            }
            for (ii = i + 1; ii < (consumed + i + 1); ii++) {
                setArg(key, args[ii]);
            }
            return (i + consumed);
        }
        // if an option is an array, eat all non-hyphenated arguments
        // following it... YUM!
        // e.g., --foo apple banana cat becomes ["apple", "banana", "cat"]
        function eatArray(i, key, args, argAfterEqualSign) {
            let argsToSet = [];
            let next = argAfterEqualSign || args[i + 1];
            // If both array and nargs are configured, enforce the nargs count:
            const nargsCount = checkAllAliases(key, flags.nargs);
            if (checkAllAliases(key, flags.bools) && !(/^(true|false)$/.test(next))) {
                argsToSet.push(true);
            }
            else if (isUndefined(next) ||
                (isUndefined(argAfterEqualSign) && /^-/.test(next) && !negative.test(next) && !isUnknownOptionAsArg(next))) {
                // for keys without value ==> argsToSet remains an empty []
                // set user default value, if available
                if (defaults[key] !== undefined) {
                    const defVal = defaults[key];
                    argsToSet = Array.isArray(defVal) ? defVal : [defVal];
                }
            }
            else {
                // value in --option=value is eaten as is
                if (!isUndefined(argAfterEqualSign)) {
                    argsToSet.push(processValue(key, argAfterEqualSign));
                }
                for (let ii = i + 1; ii < args.length; ii++) {
                    if ((!configuration['greedy-arrays'] && argsToSet.length > 0) ||
                        (nargsCount && typeof nargsCount === 'number' && argsToSet.length >= nargsCount))
                        break;
                    next = args[ii];
                    if (/^-/.test(next) && !negative.test(next) && !isUnknownOptionAsArg(next))
                        break;
                    i = ii;
                    argsToSet.push(processValue(key, next));
                }
            }
            // If both array and nargs are configured, create an error if less than
            // nargs positionals were found. NaN has special meaning, indicating
            // that at least one value is required (more are okay).
            if (typeof nargsCount === 'number' && ((nargsCount && argsToSet.length < nargsCount) ||
                (isNaN(nargsCount) && argsToSet.length === 0))) {
                error = Error(__('Not enough arguments following: %s', key));
            }
            setArg(key, argsToSet);
            return i;
        }
        function setArg(key, val) {
            if (/-/.test(key) && configuration['camel-case-expansion']) {
                const alias = key.split('.').map(function (prop) {
                    return camelCase(prop);
                }).join('.');
                addNewAlias(key, alias);
            }
            const value = processValue(key, val);
            const splitKey = key.split('.');
            setKey(argv, splitKey, value);
            // handle populating aliases of the full key
            if (flags.aliases[key]) {
                flags.aliases[key].forEach(function (x) {
                    const keyProperties = x.split('.');
                    setKey(argv, keyProperties, value);
                });
            }
            // handle populating aliases of the first element of the dot-notation key
            if (splitKey.length > 1 && configuration['dot-notation']) {
                (flags.aliases[splitKey[0]] || []).forEach(function (x) {
                    let keyProperties = x.split('.');
                    // expand alias with nested objects in key
                    const a = [].concat(splitKey);
                    a.shift(); // nuke the old key.
                    keyProperties = keyProperties.concat(a);
                    // populate alias only if is not already an alias of the full key
                    // (already populated above)
                    if (!(flags.aliases[key] || []).includes(keyProperties.join('.'))) {
                        setKey(argv, keyProperties, value);
                    }
                });
            }
            // Set normalize getter and setter when key is in 'normalize' but isn't an array
            if (checkAllAliases(key, flags.normalize) && !checkAllAliases(key, flags.arrays)) {
                const keys = [key].concat(flags.aliases[key] || []);
                keys.forEach(function (key) {
                    Object.defineProperty(argvReturn, key, {
                        enumerable: true,
                        get() {
                            return val;
                        },
                        set(value) {
                            val = typeof value === 'string' ? mixin$1.normalize(value) : value;
                        }
                    });
                });
            }
        }
        function addNewAlias(key, alias) {
            if (!(flags.aliases[key] && flags.aliases[key].length)) {
                flags.aliases[key] = [alias];
                newAliases[alias] = true;
            }
            if (!(flags.aliases[alias] && flags.aliases[alias].length)) {
                addNewAlias(alias, key);
            }
        }
        function processValue(key, val) {
            // strings may be quoted, clean this up as we assign values.
            if (typeof val === 'string' &&
                (val[0] === "'" || val[0] === '"') &&
                val[val.length - 1] === val[0]) {
                val = val.substring(1, val.length - 1);
            }
            // handle parsing boolean arguments --foo=true --bar false.
            if (checkAllAliases(key, flags.bools) || checkAllAliases(key, flags.counts)) {
                if (typeof val === 'string')
                    val = val === 'true';
            }
            let value = Array.isArray(val)
                ? val.map(function (v) { return maybeCoerceNumber(key, v); })
                : maybeCoerceNumber(key, val);
            // increment a count given as arg (either no value or value parsed as boolean)
            if (checkAllAliases(key, flags.counts) && (isUndefined(value) || typeof value === 'boolean')) {
                value = increment();
            }
            // Set normalized value when key is in 'normalize' and in 'arrays'
            if (checkAllAliases(key, flags.normalize) && checkAllAliases(key, flags.arrays)) {
                if (Array.isArray(val))
                    value = val.map((val) => { return mixin$1.normalize(val); });
                else
                    value = mixin$1.normalize(val);
            }
            return value;
        }
        function maybeCoerceNumber(key, value) {
            if (!configuration['parse-positional-numbers'] && key === '_')
                return value;
            if (!checkAllAliases(key, flags.strings) && !checkAllAliases(key, flags.bools) && !Array.isArray(value)) {
                const shouldCoerceNumber = looksLikeNumber(value) && configuration['parse-numbers'] && (Number.isSafeInteger(Math.floor(parseFloat(`${value}`))));
                if (shouldCoerceNumber || (!isUndefined(value) && checkAllAliases(key, flags.numbers))) {
                    value = Number(value);
                }
            }
            return value;
        }
        // set args from config.json file, this should be
        // applied last so that defaults can be applied.
        function setConfig(argv) {
            const configLookup = Object.create(null);
            // expand defaults/aliases, in-case any happen to reference
            // the config.json file.
            applyDefaultsAndAliases(configLookup, flags.aliases, defaults);
            Object.keys(flags.configs).forEach(function (configKey) {
                const configPath = argv[configKey] || configLookup[configKey];
                if (configPath) {
                    try {
                        let config = null;
                        const resolvedConfigPath = mixin$1.resolve(mixin$1.cwd(), configPath);
                        const resolveConfig = flags.configs[configKey];
                        if (typeof resolveConfig === 'function') {
                            try {
                                config = resolveConfig(resolvedConfigPath);
                            }
                            catch (e) {
                                config = e;
                            }
                            if (config instanceof Error) {
                                error = config;
                                return;
                            }
                        }
                        else {
                            config = mixin$1.require(resolvedConfigPath);
                        }
                        setConfigObject(config);
                    }
                    catch (ex) {
                        // Deno will receive a PermissionDenied error if an attempt is
                        // made to load config without the --allow-read flag:
                        if (ex.name === 'PermissionDenied')
                            error = ex;
                        else if (argv[configKey])
                            error = Error(__('Invalid JSON config file: %s', configPath));
                    }
                }
            });
        }
        // set args from config object.
        // it recursively checks nested objects.
        function setConfigObject(config, prev) {
            Object.keys(config).forEach(function (key) {
                const value = config[key];
                const fullKey = prev ? prev + '.' + key : key;
                // if the value is an inner object and we have dot-notation
                // enabled, treat inner objects in config the same as
                // heavily nested dot notations (foo.bar.apple).
                if (typeof value === 'object' && value !== null && !Array.isArray(value) && configuration['dot-notation']) {
                    // if the value is an object but not an array, check nested object
                    setConfigObject(value, fullKey);
                }
                else {
                    // setting arguments via CLI takes precedence over
                    // values within the config file.
                    if (!hasKey(argv, fullKey.split('.')) || (checkAllAliases(fullKey, flags.arrays) && configuration['combine-arrays'])) {
                        setArg(fullKey, value);
                    }
                }
            });
        }
        // set all config objects passed in opts
        function setConfigObjects() {
            if (typeof configObjects !== 'undefined') {
                configObjects.forEach(function (configObject) {
                    setConfigObject(configObject);
                });
            }
        }
        function applyEnvVars(argv, configOnly) {
            if (typeof envPrefix === 'undefined')
                return;
            const prefix = typeof envPrefix === 'string' ? envPrefix : '';
            const env = mixin$1.env();
            Object.keys(env).forEach(function (envVar) {
                if (prefix === '' || envVar.lastIndexOf(prefix, 0) === 0) {
                    // get array of nested keys and convert them to camel case
                    const keys = envVar.split('__').map(function (key, i) {
                        if (i === 0) {
                            key = key.substring(prefix.length);
                        }
                        return camelCase(key);
                    });
                    if (((configOnly && flags.configs[keys.join('.')]) || !configOnly) && !hasKey(argv, keys)) {
                        setArg(keys.join('.'), env[envVar]);
                    }
                }
            });
        }
        function applyCoercions(argv) {
            let coerce;
            const applied = new Set();
            Object.keys(argv).forEach(function (key) {
                if (!applied.has(key)) { // If we haven't already coerced this option via one of its aliases
                    coerce = checkAllAliases(key, flags.coercions);
                    if (typeof coerce === 'function') {
                        try {
                            const value = maybeCoerceNumber(key, coerce(argv[key]));
                            ([].concat(flags.aliases[key] || [], key)).forEach(ali => {
                                applied.add(ali);
                                argv[ali] = value;
                            });
                        }
                        catch (err) {
                            error = err;
                        }
                    }
                }
            });
        }
        function setPlaceholderKeys(argv) {
            flags.keys.forEach((key) => {
                // don't set placeholder keys for dot notation options 'foo.bar'.
                if (~key.indexOf('.'))
                    return;
                if (typeof argv[key] === 'undefined')
                    argv[key] = undefined;
            });
            return argv;
        }
        function applyDefaultsAndAliases(obj, aliases, defaults, canLog = false) {
            Object.keys(defaults).forEach(function (key) {
                if (!hasKey(obj, key.split('.'))) {
                    setKey(obj, key.split('.'), defaults[key]);
                    if (canLog)
                        defaulted[key] = true;
                    (aliases[key] || []).forEach(function (x) {
                        if (hasKey(obj, x.split('.')))
                            return;
                        setKey(obj, x.split('.'), defaults[key]);
                    });
                }
            });
        }
        function hasKey(obj, keys) {
            let o = obj;
            if (!configuration['dot-notation'])
                keys = [keys.join('.')];
            keys.slice(0, -1).forEach(function (key) {
                o = (o[key] || {});
            });
            const key = keys[keys.length - 1];
            if (typeof o !== 'object')
                return false;
            else
                return key in o;
        }
        function setKey(obj, keys, value) {
            let o = obj;
            if (!configuration['dot-notation'])
                keys = [keys.join('.')];
            keys.slice(0, -1).forEach(function (key) {
                // TODO(bcoe): in the next major version of yargs, switch to
                // Object.create(null) for dot notation:
                key = sanitizeKey(key);
                if (typeof o === 'object' && o[key] === undefined) {
                    o[key] = {};
                }
                if (typeof o[key] !== 'object' || Array.isArray(o[key])) {
                    // ensure that o[key] is an array, and that the last item is an empty object.
                    if (Array.isArray(o[key])) {
                        o[key].push({});
                    }
                    else {
                        o[key] = [o[key], {}];
                    }
                    // we want to update the empty object at the end of the o[key] array, so set o to that object
                    o = o[key][o[key].length - 1];
                }
                else {
                    o = o[key];
                }
            });
            // TODO(bcoe): in the next major version of yargs, switch to
            // Object.create(null) for dot notation:
            const key = sanitizeKey(keys[keys.length - 1]);
            const isTypeArray = checkAllAliases(keys.join('.'), flags.arrays);
            const isValueArray = Array.isArray(value);
            let duplicate = configuration['duplicate-arguments-array'];
            // nargs has higher priority than duplicate
            if (!duplicate && checkAllAliases(key, flags.nargs)) {
                duplicate = true;
                if ((!isUndefined(o[key]) && flags.nargs[key] === 1) || (Array.isArray(o[key]) && o[key].length === flags.nargs[key])) {
                    o[key] = undefined;
                }
            }
            if (value === increment()) {
                o[key] = increment(o[key]);
            }
            else if (Array.isArray(o[key])) {
                if (duplicate && isTypeArray && isValueArray) {
                    o[key] = configuration['flatten-duplicate-arrays'] ? o[key].concat(value) : (Array.isArray(o[key][0]) ? o[key] : [o[key]]).concat([value]);
                }
                else if (!duplicate && Boolean(isTypeArray) === Boolean(isValueArray)) {
                    o[key] = value;
                }
                else {
                    o[key] = o[key].concat([value]);
                }
            }
            else if (o[key] === undefined && isTypeArray) {
                o[key] = isValueArray ? value : [value];
            }
            else if (duplicate && !(o[key] === undefined ||
                checkAllAliases(key, flags.counts) ||
                checkAllAliases(key, flags.bools))) {
                o[key] = [o[key], value];
            }
            else {
                o[key] = value;
            }
        }
        // extend the aliases list with inferred aliases.
        function extendAliases(...args) {
            args.forEach(function (obj) {
                Object.keys(obj || {}).forEach(function (key) {
                    // short-circuit if we've already added a key
                    // to the aliases array, for example it might
                    // exist in both 'opts.default' and 'opts.key'.
                    if (flags.aliases[key])
                        return;
                    flags.aliases[key] = [].concat(aliases[key] || []);
                    // For "--option-name", also set argv.optionName
                    flags.aliases[key].concat(key).forEach(function (x) {
                        if (/-/.test(x) && configuration['camel-case-expansion']) {
                            const c = camelCase(x);
                            if (c !== key && flags.aliases[key].indexOf(c) === -1) {
                                flags.aliases[key].push(c);
                                newAliases[c] = true;
                            }
                        }
                    });
                    // For "--optionName", also set argv['option-name']
                    flags.aliases[key].concat(key).forEach(function (x) {
                        if (x.length > 1 && /[A-Z]/.test(x) && configuration['camel-case-expansion']) {
                            const c = decamelize(x, '-');
                            if (c !== key && flags.aliases[key].indexOf(c) === -1) {
                                flags.aliases[key].push(c);
                                newAliases[c] = true;
                            }
                        }
                    });
                    flags.aliases[key].forEach(function (x) {
                        flags.aliases[x] = [key].concat(flags.aliases[key].filter(function (y) {
                            return x !== y;
                        }));
                    });
                });
            });
        }
        function checkAllAliases(key, flag) {
            const toCheck = [].concat(flags.aliases[key] || [], key);
            const keys = Object.keys(flag);
            const setAlias = toCheck.find(key => keys.includes(key));
            return setAlias ? flag[setAlias] : false;
        }
        function hasAnyFlag(key) {
            const flagsKeys = Object.keys(flags);
            const toCheck = [].concat(flagsKeys.map(k => flags[k]));
            return toCheck.some(function (flag) {
                return Array.isArray(flag) ? flag.includes(key) : flag[key];
            });
        }
        function hasFlagsMatching(arg, ...patterns) {
            const toCheck = [].concat(...patterns);
            return toCheck.some(function (pattern) {
                const match = arg.match(pattern);
                return match && hasAnyFlag(match[1]);
            });
        }
        // based on a simplified version of the short flag group parsing logic
        function hasAllShortFlags(arg) {
            // if this is a negative number, or doesn't start with a single hyphen, it's not a short flag group
            if (arg.match(negative) || !arg.match(/^-[^-]+/)) {
                return false;
            }
            let hasAllFlags = true;
            let next;
            const letters = arg.slice(1).split('');
            for (let j = 0; j < letters.length; j++) {
                next = arg.slice(j + 2);
                if (!hasAnyFlag(letters[j])) {
                    hasAllFlags = false;
                    break;
                }
                if ((letters[j + 1] && letters[j + 1] === '=') ||
                    next === '-' ||
                    (/[A-Za-z]/.test(letters[j]) && /^-?\d+(\.\d*)?(e-?\d+)?$/.test(next)) ||
                    (letters[j + 1] && letters[j + 1].match(/\W/))) {
                    break;
                }
            }
            return hasAllFlags;
        }
        function isUnknownOptionAsArg(arg) {
            return configuration['unknown-options-as-args'] && isUnknownOption(arg);
        }
        function isUnknownOption(arg) {
            arg = arg.replace(/^-{3,}/, '--');
            // ignore negative numbers
            if (arg.match(negative)) {
                return false;
            }
            // if this is a short option group and all of them are configured, it isn't unknown
            if (hasAllShortFlags(arg)) {
                return false;
            }
            // e.g. '--count=2'
            const flagWithEquals = /^-+([^=]+?)=[\s\S]*$/;
            // e.g. '-a' or '--arg'
            const normalFlag = /^-+([^=]+?)$/;
            // e.g. '-a-'
            const flagEndingInHyphen = /^-+([^=]+?)-$/;
            // e.g. '-abc123'
            const flagEndingInDigits = /^-+([^=]+?\d+)$/;
            // e.g. '-a/usr/local'
            const flagEndingInNonWordCharacters = /^-+([^=]+?)\W+.*$/;
            // check the different types of flag styles, including negatedBoolean, a pattern defined near the start of the parse method
            return !hasFlagsMatching(arg, flagWithEquals, negatedBoolean, normalFlag, flagEndingInHyphen, flagEndingInDigits, flagEndingInNonWordCharacters);
        }
        // make a best effort to pick a default value
        // for an option based on name and type.
        function defaultValue(key) {
            if (!checkAllAliases(key, flags.bools) &&
                !checkAllAliases(key, flags.counts) &&
                `${key}` in defaults) {
                return defaults[key];
            }
            else {
                return defaultForType(guessType(key));
            }
        }
        // return a default value, given the type of a flag.,
        function defaultForType(type) {
            const def = {
                [DefaultValuesForTypeKey.BOOLEAN]: true,
                [DefaultValuesForTypeKey.STRING]: '',
                [DefaultValuesForTypeKey.NUMBER]: undefined,
                [DefaultValuesForTypeKey.ARRAY]: []
            };
            return def[type];
        }
        // given a flag, enforce a default type.
        function guessType(key) {
            let type = DefaultValuesForTypeKey.BOOLEAN;
            if (checkAllAliases(key, flags.strings))
                type = DefaultValuesForTypeKey.STRING;
            else if (checkAllAliases(key, flags.numbers))
                type = DefaultValuesForTypeKey.NUMBER;
            else if (checkAllAliases(key, flags.bools))
                type = DefaultValuesForTypeKey.BOOLEAN;
            else if (checkAllAliases(key, flags.arrays))
                type = DefaultValuesForTypeKey.ARRAY;
            return type;
        }
        function isUndefined(num) {
            return num === undefined;
        }
        // check user configuration settings for inconsistencies
        function checkConfiguration() {
            // count keys should not be set as array/narg
            Object.keys(flags.counts).find(key => {
                if (checkAllAliases(key, flags.arrays)) {
                    error = Error(__('Invalid configuration: %s, opts.count excludes opts.array.', key));
                    return true;
                }
                else if (checkAllAliases(key, flags.nargs)) {
                    error = Error(__('Invalid configuration: %s, opts.count excludes opts.narg.', key));
                    return true;
                }
                return false;
            });
        }
        return {
            aliases: Object.assign({}, flags.aliases),
            argv: Object.assign(argvReturn, argv),
            configuration: configuration,
            defaulted: Object.assign({}, defaulted),
            error: error,
            newAliases: Object.assign({}, newAliases)
        };
    }
}
// if any aliases reference each other, we should
// merge them together.
function combineAliases(aliases) {
    const aliasArrays = [];
    const combined = Object.create(null);
    let change = true;
    // turn alias lookup hash {key: ['alias1', 'alias2']} into
    // a simple array ['key', 'alias1', 'alias2']
    Object.keys(aliases).forEach(function (key) {
        aliasArrays.push([].concat(aliases[key], key));
    });
    // combine arrays until zero changes are
    // made in an iteration.
    while (change) {
        change = false;
        for (let i = 0; i < aliasArrays.length; i++) {
            for (let ii = i + 1; ii < aliasArrays.length; ii++) {
                const intersect = aliasArrays[i].filter(function (v) {
                    return aliasArrays[ii].indexOf(v) !== -1;
                });
                if (intersect.length) {
                    aliasArrays[i] = aliasArrays[i].concat(aliasArrays[ii]);
                    aliasArrays.splice(ii, 1);
                    change = true;
                    break;
                }
            }
        }
    }
    // map arrays back to the hash-lookup (de-dupe while
    // we're at it).
    aliasArrays.forEach(function (aliasArray) {
        aliasArray = aliasArray.filter(function (v, i, self) {
            return self.indexOf(v) === i;
        });
        const lastAlias = aliasArray.pop();
        if (lastAlias !== undefined && typeof lastAlias === 'string') {
            combined[lastAlias] = aliasArray;
        }
    });
    return combined;
}
// this function should only be called when a count is given as an arg
// it is NOT called to set a default value
// thus we can start the count at 1 instead of 0
function increment(orig) {
    return orig !== undefined ? orig + 1 : 1;
}
// TODO(bcoe): in the next major version of yargs, switch to
// Object.create(null) for dot notation:
function sanitizeKey(key) {
    if (key === '__proto__')
        return '___proto___';
    return key;
}

/**
 * @fileoverview Main entrypoint for libraries using yargs-parser in Node.js
 * CJS and ESM environments.
 *
 * @license
 * Copyright (c) 2016, Contributors
 * SPDX-License-Identifier: ISC
 */
// See https://github.com/yargs/yargs-parser#supported-nodejs-versions for our
// version support policy. The YARGS_MIN_NODE_VERSION is used for testing only.
const minNodeVersion = (process && process.env && process.env.YARGS_MIN_NODE_VERSION)
    ? Number(process.env.YARGS_MIN_NODE_VERSION)
    : 10;
if (process && process.version) {
    const major = Number(process.version.match(/v([^.]+)/)[1]);
    if (major < minNodeVersion) {
        throw Error(`yargs parser supports a minimum Node.js version of ${minNodeVersion}. Read our version support policy: https://github.com/yargs/yargs-parser#supported-nodejs-versions`);
    }
}
// Creates a yargs-parser instance using Node.js standard libraries:
const env = process ? process.env : {};
const parser = new YargsParser({
    cwd: process.cwd,
    env: () => {
        return env;
    },
    format,
    normalize,
    resolve,
    // TODO: figure  out a  way to combine ESM and CJS coverage, such  that
    // we can exercise all the lines below:
    require: (path) => {
        if (typeof require !== 'undefined') {
            return require(path);
        }
        else if (path.match(/\.json$/)) {
            return readFileSync(path, 'utf8');
        }
        else {
            throw Error('only .json config files are supported in ESM');
        }
    }
});
const yargsParser = function Parser(args, opts) {
    const result = parser.parse(args.slice(), opts);
    return result.argv;
};
yargsParser.detailed = function (args, opts) {
    return parser.parse(args.slice(), opts);
};
yargsParser.camelCase = camelCase;
yargsParser.decamelize = decamelize;
yargsParser.looksLikeNumber = looksLikeNumber;

const align = {
    right: alignRight,
    center: alignCenter
};
const top = 0;
const right = 1;
const bottom = 2;
const left = 3;
class UI {
    constructor(opts) {
        var _a;
        this.width = opts.width;
        this.wrap = (_a = opts.wrap) !== null && _a !== void 0 ? _a : true;
        this.rows = [];
    }
    span(...args) {
        const cols = this.div(...args);
        cols.span = true;
    }
    resetOutput() {
        this.rows = [];
    }
    div(...args) {
        if (args.length === 0) {
            this.div('');
        }
        if (this.wrap && this.shouldApplyLayoutDSL(...args) && typeof args[0] === 'string') {
            return this.applyLayoutDSL(args[0]);
        }
        const cols = args.map(arg => {
            if (typeof arg === 'string') {
                return this.colFromString(arg);
            }
            return arg;
        });
        this.rows.push(cols);
        return cols;
    }
    shouldApplyLayoutDSL(...args) {
        return args.length === 1 && typeof args[0] === 'string' &&
            /[\t\n]/.test(args[0]);
    }
    applyLayoutDSL(str) {
        const rows = str.split('\n').map(row => row.split('\t'));
        let leftColumnWidth = 0;
        // simple heuristic for layout, make sure the
        // second column lines up along the left-hand.
        // don't allow the first column to take up more
        // than 50% of the screen.
        rows.forEach(columns => {
            if (columns.length > 1 && mixin.stringWidth(columns[0]) > leftColumnWidth) {
                leftColumnWidth = Math.min(Math.floor(this.width * 0.5), mixin.stringWidth(columns[0]));
            }
        });
        // generate a table:
        //  replacing ' ' with padding calculations.
        //  using the algorithmically generated width.
        rows.forEach(columns => {
            this.div(...columns.map((r, i) => {
                return {
                    text: r.trim(),
                    padding: this.measurePadding(r),
                    width: (i === 0 && columns.length > 1) ? leftColumnWidth : undefined
                };
            }));
        });
        return this.rows[this.rows.length - 1];
    }
    colFromString(text) {
        return {
            text,
            padding: this.measurePadding(text)
        };
    }
    measurePadding(str) {
        // measure padding without ansi escape codes
        const noAnsi = mixin.stripAnsi(str);
        return [0, noAnsi.match(/\s*$/)[0].length, 0, noAnsi.match(/^\s*/)[0].length];
    }
    toString() {
        const lines = [];
        this.rows.forEach(row => {
            this.rowToString(row, lines);
        });
        // don't display any lines with the
        // hidden flag set.
        return lines
            .filter(line => !line.hidden)
            .map(line => line.text)
            .join('\n');
    }
    rowToString(row, lines) {
        this.rasterize(row).forEach((rrow, r) => {
            let str = '';
            rrow.forEach((col, c) => {
                const { width } = row[c]; // the width with padding.
                const wrapWidth = this.negatePadding(row[c]); // the width without padding.
                let ts = col; // temporary string used during alignment/padding.
                if (wrapWidth > mixin.stringWidth(col)) {
                    ts += ' '.repeat(wrapWidth - mixin.stringWidth(col));
                }
                // align the string within its column.
                if (row[c].align && row[c].align !== 'left' && this.wrap) {
                    const fn = align[row[c].align];
                    ts = fn(ts, wrapWidth);
                    if (mixin.stringWidth(ts) < wrapWidth) {
                        ts += ' '.repeat((width || 0) - mixin.stringWidth(ts) - 1);
                    }
                }
                // apply border and padding to string.
                const padding = row[c].padding || [0, 0, 0, 0];
                if (padding[left]) {
                    str += ' '.repeat(padding[left]);
                }
                str += addBorder(row[c], ts, '| ');
                str += ts;
                str += addBorder(row[c], ts, ' |');
                if (padding[right]) {
                    str += ' '.repeat(padding[right]);
                }
                // if prior row is span, try to render the
                // current row on the prior line.
                if (r === 0 && lines.length > 0) {
                    str = this.renderInline(str, lines[lines.length - 1]);
                }
            });
            // remove trailing whitespace.
            lines.push({
                text: str.replace(/ +$/, ''),
                span: row.span
            });
        });
        return lines;
    }
    // if the full 'source' can render in
    // the target line, do so.
    renderInline(source, previousLine) {
        const match = source.match(/^ */);
        const leadingWhitespace = match ? match[0].length : 0;
        const target = previousLine.text;
        const targetTextWidth = mixin.stringWidth(target.trimRight());
        if (!previousLine.span) {
            return source;
        }
        // if we're not applying wrapping logic,
        // just always append to the span.
        if (!this.wrap) {
            previousLine.hidden = true;
            return target + source;
        }
        if (leadingWhitespace < targetTextWidth) {
            return source;
        }
        previousLine.hidden = true;
        return target.trimRight() + ' '.repeat(leadingWhitespace - targetTextWidth) + source.trimLeft();
    }
    rasterize(row) {
        const rrows = [];
        const widths = this.columnWidths(row);
        let wrapped;
        // word wrap all columns, and create
        // a data-structure that is easy to rasterize.
        row.forEach((col, c) => {
            // leave room for left and right padding.
            col.width = widths[c];
            if (this.wrap) {
                wrapped = mixin.wrap(col.text, this.negatePadding(col), { hard: true }).split('\n');
            }
            else {
                wrapped = col.text.split('\n');
            }
            if (col.border) {
                wrapped.unshift('.' + '-'.repeat(this.negatePadding(col) + 2) + '.');
                wrapped.push("'" + '-'.repeat(this.negatePadding(col) + 2) + "'");
            }
            // add top and bottom padding.
            if (col.padding) {
                wrapped.unshift(...new Array(col.padding[top] || 0).fill(''));
                wrapped.push(...new Array(col.padding[bottom] || 0).fill(''));
            }
            wrapped.forEach((str, r) => {
                if (!rrows[r]) {
                    rrows.push([]);
                }
                const rrow = rrows[r];
                for (let i = 0; i < c; i++) {
                    if (rrow[i] === undefined) {
                        rrow.push('');
                    }
                }
                rrow.push(str);
            });
        });
        return rrows;
    }
    negatePadding(col) {
        let wrapWidth = col.width || 0;
        if (col.padding) {
            wrapWidth -= (col.padding[left] || 0) + (col.padding[right] || 0);
        }
        if (col.border) {
            wrapWidth -= 4;
        }
        return wrapWidth;
    }
    columnWidths(row) {
        if (!this.wrap) {
            return row.map(col => {
                return col.width || mixin.stringWidth(col.text);
            });
        }
        let unset = row.length;
        let remainingWidth = this.width;
        // column widths can be set in config.
        const widths = row.map(col => {
            if (col.width) {
                unset--;
                remainingWidth -= col.width;
                return col.width;
            }
            return undefined;
        });
        // any unset widths should be calculated.
        const unsetWidth = unset ? Math.floor(remainingWidth / unset) : 0;
        return widths.map((w, i) => {
            if (w === undefined) {
                return Math.max(unsetWidth, _minWidth(row[i]));
            }
            return w;
        });
    }
}
function addBorder(col, ts, style) {
    if (col.border) {
        if (/[.']-+[.']/.test(ts)) {
            return '';
        }
        if (ts.trim().length !== 0) {
            return style;
        }
        return '  ';
    }
    return '';
}
// calculates the minimum width of
// a column, based on padding preferences.
function _minWidth(col) {
    const padding = col.padding || [];
    const minWidth = 1 + (padding[left] || 0) + (padding[right] || 0);
    if (col.border) {
        return minWidth + 4;
    }
    return minWidth;
}
function getWindowWidth() {
    /* istanbul ignore next: depends on terminal */
    if (typeof process === 'object' && process.stdout && process.stdout.columns) {
        return process.stdout.columns;
    }
    return 80;
}
function alignRight(str, width) {
    str = str.trim();
    const strWidth = mixin.stringWidth(str);
    if (strWidth < width) {
        return ' '.repeat(width - strWidth) + str;
    }
    return str;
}
function alignCenter(str, width) {
    str = str.trim();
    const strWidth = mixin.stringWidth(str);
    /* istanbul ignore next */
    if (strWidth >= width) {
        return str;
    }
    return ' '.repeat((width - strWidth) >> 1) + str;
}
let mixin;
function cliui(opts, _mixin) {
    mixin = _mixin;
    return new UI({
        width: (opts === null || opts === void 0 ? void 0 : opts.width) || getWindowWidth(),
        wrap: opts === null || opts === void 0 ? void 0 : opts.wrap
    });
}

// Minimal replacement for ansi string helpers "wrap-ansi" and "strip-ansi".
// to facilitate ESM and Deno modules.
// TODO: look at porting https://www.npmjs.com/package/wrap-ansi to ESM.
// The npm application
// Copyright (c) npm, Inc. and Contributors
// Licensed on the terms of The Artistic License 2.0
// See: https://github.com/npm/cli/blob/4c65cd952bc8627811735bea76b9b110cc4fc80e/lib/utils/ansi-trim.js
const ansi = new RegExp('\x1b(?:\\[(?:\\d+[ABCDEFGJKSTm]|\\d+;\\d+[Hfm]|' +
    '\\d+;\\d+;\\d+m|6n|s|u|\\?25[lh])|\\w)', 'g');
function stripAnsi(str) {
    return str.replace(ansi, '');
}
function wrap(str, width) {
    const [start, end] = str.match(ansi) || ['', ''];
    str = stripAnsi(str);
    let wrapped = '';
    for (let i = 0; i < str.length; i++) {
        if (i !== 0 && (i % width) === 0) {
            wrapped += '\n';
        }
        wrapped += str.charAt(i);
    }
    if (start && end) {
        wrapped = `${start}${wrapped}${end}`;
    }
    return wrapped;
}

// Bootstrap cliui with CommonJS dependencies:

function ui (opts) {
  return cliui(opts, {
    stringWidth: (str) => {
      return [...str].length
    },
    stripAnsi,
    wrap
  })
}

function escalade (start, callback) {
	let dir = resolve('.', start);
	let tmp, stats = statSync(dir);

	if (!stats.isDirectory()) {
		dir = dirname(dir);
	}

	while (true) {
		tmp = callback(dir, readdirSync(dir));
		if (tmp) return resolve(dir, tmp);
		dir = dirname(tmp = dir);
		if (tmp === dir) break;
	}
}

var shim$1 = {
    fs: {
        readFileSync,
        writeFile
    },
    format,
    resolve,
    exists: (file) => {
        try {
            return statSync(file).isFile();
        }
        catch (err) {
            return false;
        }
    }
};

let shim;
class Y18N {
    constructor(opts) {
        // configurable options.
        opts = opts || {};
        this.directory = opts.directory || './locales';
        this.updateFiles = typeof opts.updateFiles === 'boolean' ? opts.updateFiles : true;
        this.locale = opts.locale || 'en';
        this.fallbackToLanguage = typeof opts.fallbackToLanguage === 'boolean' ? opts.fallbackToLanguage : true;
        // internal stuff.
        this.cache = Object.create(null);
        this.writeQueue = [];
    }
    __(...args) {
        if (typeof arguments[0] !== 'string') {
            return this._taggedLiteral(arguments[0], ...arguments);
        }
        const str = args.shift();
        let cb = function () { }; // start with noop.
        if (typeof args[args.length - 1] === 'function')
            cb = args.pop();
        cb = cb || function () { }; // noop.
        if (!this.cache[this.locale])
            this._readLocaleFile();
        // we've observed a new string, update the language file.
        if (!this.cache[this.locale][str] && this.updateFiles) {
            this.cache[this.locale][str] = str;
            // include the current directory and locale,
            // since these values could change before the
            // write is performed.
            this._enqueueWrite({
                directory: this.directory,
                locale: this.locale,
                cb
            });
        }
        else {
            cb();
        }
        return shim.format.apply(shim.format, [this.cache[this.locale][str] || str].concat(args));
    }
    __n() {
        const args = Array.prototype.slice.call(arguments);
        const singular = args.shift();
        const plural = args.shift();
        const quantity = args.shift();
        let cb = function () { }; // start with noop.
        if (typeof args[args.length - 1] === 'function')
            cb = args.pop();
        if (!this.cache[this.locale])
            this._readLocaleFile();
        let str = quantity === 1 ? singular : plural;
        if (this.cache[this.locale][singular]) {
            const entry = this.cache[this.locale][singular];
            str = entry[quantity === 1 ? 'one' : 'other'];
        }
        // we've observed a new string, update the language file.
        if (!this.cache[this.locale][singular] && this.updateFiles) {
            this.cache[this.locale][singular] = {
                one: singular,
                other: plural
            };
            // include the current directory and locale,
            // since these values could change before the
            // write is performed.
            this._enqueueWrite({
                directory: this.directory,
                locale: this.locale,
                cb
            });
        }
        else {
            cb();
        }
        // if a %d placeholder is provided, add quantity
        // to the arguments expanded by util.format.
        const values = [str];
        if (~str.indexOf('%d'))
            values.push(quantity);
        return shim.format.apply(shim.format, values.concat(args));
    }
    setLocale(locale) {
        this.locale = locale;
    }
    getLocale() {
        return this.locale;
    }
    updateLocale(obj) {
        if (!this.cache[this.locale])
            this._readLocaleFile();
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                this.cache[this.locale][key] = obj[key];
            }
        }
    }
    _taggedLiteral(parts, ...args) {
        let str = '';
        parts.forEach(function (part, i) {
            const arg = args[i + 1];
            str += part;
            if (typeof arg !== 'undefined') {
                str += '%s';
            }
        });
        return this.__.apply(this, [str].concat([].slice.call(args, 1)));
    }
    _enqueueWrite(work) {
        this.writeQueue.push(work);
        if (this.writeQueue.length === 1)
            this._processWriteQueue();
    }
    _processWriteQueue() {
        const _this = this;
        const work = this.writeQueue[0];
        // destructure the enqueued work.
        const directory = work.directory;
        const locale = work.locale;
        const cb = work.cb;
        const languageFile = this._resolveLocaleFile(directory, locale);
        const serializedLocale = JSON.stringify(this.cache[locale], null, 2);
        shim.fs.writeFile(languageFile, serializedLocale, 'utf-8', function (err) {
            _this.writeQueue.shift();
            if (_this.writeQueue.length > 0)
                _this._processWriteQueue();
            cb(err);
        });
    }
    _readLocaleFile() {
        let localeLookup = {};
        const languageFile = this._resolveLocaleFile(this.directory, this.locale);
        try {
            // When using a bundler such as webpack, readFileSync may not be defined:
            if (shim.fs.readFileSync) {
                localeLookup = JSON.parse(shim.fs.readFileSync(languageFile, 'utf-8'));
            }
        }
        catch (err) {
            if (err instanceof SyntaxError) {
                err.message = 'syntax error in ' + languageFile;
            }
            if (err.code === 'ENOENT')
                localeLookup = {};
            else
                throw err;
        }
        this.cache[this.locale] = localeLookup;
    }
    _resolveLocaleFile(directory, locale) {
        let file = shim.resolve(directory, './', locale + '.json');
        if (this.fallbackToLanguage && !this._fileExistsSync(file) && ~locale.lastIndexOf('_')) {
            // attempt fallback to language only
            const languageFile = shim.resolve(directory, './', locale.split('_')[0] + '.json');
            if (this._fileExistsSync(languageFile))
                file = languageFile;
        }
        return file;
    }
    _fileExistsSync(file) {
        return shim.exists(file);
    }
}
function y18n$1(opts, _shim) {
    shim = _shim;
    const y18n = new Y18N(opts);
    return {
        __: y18n.__.bind(y18n),
        __n: y18n.__n.bind(y18n),
        setLocale: y18n.setLocale.bind(y18n),
        getLocale: y18n.getLocale.bind(y18n),
        updateLocale: y18n.updateLocale.bind(y18n),
        locale: y18n.locale
    };
}

const y18n = (opts) => {
  return y18n$1(opts, shim$1)
};

const REQUIRE_ERROR = 'require is not supported by ESM';
const REQUIRE_DIRECTORY_ERROR = 'loading a directory of commands is not supported yet for ESM';

const mainFilename = fileURLToPath(import.meta.url).split('node_modules')[0];
const __dirname = fileURLToPath(import.meta.url);

({
  assert: {
    notStrictEqual,
    strictEqual
  },
  cliui: ui,
  findUp: escalade,
  getEnv: (key) => {
    return process.env[key]
  },
  inspect,
  getCallerFile: () => {
    throw new YError(REQUIRE_DIRECTORY_ERROR)
  },
  getProcessArgvBin,
  mainFilename: mainFilename || process.cwd(),
  Parser: yargsParser,
  path: {
    basename,
    dirname,
    extname,
    relative,
    resolve
  },
  process: {
    argv: () => process.argv,
    cwd: process.cwd,
    execPath: () => process.execPath,
    exit: process.exit,
    nextTick: process.nextTick,
    stdColumns: typeof process.stdout.columns !== 'undefined' ? process.stdout.columns : null
  },
  readFileSync,
  require: () => {
    throw new YError(REQUIRE_ERROR)
  },
  requireDirectory: () => {
    throw new YError(REQUIRE_DIRECTORY_ERROR)
  },
  stringWidth: (str) => {
    return [...str].length
  },
  y18n: y18n({
    directory: resolve(__dirname, '../../../locales'),
    updateFiles: false
  })
});

function sub(x, offset, len) {
  var result = new Array(len);
  var j = 0;
  var i = offset;
  while(j < len) {
    result[j] = x[i];
    j = j + 1 | 0;
    i = i + 1 | 0;
  }  return result;
}
/* No side effect */

function app(_f, _args) {
  while(true) {
    var args = _args;
    var f = _f;
    var init_arity = f.length;
    var arity = init_arity === 0 ? 1 : init_arity;
    var len = args.length;
    var d = arity - len | 0;
    if (d === 0) {
      return f.apply(null, args);
    }
    if (d >= 0) {
      return (function(f,args){
      return function (x) {
        return app(f, args.concat([x]));
      }
      }(f,args));
    }
    _args = sub(args, arity, -d | 0);
    _f = f.apply(null, sub(args, 0, arity));
    continue ;
  }}

function _1(o, a0) {
  var arity = o.length;
  if (arity === 1) {
    return o(a0);
  } else {
    switch (arity) {
      case 1 :
          return o(a0);
      case 2 :
          return function (param) {
            return o(a0, param);
          };
      case 3 :
          return function (param, param$1) {
            return o(a0, param, param$1);
          };
      case 4 :
          return function (param, param$1, param$2) {
            return o(a0, param, param$1, param$2);
          };
      case 5 :
          return function (param, param$1, param$2, param$3) {
            return o(a0, param, param$1, param$2, param$3);
          };
      case 6 :
          return function (param, param$1, param$2, param$3, param$4) {
            return o(a0, param, param$1, param$2, param$3, param$4);
          };
      case 7 :
          return function (param, param$1, param$2, param$3, param$4, param$5) {
            return o(a0, param, param$1, param$2, param$3, param$4, param$5);
          };
      default:
        return app(o, [a0]);
    }
  }
}
/* No side effect */

var id = {
  contents: 0
};

function create(str) {
  id.contents = id.contents + 1 | 0;
  return str + ("/" + id.contents);
}

function caml_is_extension(e) {
  if (e == null) {
    return false;
  } else {
    return typeof e.RE_EXN_ID === "string";
  }
}
/* No side effect */

function raiseError(str) {
  throw new Error(str);
}
/* No side effect */

function classify(x) {
  var ty = typeof x;
  if (ty === "undefined") {
    return /* JSUndefined */3;
  } else if (x === null) {
    return /* JSNull */2;
  } else if (ty === "number") {
    return {
            TAG: /* JSNumber */0,
            _0: x
          };
  } else if (ty === "string") {
    return {
            TAG: /* JSString */1,
            _0: x
          };
  } else if (ty === "boolean") {
    if (x === true) {
      return /* JSTrue */1;
    } else {
      return /* JSFalse */0;
    }
  } else if (ty === "function") {
    return {
            TAG: /* JSFunction */2,
            _0: x
          };
  } else if (ty === "object") {
    return {
            TAG: /* JSObject */3,
            _0: x
          };
  } else {
    return {
            TAG: /* JSSymbol */4,
            _0: x
          };
  }
}

function test(x, v) {
  switch (v) {
    case /* Undefined */0 :
        return typeof x === "undefined";
    case /* Null */1 :
        return x === null;
    case /* Boolean */2 :
        return typeof x === "boolean";
    case /* Number */3 :
        return typeof x === "number";
    case /* String */4 :
        return typeof x === "string";
    case /* Function */5 :
        return typeof x === "function";
    case /* Object */6 :
        return typeof x === "object";
    case /* Symbol */7 :
        return typeof x === "symbol";
    
  }
}
/* No side effect */

// Generated by ReScript, PLEASE EDIT WITH CARE

function pathsExist(paths) {
  return Promise.all(paths.map(function (path) {
                    return Fs.promises.open(path, "r");
                  })).then(function (filehandles) {
              return Promise.all(filehandles.map(function (fh) {
                              return _1(fh.close, undefined);
                            }));
            });
}

function isStringNotEmpty(x) {
  if (test(x, /* String */4)) {
    return x.length > 0;
  } else {
    return false;
  }
}

function coerceString(x) {
  var x$1 = classify(x);
  if (typeof x$1 === "number" || x$1.TAG !== /* JSString */1) {
    return "";
  } else {
    return x$1._0;
  }
}

function coerceBool(x) {
  var match = classify(x);
  if (typeof match === "number") {
    if (match === /* JSTrue */1) {
      return true;
    } else {
      return false;
    }
  } else if (match.TAG === /* JSString */1) {
    return true;
  } else {
    return false;
  }
}

function throwOnStringEmpty(msg, x) {
  if (isStringNotEmpty(x)) {
    return x;
  } else {
    return raiseError(msg);
  }
}
/* fs Not a pure module */

// Generated by ReScript, PLEASE EDIT WITH CARE

var delimiter = " :: ";

function logColor(name) {
  if (name === "dim") {
    return "\x1b[2m";
  } else if (name === "red") {
    return "\x1b[31m";
  } else if (name === "green") {
    return "\x1b[32m";
  } else {
    return "\x1b[0m";
  }
}

function log(val) {
  return {
          concat: (function (other) {
              return log(val + other.val);
            }),
          replace: (function (old, $$new) {
              return log(val.replace("%" + old, $$new));
            }),
          time: (function () {
              return log(val).replace("time", new Date().toISOString());
            }),
          log: (function (param) {
              var stdout = log(val).time().val;
              console.log(stdout);
              return log(stdout);
            }),
          val: val
        };
}

var logDefault = log([
        "PRP",
        logColor("dim") + "%time",
        logColor("reset") + "prp-node %cmd",
        "%color%msg" + logColor("reset")
      ].join(delimiter));
/* logDefault Not a pure module */

/* CLI */



var CLI = args =>
  yargs(hideBin([...process.argv, args]))
  .scriptName('prp-node')
  .usage('$0 <cmd> [args]')
  .showHelpOnFail(false, "use --help for available options")
  .command({
    command: 'pdf',
    describe: 'Create a pdf from a prp document template.',
    builder: {
      templatedir: {
        type: 'string',
        demandOption: true,
        alias: 't',
        describe: 'Absolute path to a template directory.',
        coerce: 
          arg => 
          throwOnStringEmpty(
            logDefault
            .replace('cmd', 'pdf')
            .replace('msg', 'templatedir : Argument must not be empty.')
            .replace('color', logColor("red"))
            .time().val,
            arg
          )
      },
      datafile: {
        type: 'string',
        demandOption: false,
        alias: 'd',
        describe: 'Absolute path to a data file.',
        coerce: coerceString
      },
      outputdir: {
        type: 'string',
        demandOption: true,
        alias: 'o',
        describe: 'Absolute path to an output directory.',
        coerce: 
          arg => 
          throwOnStringEmpty(
            logDefault
            .replace('cmd', 'pdf')
            .replace('msg', 'outputdir : Argument must not be empty.')
            .replace('color', logColor("red"))
            .time().val,
            arg
          )
      },
      filename: {
        type: 'string',
        demandOption: false,
        alias: 'n',
        describe: 'Name of the output file.',
        default: 'prp.pdf'
      },
      format: {
        type: 'string',
        demandOption: false,
        alias: 'f',
        describe: 'Format of the output file.',
        default: 'A4'
      },
      waitforselector: {
        type: 'string',
        demandOption: false,
        alias: 's',
        describe: 'CSS selector to wait for before pdf creation.',
        default: 'body'
      },
      html: {
        demandOption: false,
        describe: 'Also output html version.',
        coerce: coerceBool
      },
      fonts: {
        type: 'string',
        demandOption: false,
        describe: 'Relative path to the template font directory',
        coerce: coerceString
      },
      images: {
        type: 'string',
        demandOption: false,
        describe: 'Relative path to the template image directory',
        coerce: coerceString
      },
      hostname: {
        type: 'string',
        demandOption: false,
        describe: 'Server hostname with protocol.',
        default: 'http://localhost'
      },
      hostpathname: {
        type: 'string',
        demandOption: false,
        describe: 'Server host pathname',
        default: '/'
      }
    },
    handler: args => 
      logDefault
      .replace('cmd', args._[0])
      .replace('msg', 'creating')
      .replace('color', logColor("green"))
      .log()
  })
  .demandCommand(
    1,
    logDefault
    .replace('cmd', '<cmd>')
    .replace('msg', 'You need at least one command before moving on.')
    .replace('color', logColor("red"))
    .time().val
  )
  .help()
  .argv;

// Generated by ReScript, PLEASE EDIT WITH CARE

function launch$1(prim) {
  return Minikin.default.default.server();
}

var respond = Minikin.Response;
/* respond Not a pure module */

// Generated by ReScript, PLEASE EDIT WITH CARE

function launch(prim) {
  return Playwright.chromium.launch();
}
/* playwright Not a pure module */

// Generated by ReScript, PLEASE EDIT WITH CARE

var JsError = /* @__PURE__ */create("Promise.JsError");

function $$catch(promise, callback) {
  return promise.catch(function (err) {
              return _1(callback, caml_is_extension(err) ? err : ({
                              RE_EXN_ID: JsError,
                              _1: err
                            }));
            });
}
/* No side effect */

// Generated by ReScript, PLEASE EDIT WITH CARE

function buildUrl(host, path, port) {
  return "" + host + ":" + port + path;
}

function pdf(args) {
  var templatePath = Path.join(args.templatedir, "index.html");
  var dataFilePath = args.datafile;
  var pathsToValidate = [
      templatePath,
      dataFilePath
    ].filter(isStringNotEmpty);
  return $$catch(pathsExist(pathsToValidate).then(function (param) {
                              return Promise.all([
                                          launch$1(),
                                          launch()
                                        ]);
                            }).then(function (param) {
                            var browser = param[1];
                            var server = param[0];
                            var url = buildUrl(args.hostname, args.hostpathname, server.port);
                            if (isStringNotEmpty(dataFilePath)) {
                              server.route("GET " + Path.join(args.hostpathname, "data"), (function (param) {
                                      return respond.fromFile(dataFilePath, null, null);
                                    }));
                            }
                            server.route("GET " + args.hostpathname, (function (param) {
                                    return respond.fromFile(templatePath, null, "utf8");
                                  }));
                            server.route("GET *", (function (req) {
                                    return respond.fromFile(Path.join(args.templatedir, req.url), null, "utf8");
                                  }));
                            return browser.newPage().then(function (page) {
                                        return [
                                                browser,
                                                page,
                                                url
                                              ];
                                      });
                          }).then(function (param) {
                          var page = param[1];
                          var browser = param[0];
                          return page.goto(param[2]).then(function (param) {
                                      return [
                                              browser,
                                              page
                                            ];
                                    });
                        }).then(function (param) {
                        var page = param[1];
                        var browser = param[0];
                        return page.waitForSelector(args.waitforselector, {
                                      state: "attached",
                                      timeout: 5000
                                    }).then(function (param) {
                                    return [
                                            browser,
                                            page
                                          ];
                                  });
                      }).then(function (param) {
                      var page = param[1];
                      var browser = param[0];
                      return page.pdf({
                                    path: Path.join(args.outputdir, args.filename),
                                    format: args.format
                                  }).then(function (param) {
                                  return [
                                          browser,
                                          page
                                        ];
                                });
                    }).then(function (param) {
                    var browser = param[0];
                    if (!args.html) {
                      return Promise.resolve(browser);
                    }
                    var page = param[1];
                    var htmlPath = Path.join(args.outputdir, "html");
                    return Promise.all([
                                          args.fonts,
                                          args.images
                                        ].filter(isStringNotEmpty).map(function (x) {
                                          return new Promise((function (resolve, param) {
                                                        return resolve((FsExtra.copy(Path.join(args.templatedir, x), Path.join(htmlPath, x)), undefined));
                                                      }));
                                        })).then(function (param) {
                                    return page.content();
                                  }).then(function (content) {
                                  return FsExtra.outputFile(Path.join(htmlPath, "index.html"), content);
                                }).then(function (param) {
                                return browser;
                              });
                  }).then(function (browser) {
                  return browser.close().then(function (param) {
                              return Promise.resolve(logDefault.replace("cmd", "pdf").replace("msg", "created").replace("color", logColor("green")).time().val);
                            });
                }), (function (e) {
                var logError = logDefault.replace("cmd", "pdf").replace("color", logColor("red")).time();
                var tmp;
                if (e.RE_EXN_ID === JsError) {
                  var msg = e._1.message;
                  tmp = msg !== undefined ? logError.replace("msg", "failed : " + msg).val : logError.replace("msg", "failed : no message available (probably no js error value).").val;
                } else {
                  tmp = logError.replace("msg", "failed : unknown error.").val;
                }
                return Promise.resolve(tmp);
              }));
}

var PDF = {
  pdf: pdf
};
/* Log Not a pure module */

/* App */



/* Commands */

const command = { pdf: PDF.pdf };



/* Helpers */

const arrayFromObject =
  obj =>
  Object.entries(obj).flat();



/* App */

// QUESTION: work with exit codes
// https://nodejs.org/api/process.html#process_exit_codes
const PRPNode = 
  async (args_ = {}, mode = 'import') =>
  {
    const args = CLI(arrayFromObject(args_));
    try {
      const output = await command[args._[0]](args);

      if (mode === 'import') {
        return output

      } else if ( mode === 'cli' ) {
        console.log(output);
      }

      process.exit(0);
  
    } catch(e) {
      const error = 
        logDefault
        .replace('cmd', args._[0])
        .replace('msg', e.message.replace('args._[0]', args._[0]))
        .replace('color', logColor('red'));

      if (mode === 'import') {
        return error.val

      } else if (mode === 'cli') {
        error.log();
      }

      process.exit(1);
    }
  };



PRPNode({}, 'cli');

export { PRPNode };
