// 基础类列表
const BasicClassList = {};

/**
 * 对类做扩展
 * @param {*} _className 类的名称
 * @param {*} _extension 扩展项的key-value对象
 */
export function extend(_className, _extension) {
    if (_extension && (_className in BasicClassList)) {
        const classObj = BasicClassList[_className];
        (typeof _extension === "function") && (_extension = _extension(classObj));
        const oldValue = {};
        for (let name in _extension) {
            const value = _extension[name];
            oldValue[name] = classObj[name];
            classObj[name] = value;
        }
        return oldValue;
    }
}

/**
 * 扩展类的原型链
 * @param {*} _className 类的名称
 * @param {*} _extension  扩展项的key-value对象
 */
export function extendPrototype(_className, _extension) {
    if (_className in BasicClassList) {
        const classObj = BasicClassList[_className];
        const prototype = classObj.prototype;
        (typeof _extension === "function") && (_extension = _extension(classObj, prototype));
        const oldValue = {};
        for (let name in _extension) {
            const value = _extension[name];
            oldValue[name] = prototype[name];
            prototype[name] = value;
        }
        return oldValue;
    }
}

/**
 * 扩展类的事件响应函数
 * @param {*} _className 类的名称
 * @param {*} _extension  扩展项的key-value对象
 * @param {*} _exclusive 是否独占改事件
 */
export function extendEventHandler(_className, _extension, _exclusive) {
    if (_extension && (_className in BasicClassList)) {
        const classObj = BasicClassList[_className];
        const prototype = classObj.prototype;
        (typeof _extension === "function") && (_extension = _extension(classObj, prototype));
        const oldValues = {};
        for (let name in _extension) {
            const value = _extension[name];
            const old = (oldValues[name] = prototype[name]);
            if (old && (!_exclusive)) {
                if (old instanceof Array) {
                    old.unshift(value);
                } else {
                    prototype[name] = [value, old];
                }
            } else {
                prototype[name] = value;
            }
        }
        return oldValues;
    }
}

/**
 * 注册可扩展类
 * @param {*} _nameOfMap 类的名称，或者由类名称和类对象组成的数组
 * @param {*} _class 当第1个参数时类名称时，该参数是类对象
 */
export function registryClass(_nameOfMap, _class) {
    if (typeof _nameOfMap === "string") {
        BasicClassList[_nameOfMap] = _class;
    } else if (_nameOfMap) {
        for (let name in _nameOfMap) {
            const value = _nameOfMap[name];
            BasicClassList[name] = value;
        }
    }
}
