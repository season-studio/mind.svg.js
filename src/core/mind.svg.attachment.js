const SYMBOL_URL = Symbol("mind.attachment.url");
const SYMBOL_DATA = Symbol("mind.attachment.data");
const SYMBOL_LIST = Symbol("mind.attachment.list");

/**
 * 附件项类
 */
class Attachment {
    constructor (_data) {
        this[SYMBOL_DATA] = _data;
        this[SYMBOL_URL] = (_data instanceof Blob) ? URL.createObjectURL(_data) : undefined;
    }

    /**
     * 释放资源
     */
    release() {
        if (this[SYMBOL_URL]) {
            URL.revokeObjectURL(this[SYMBOL_URL]);
            this[SYMBOL_URL] = undefined;
        }
    }

    /**
     * 获取数据体
     */
    get data() {
        return this[SYMBOL_DATA];
    }

    /**
     * 获取字符串表示
     */
    toString() {
        return (this[SYMBOL_DATA] instanceof Blob) ? this[SYMBOL_URL] : String(this[SYMBOL_DATA]);
    }
}

/**
 * 附件集合类
 */
export class AttachmentCollection {
    constructor() {
        this[SYMBOL_LIST] = {};
    }

    /**
     * 添加、删除、查询附件项
     * @param {*} _name 附件名称，如果给出空的附件名称，则系统会随机生成一个
     * @param {*} _data 附件的数据，如果传入null表示删除对应附件，如果不传入该参数表示查询附件
     * @returns 查询附件时返回附件对象，删除附件时返回当前附件集合实例，添加附件时返回{name,value}组成的新附件标识
     */
    item(_name, _data) {
        if (_data === undefined) {
            return this[SYMBOL_LIST][_name];
        } else if (_data === null) {
            const old = this[SYMBOL_LIST][_name];
            old && old.release();
            delete this[SYMBOL_LIST][_name];
            return this;
        } else {
            _name || (_name = `${Date.now().toString(16)}-${Math.random().toString(16).substr(2, 3)}`);
            const old = this[SYMBOL_LIST][_name];
            old && old.release();
            this[SYMBOL_LIST][_name] = new Attachment(_data);
            return {name: _name, value: this[SYMBOL_LIST][_name]};
        }
    }

    /**
     * 获取附件迭代器
     */
    * items() {
        const list = this[SYMBOL_LIST];
        for (const name in list) {
            yield {name, value:list[name]};
        }
    }

    /**
     * 清空所有附件
     */
    clear() {
        for (const item of this[SYMBOL_LIST]) {
            item.release();
        }
        this[SYMBOL_LIST] = {};
    }
}
