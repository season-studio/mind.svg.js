import { Constants } from "./mind.svg.main";
import * as Event from "./mind.svg.event";
import * as Extend from "./mind.svg.extend";

const EVENT = Event.Constants;

// 拖拽事件记录变量的符号
const SYMBOLE_DRAG_EVENT_LOG = Symbol("mind.svg.drag.event.log");

// 拖拽显示盒的风格
const CLASS_DRAG_BOX = "mind-topic-drag-box";

// 拖拽连接线的风格
const CLASS_DRAG_LINE = "mind-topic-drag-line";

// 拖拽盒的强制风格
const STYLE_DRAG_BOX_FORCED = "position: absolute;";

// 查询是否可以被拖拽
const EVENT_QUERY_DRAGGABLE = "mindevent.query.draggable";

// 通知拖拽已启动
const EVENT_DRAG_START = "mindevent.drag.start";

// 通知识别到一个待选的拖拽悬停元素
const EVENT_DRAG_POTENTIAL_HOVER = "mindevent.drag.potential.hover";

// 悬停定时器的超时事件
const TIMEOUR_HOVER = 900;

/**
 * 从对象中获取拖拽事件记录
 * @param {*} _obj 
 */
function dragEventLog(_obj) {
    return _obj[SYMBOLE_DRAG_EVENT_LOG] || (_obj[SYMBOLE_DRAG_EVENT_LOG] = {});
}

/**
 * 准备一个拖拽盒，并对起进行锚定
 * @param {*} _mind 
 * @param {*} _eventLog 
 * @param {*} _x 仅当此处开始的两个坐标参数有传入时，才会对拖拽盒进行锚定并显示
 * @param {*} _y 
 */
function dragBox(_mind, _eventLog, _x, _y) {
    // 确保有一个推拽盒
    const container = _mind.container;
    let boxNode = container.firstDescendant(`div.${CLASS_DRAG_BOX}`);
    if (!boxNode) {
        boxNode = container.createChild("div").attr("class", CLASS_DRAG_BOX);
    }
    // 让拖拽盒的主题文本与被推拽的主题一致
    const topic = _eventLog.dragingTopic;
    topic && (boxNode.text = topic.topicData("title"));
    // 锚定拖拽盒的位置
    if ((_x !== undefined) && (_y !== undefined)) {
        let {x:showX, y:showY} = container.translatePoint(_x, _y);
        boxNode.attr("style", `${STYLE_DRAG_BOX_FORCED} left:${showX + 3}px; top:${(showY - (boxNode.height / 2)) - container.top}px;`);
    }
    return boxNode;
}

/**
 * 准备拖拽线
 * @param {*} _mind 
 * @param {*} _dragBox 
 * @param {*} _eventLog 
 */
function dragLine(_mind, _dragBox, _eventLog) {
    const svg = _mind.svg;
    const line = svg.firstDescendant(`path.${CLASS_DRAG_LINE}`) || svg.createSVGChild("path").attr("class", CLASS_DRAG_LINE);
    let hoverTopic;
    if (_eventLog && (hoverTopic = _eventLog.hoverTopic)) {
        const start = hoverTopic.titleZone;
        const endOrign = _dragBox.globalRect;
        const {x:endX, y:endY} = svg.translatePoint(endOrign.x + endOrign.width / 2, endOrign.y + endOrign.height / 2);
        line.attr({
            d: `M${start.x + start.width / 2} ${start.y + start.height / 2}L${endX} ${endY}`,
            style: "display: unset;"
        });
    }
    return line;
}

/**
 * 悬停定时器
 */
function hoverTimerProc(_topic) {
    const eventLog = dragEventLog(_topic);
    eventLog.hoverTimer = undefined;
    _topic.fireEvent(EVENT_DRAG_POTENTIAL_HOVER, {topic: _topic});
}

// 在Topic类中扩展拖拽的实现
Extend.extendEventHandler("Topic", {
    // 鼠标按下，检查是否可以拖拽
    [Event.namedHandler("mousedown", Constants.STAMP_TOPIC_TITLE)] (_event) {
        const eventLog = dragEventLog(this);
        const mouseButton = (_event.which || (_event.button + 1));
        if ((mouseButton === 1) && (this.level > 0)) {
            eventLog.waitDrag = this.fireEvent(EVENT_QUERY_DRAGGABLE, this, true);
            Event.handledEvent(_event);
        }
    },

    // 鼠标移动，如果允许拖拽则启动拖拽
    [Event.namedHandler("mousemove", Constants.STAMP_TOPIC_TITLE)](_event) {
        const eventLog = dragEventLog(this);
        const mouseButton = (_event.which || (_event.button + 1));
        if ((mouseButton === 1) && eventLog.waitDrag) {
            eventLog.waitDrag = undefined;
            eventLog.hoverTimer && clearTimeout(eventLog.hoverTimer);
            eventLog.hoverTimer = undefined;
            this.fireEvent(EVENT_DRAG_START, {topic: this, x: _event.clientX, y: _event.clientY});
        }
        Event.continueSiblingHandler(_event);
    },

    // 鼠标移入，启动悬停计数
    [Event.namedHandler("mouseover", Constants.STAMP_TOPIC_TITLE)](_event) {
        const eventLog = dragEventLog(this);
        const mouseButton = (_event.which || (_event.button + 1));
        if (mouseButton === 1) {
            eventLog.hoverTimer && clearTimeout(eventLog.hoverTimer);
            eventLog.hoverTimer = setTimeout(hoverTimerProc, TIMEOUR_HOVER, this);
        }
        Event.continueSiblingHandler(_event);
    },

    // 鼠标移出, 取消拖拽等待以及清除悬停计数
    [Event.namedHandler("mouseout", Constants.STAMP_TOPIC_TITLE)](_event) {
        const eventLog = dragEventLog(this);
        eventLog.waitDrag = undefined;
        eventLog.hoverTimer && clearTimeout(eventLog.hoverTimer);
        eventLog.hoverTimer = undefined;
        Event.continueSiblingHandler(_event);
    },

    // 鼠标抬起，取消拖拽等待以及清除悬停计数
    [Event.namedHandler("mouseup", Constants.STAMP_TOPIC_TITLE)](_event) {
        const eventLog = dragEventLog(this);
        eventLog.waitDrag = undefined;
        eventLog.hoverTimer && clearTimeout(eventLog.hoverTimer);
        eventLog.hoverTimer = undefined;
        Event.continueSiblingHandler(_event);
    }
});

// 在MindSVG主容器中扩展拖拽的实现
Extend.extendEventHandler("MindSVG", {
    // 响应是否允许拖拽的查询事件
    [Event.namedHandler(EVENT_QUERY_DRAGGABLE)] (_event) {
        _event.detail.result = this.config("draggable");
    },

    // 响应拖拽启动事件
    [Event.namedHandler(EVENT_DRAG_START)] (_event) {
        const eventLog = dragEventLog(this);
        const value = _event.detail.value;
        const topic = value.topic;
        eventLog.dragingTopic = topic;
        if (topic) {
            const box = dragBox(this, eventLog, value.x, value.y);
            eventLog.hoverTopic = topic.parent;
            dragLine(this, box, eventLog);
            topic.visible = false;
        }
        Event.handledEvent(_event);
    },

    // 响应拖拽入的候选主题的处理事件
    [Event.namedHandler(EVENT_DRAG_POTENTIAL_HOVER)] (_event) {
        const eventLog = dragEventLog(this);
        const potentialTopic = _event.detail.value.topic;
        if (eventLog.dragingTopic) {
            eventLog.hoverTopic = potentialTopic;
            const box = dragBox(this, eventLog);
            dragLine(this, box, eventLog);
        }
        Event.handledEvent(_event);
    },

    // 响应拖拽过程事件
    [Event.namedHandler("mousemove")] (_event) {
        const eventLog = dragEventLog(this);
        const button = (_event.which || (_event.button + 1));
        if ((button === 1) && eventLog.dragingTopic) {
            const box = dragBox(this, eventLog, _event.clientX, _event.clientY);
            dragLine(this, box, eventLog);
            Event.handledEvent(_event);
        }
    },

    // 响应拖拽结束事件
    [Event.namedHandler("mouseup")] (_event) {
        const eventLog = dragEventLog(this);
        const button = (_event.which || (_event.button + 1));
        if ((button === 1) && eventLog.dragingTopic) {
            // 隐藏拖拽盒与拖拽线
            const box = dragBox(this, eventLog);
            box.attr("style", "display: none;");
            dragLine(this, box).attr("style", "display:none;");
            // 发送推拽确认事件，可用于应用层历史记录或者应用层阻止对某个拖拽的生效
            const dragingTopic = eventLog.dragingTopic;
            const hoverTopic = eventLog.hoverTopic;
            const canDrop = this.fireEvent(EVENT.EVENT_CONFIRM_DRAG, {
                thisTopic: dragingTopic,
                originParent: dragingTopic.parent,
                newParent: hoverTopic
            }, true);
            if (hoverTopic && canDrop) {
                // 计算拖拽后的主题的布局方向
                const ptY = _event.clientY;
                let isLeft = false;
                if (hoverTopic.level === 0) {
                    if (_event.clientX < hoverTopic.itemZone.x) {
                        dragingTopic.direction(Constants.CONNECT_DIRECTION_LEFT);
                        isLeft = true;
                    } else {
                        dragingTopic.direction(Constants.CONNECT_DIRECTION_RIGHT);
                    }
                } else {
                    dragingTopic.direction(null);
                }
                // 计算拖拽后主题的临近兄弟主题
                let prevSibling = undefined;
                for (let sibling of hoverTopic.childrenTopics()) {
                    if (!dragingTopic.isSame(sibling) && (!isLeft || sibling.direction() === Constants.CONNECT_DIRECTION_LEFT)) {
                        const rect = sibling.itemZone;
                        if (ptY < rect.y) {
                            break;
                        } else {
                            prevSibling = sibling;
                        }
                    }
                }
                // 完成拖放
                prevSibling ? eventLog.dragingTopic.insertNextTo(prevSibling, false) 
                            : eventLog.dragingTopic.insertTo(eventLog.hoverTopic, true, false);
            }
            dragingTopic.focus(true);
            eventLog.dragingTopic.visible = true;
            eventLog.dragingTopic = undefined;
            Event.handledEvent(_event);
            this.fireEvent(EVENT.EVENT_END_DRAG);
        }
    }
});

// 扩展配置项
Extend.extend("DEFAULT_CONFIGS", {
    draggable: false
});

// 导出
export const DragEvent = {
    EVENT_DRAG_START,
    EVENT_QUERY_DRAGGABLE
};
