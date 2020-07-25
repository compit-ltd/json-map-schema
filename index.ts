/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/**
 * This Maps an object into a schema
 * @param ob Some Object
 * @param fieldMap Optional: an already existing map of <string,string> representing <nested.key, type>
 * @param path for internal use only (recursion)
 * 
 * For arrays - the function uses only the first element to determine the array type
 * (assuming the rest of the elements are of the same type)
 * 
 * @returns A map of <string,string> representing <nested.key, type>
 * The following object:
 * { a: 'a', b: 1, c: new Date(), d: true, e: ['hello'], f: { g: 'g', h: [123] } };
 * would result in:
 * {"a":"string","b":"number","c":"date","d":"boolean","e":"array<string>","f.g":"string","f.h":"array<number>"}
 */

const isObject = (val: any) => !!val && val.constructor === Object;
const isArray = (val: any) => Array.isArray(val);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function mapSchema(ob: any, fieldMap?: Map<string, string>, path = ''): Map<string, string> {
  if (!fieldMap) {
    fieldMap = new Map<string, string>();
  }

  if (fieldMap.has(path)) return fieldMap;
  for (const i in ob) {
    // eslint-disable-next-line no-prototype-builtins
    if (!ob.hasOwnProperty(i)) continue;

    const val = ob[i];
    const type = (typeof val);
    const newPath = `${path}${path.length ? '.' : ''}${i}`;

    // TODO: check array? again - maybe now has items
    if (fieldMap.has(path)) continue;
    switch (type) {
      case ("object"):
        // if (val instanceof Buffer) continue;
        if (val instanceof Date) {
          fieldMap.set(newPath, 'date');
          break;
        }
        else if (isArray(val)) {
          if (val.length) {
            const elem = val[0];
            if (isObject(elem) || isArray(elem)) {
              mapSchema(elem, fieldMap, `${newPath}.0`);
            } else {
              const subType = `<${(typeof elem)}>`;
              fieldMap.set(newPath, `array${subType}`);
            }
          } else {
            fieldMap.set(newPath, `array?`);
          }

        } else if (isObject(val)) {
          mapSchema(val, fieldMap, newPath);
        }
        break;
      case ("string"):
      case ("number"):
      case ("bigint"):
      case ("boolean"):
      case ("symbol"):
        fieldMap.set(newPath, type);
        break;
      case ("function"):
      case ("undefined"):
        break;

      default:
        break;
    }
  }

  return fieldMap;
}

// const obj = { a: 'a', b: 1, c: new Date(), d: true, e: ['hello'], f: { g: 'g', h: [123] } };
// const resMap = mapSchema(obj);
// const res1 = Object.fromEntries(resMap);
// console.log(JSON.stringify(res1));
// // {"a":"string","b":"number","c":"date","d":"boolean","e":"array<string>","f.g":"string","f.h":"array<number>"}

// const otherObj = {m: 'm'};
// const resMap2 = mapSchema(otherObj, resMap);
// const res2 = Object.fromEntries(resMap2);
// console.log(JSON.stringify(res2));
// // {"a":"string","b":"number","c":"date","d":"boolean","e":"array<string>","f.g":"string","f.h":"array<number>","m":"string"}