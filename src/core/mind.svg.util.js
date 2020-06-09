/**
 * 为避免参数没有使用的报错定义的空函数
 */
export function unused() {}

// 自定义错误
export const ERROR = {
    INVALID_PARAM(_str) {
        return new Error(`The parameter "${_str}" is invalid!`);
    },
    ILLEGAL_INSTANCE(_str, _type) {
        return new Error(_type ? `"${_str}" is a illegal instance` : `"${_str}" is a illegal instance of (${_type})`);
    }
};
