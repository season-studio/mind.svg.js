import { isENode } from "./mind.svg.node";

// 对象实例里的事件自动分发处理程序实例名称
const SYMBOL_EVENT_DISPATCHER = Symbol("MindSVG.Event.Dispatcher");

// 阻止事件内部分发的变量符号名称
const SYMBOL_EVENT_BLOCK_SIBLING = Symbol("MindSVG.Event.BlockSibling.Private");

// 对象里的事件处理程序的名称前缀
const NAME_EVENTHANDLER_PREFIX = "_$!";

// 思维导图的标记戳
const ATTR_EVENT_STAMP = "mind-event-stamp";

///////////////////////////////////////////////////////////////////////////////
// 以下定义思维导图事件名称常数

// 请求重新布局的事件
const EVENT_REQUIRE_LAYOUT = "mindevent.require.layout";

// 焦点发生变更
const EVENT_FOCUS_CHANGE = "mindevent.focus.change";

// 查询附件
const EVENT_QUERY_ATTACHMENT = "mindevent.focus.query.attachment";

// 唤起链接
const EVENT_INVOKE_LINK = "mindevent.invoke.link";

// 唤起备注
const EVENT_INVOKE_NOTES = "mindevent.invoke.notes";

// 唤起标签
const EVENT_INVOKE_LABELS = "mindevent.invoke.labels";

// 唤起图像
const EVENT_INVOKE_IMAGE = "mindevent.invoke.image";

// 唤起扩展标记
const EVENT_INVOKE_MARKERS = "mindevent.invoke.markers";

///////////////////////////////////////////////////////////////////////////////

/**
 * 生成事件句柄的名称
 * @param {*} _event 
 * @param {*} _stamp 
 */
export function namedHandler(_event, _stamp) {
    return _stamp ? `${NAME_EVENTHANDLER_PREFIX}${_event}|${_stamp}` : `${NAME_EVENTHANDLER_PREFIX}${_event}|`;
}

/**
 * 检查一个对象的是不是具备某个事件的处理程序
 * @param {*} _constructor 对象的构造类
 * @param {*} _event 事件
 * @param {*} _stamp 事件的元素标记戳，如果不传入该参数，则只要是符合事件名的就算有对应的处理程序
 */
export function hasEventHandler(_constructor, _event, _stamp) {
    const map = Object.getOwnPropertyNames(_constructor.prototype);
    if (_stamp) {
        return map.indexOf(namedHandler(_event, _stamp));
    } else {
        for (let item of map) {
            if (item.startsWith(`${NAME_EVENTHANDLER_PREFIX}${_event}|`)) {
                return true;
            }
        }
    }
    return false;
}

/**
 * 从对象的构造类中抽取对象的事件处理程序表
 * @param {*} _constructor 对象的构造类
 */
function getEventHandlerMap(_constructor) {
    const srcMap = Object.getOwnPropertyNames(_constructor.prototype);
    const map = [];
    for (let item of srcMap) {
        if (item.startsWith(NAME_EVENTHANDLER_PREFIX)) {
            const event = item.substr(NAME_EVENTHANDLER_PREFIX.length).split("|")[0];
            (event.length > 0) && (map.indexOf(event) < 0) && map.push(event); 
        }
    }
    return map;
}

/**
 * 对阻止事件冒泡和默认处理的封装
 * @param {*} _event 要处理的事件
 * @param {*} _prevent 是否要阻止默认处理，默认为true
 */
export function handledEvent(_event, _prevent = true) {
    _prevent && _event.preventDefault();
    _event.stopPropagation();
}

/**
 * 允许同级继续分发事件
 * @param {*} _event 
 */
export function continueSiblingHandler(_event) {
    Object.isExtensible(_event) && (_event[SYMBOL_EVENT_BLOCK_SIBLING] = undefined);
}

/**
 * 循环调用处理程序
 * @param {*} _list 
 * @param {*} _thisArg 
 * @param {*} _args 
 */
function loopCallHandler(_list, _thisArg, _args) {
    const _event = _args[0];
    if (_list.length) {
        continueSiblingHandler(_event);
    } else {
        let ret = undefined;
        for (let idx in _list) {
            if (_list[idx]) {
                _args[3] = ret;
                ret = _list[idx].apply(this, _args);
                if (_event[SYMBOL_EVENT_BLOCK_SIBLING]) {
                    break;
                }
            }
        }
        return ret;
    }
}

/**
 * 分发主题事件的处理程序
 * @param {*} _event 
 */
function mindEventDispatcher(_event) {
    const element = _event.target;
    if (element) {
        let ret = undefined;
        // 获取事件元素的思维导图标记戳
        const stamp = element.getAttribute(ATTR_EVENT_STAMP);
        if (stamp) {
            // 如果事件元素标记为思维导图的元素，且对象有对应的处理程序，则进行处理
            const fn = this[namedHandler(_event.type, stamp)];
            if (fn) {
                Object.isExtensible(_event) && (_event[SYMBOL_EVENT_BLOCK_SIBLING] = true);
                ret = (fn instanceof Array) 
                        ? loopCallHandler(fn, this, [_event, stamp, element, ret]) 
                        : fn.call(this, _event, stamp, element);
            }
        }
        // 如果没有标记戳，或者处理程序允许同级继续分发，就要由未标记的默认处理程序继续处理
        if (!_event[SYMBOL_EVENT_BLOCK_SIBLING]) {
            const fn = this[namedHandler(_event.type)];
            if (fn) {
                Object.isExtensible(_event) && (_event[SYMBOL_EVENT_BLOCK_SIBLING] = true);
                (fn instanceof Array) 
                    ? loopCallHandler(fn, this, [_event, stamp, element, ret]) 
                    : fn.call(this, _event, stamp, element, ret);
            }
        }
    }
}

/**
 * 批量关联事件处理程序
 * @param {*} _element 被关联事件的元素
 * @param {*} _map 处理程序集
 * @param {*} _binder 处理程序的this对象
 */
export function mapEventHandler(_element, _binder, _map) {
    if (_element && _binder) {
        const map = _map || getEventHandlerMap(_binder.constructor);
        const dispatcher = _binder[SYMBOL_EVENT_DISPATCHER] || (_binder[SYMBOL_EVENT_DISPATCHER] = mindEventDispatcher.bind(_binder));
        const eventBind = (_element.on || _element.addEventListener).bind(_element);
        for (let event of map) {
            eventBind(event, dispatcher);
        }
    }
}

/**
 * 触发思维导图事件
 * @param {*} _event 
 * @param {*} _data 
 */
export function fireEvent(_event, _data, _defRet) {
    if (isENode(this)) {
        const event = new CustomEvent(_event, { 
            bubbles: true,
            cancelable: true,
            composed: true,
            detail: {value: _data, result: _defRet}
        });
        this.node.dispatchEvent(event);
        return event.detail.result;
    }
}

/**
 * 获取事件关联元素的标记戳
 * @param {*} _event 
 */
export function eventStamp(_event) {
    return (_event && _event.target) ? _event.target.getAttribute(ATTR_EVENT_STAMP) : undefined;
}

/**
 * 导出事件类接口和常数
 */
export const Constants = {
    ATTR_EVENT_STAMP,
    EVENT_FOCUS_CHANGE,
    EVENT_REQUIRE_LAYOUT,
    EVENT_QUERY_ATTACHMENT,
    EVENT_INVOKE_IMAGE,
    EVENT_INVOKE_LABELS,
    EVENT_INVOKE_LINK,
    EVENT_INVOKE_NOTES,
    EVENT_INVOKE_MARKERS
};
