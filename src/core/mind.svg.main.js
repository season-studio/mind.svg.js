import { Constants as EVENT, fireEvent, mapEventHandler, namedHandler, hasEventHandler, handledEvent, continueSiblingHandler } from "./mind.svg.event";
import { ENode, isENode } from "./mind.svg.node";
import { unused, ERROR } from "./mind.svg.util";
import * as Extend from "./mind.svg.extend";

// 检查用的定时器节拍
const TIMER_CHECKER_INTERVAL = 100;

// 私有成员的存储符号
const PRIVATE_SYMBOL = Symbol("MindSVG.Private");

// ID的前缀
const PREFIX_ID = "MID-";

// 思维导图主题项的标记戳值
const STAMP_TOPIC_TITLE = "topic-item-title";
// 思维导图主题项折叠按钮标记戳
const STAMP_FOLD_ICON = "topic-item-fold-icon";
// 思维导图主题项图片的标记戳
const STAMP_TOPIC_IMAGE = "topic-item-image";
// 思维导图的LABEL更多按钮的标记戳
const STAMP_TOPIC_LABEL_MORE = "topic-labels-more";
// 思维导图的LABEL的标记戳
const STAMP_TOPIC_LABELS = "topic-labels";
// 思维导图的备注的标记戳
const STAMP_TOPIC_NOTES = "topic-notes";
// 思维导图的链接的标记戳
const STAMP_TOPIC_LINK = "topic-link";
// 思维导图的附加标记的标记戳
const STAMP_TOPIC_MARKERS = "topic-markers";

// 加号图标的ID
const ID_ICON_PLUS = "icon-plus";
// 减号图标的ID
const ID_ICON_MINUS = "icon-minus";
// 更多图标的ID
const ID_ICON_MORE = "icon-more";
// 备注图标的ID
const ID_ICON_NOTES = "icon-notes";
// 链接图标的ID
const ID_ICON_LINK = "icon-link";

// 默认的基础类
const CLASS_NAME = {
    MAIN_BASIC: "mind-main-basic",
    MAIN_CONTAINER: "mind-main-container",
    MAIN_SVG: "mind-svg",
    TOPIC_GROUP_BASIC: "mind-topic-group-basic",
    TOPIC_ITEM_G_BASIC: "mind-topic-item-group-basic",
    TOPIC_IN_FOCUS: "mind-topic-focus",
    TOPIC_TEXT_BASIC: "mind-text-basic",
    TOPIC_TEXT: "mind-text",
    TOPIC_RECT: "mind-topic",
    TOPIC_LEVEL_PREFIX: "mind-topic-level",
    TOPIC_CHILD_G_BASIC: "mind-topic-children-group-basic",
    TOPIC_LINK_LINE: "mind-line",
    TOPIC_FOLD_ICON: "mind-topic-fold-icon",
    TOPIC_LABELS: "mind-topic-labels",
    TOPIC_LABEL_BG: "mind-topic-label-background",
    TOPIC_LINK: "mind-topic-link",
    TOPIC_NOTES: "mind-topic-notes",
    TOPIC_MARKERS: "mind-topic-markers"
};

// 默认配置参数
const DEFAULT_CONFIGS = {
    paddingX: 10,
    paddingY: 10,
    topicMarginX: 46,
    topicMarginY: 17,
    contentMarginX: 6,
    contentMarginY: 6,
    rectRadius: 6,
    lineBezierCtrlSize: 17,
    subPaddingX: 6,
    subPaddingY: 6,
    maxLabelsPreview: 3,
};

// 右侧连接
const CONNECT_DIRECTION_RIGHT = 0;
// 左侧连接
const CONNECT_DIRECTION_LEFT = 1;

// 主题里的数据名称前缀
const NAME_DATA_PREFIX = "_data$";

// 附件关联的前缀
const ATTACHMENT_LINK_PREFIX = "xap:";

// 元素的附加数据名称
const DATA_EXTEND = "extend";

/**
 * 生成主题数据属性的名称
 * @param {*} _name 
 */
function namedData(_name) {
    return `${NAME_DATA_PREFIX}${_name}`;
}

/**
 * 从格式化的数据属性名称中解析出数据的纯名称
 * @param {*} _name 
 */
function dataPureName(_name) {
    return _name.startsWith(NAME_DATA_PREFIX) ? _name.substr(NAME_DATA_PREFIX.length) : undefined;
}

/**
 * 获取对象的私有成员空间
 * @param {*} _this 对象实例
 * @param {*} _key 私有成员的名称，如果不传入该参数则获取实例的全部私有成员空间
 */
function getPrivate(_this, _key) {
    return _key === undefined ? _this[PRIVATE_SYMBOL] : _this[PRIVATE_SYMBOL][_key];
}

/**
 * 得到符合本程序规范的ID名称
 * @param {*} _id 人工或者数据预先指定的id，不传入该参数则自动随机生成一个id
 */
function mID(_id) {
    let ret;
    if (_id) {
        ret = ((typeof _id === "string") ? _id : String(_id));
        if (!ret.startsWith(PREFIX_ID)) {
            ret = PREFIX_ID + ret;
        }
    } else {
        ret = `${PREFIX_ID}${Date.now()}${Math.random().toString(16).substr(2,3)}`;
    }
    return ret;
}

/**
 * SVG预定义件类
 */
class Defs {
    constructor(_svg) {
        if (!isENode(_svg)) {
            throw ERROR.INVALID_PARAM("_svg");
        }
        const defs = (this.defs = _svg.createSVGChild("defs"));
        if (defs) {
            const list = Object.getOwnPropertyNames(Defs);
            for (let idx in list) {
                const name = list[idx];
                const fn = Defs[name];
                if (typeof fn === "function") {
                    const element = fn(this);
                    if (isENode(element)) {
                        element.attr("id", name);
                    }
                }
            }
        }
    }

    /**
     * 创建SVG的元素
     * @param {*} _tag 元素标签
     */
    createChild(_tag) {
        return this.defs.createSVGChild(_tag);
    }
}

/**
 * 主题项类
 */
class TopicItem {
    constructor (_data, _level, _parent) {
        if (isENode(_data)) {
            // 从既有元素封装出一个实例
            if ((_data.tagName !== "g") || !_data.hasClass(CLASS_NAME.TOPIC_ITEM_G_BASIC)) {
                throw ERROR.ILLEGAL_INSTANCE("_data", "<g> with item group class");
            }
            const content = (this.content = _data);
            this.fireEvent = fireEvent.bind(content);
            this.titleRect = content.firstDescendant(TopicItem.titleSelector);
            this.titleText = content.firstDescendant(`text.${CLASS_NAME.TOPIC_TEXT}`);
            this.foldIcon = content.firstDescendant(`use.${CLASS_NAME.TOPIC_FOLD_ICON}`);
        } else if (isENode(_parent)) {
            // 创建一个全新实例
            const id = _parent.attr("id");
            _data = _data || {};
            // 本类只创建主题项自身的数据，主题的下属子主题数据不由本类来实例化
            const content = (this.content = _parent.createSVGChild("g"));
            content.attr({
                id: id,
                class: `${CLASS_NAME.TOPIC_ITEM_G_BASIC} ${CLASS_NAME.TOPIC_LEVEL_PREFIX}${_level}`
            });
            this.fireEvent = fireEvent.bind(content);
            // 创建基本的主题方框和主题文字
            const titleRect = (this.titleRect = content.createSVGChild("rect"));
            const titleText = (this.titleText = content.createSVGChild("text"));
            titleText.text = _data.title;
            titleText.attr({
                id: id,
                class: `${CLASS_NAME.TOPIC_TEXT_BASIC} ${CLASS_NAME.TOPIC_TEXT}`,
                [EVENT.ATTR_EVENT_STAMP]: STAMP_TOPIC_TITLE
            });
            titleRect.attr({
                id: id,
                class: CLASS_NAME.TOPIC_RECT,
                [EVENT.ATTR_EVENT_STAMP]: STAMP_TOPIC_TITLE
            });
            // 其余数据直接通过属性设置以保证其元素设置代码的一致性
            for (let property of TopicItem.propertyNames()) {
                if ((property.name !== "title") && (property.name in _data)) {
                    this[property.fullName] = _data[property.name];
                }
            }
            // 创建预备使用的主题折叠按钮
            if (_level > 0) {
                (this.foldIcon = content.createSVGChild("use")).attr({
                    id: id,
                    href: `#${ID_ICON_MINUS}`,
                    style: "display: none;",
                    class: CLASS_NAME.TOPIC_FOLD_ICON,
                    [EVENT.ATTR_EVENT_STAMP]: STAMP_FOLD_ICON
                });
            }
        } else {
            throw ERROR.INVALID_PARAM(_parent);
        }
    }

    /**
     * 转换一个名称为属性数据名称，如果不存在对应的属性数据，则返回undefined
     * @param {*} _name 
     */
    static propertyName(_name) {
        const dest = namedData(_name);
        const list = Object.getOwnPropertyNames(TopicItem.prototype);
        return (list && (list.indexOf(dest) >= 0)) ? dest : undefined;
    }

    /**
     * 获取所有属性数据名称的迭代器
     */
    static * propertyNames() {
        const list = Object.getOwnPropertyNames(TopicItem.prototype);
        for (let itemName of list) {
            const dataName = dataPureName(itemName);
            if (dataName) {
                yield { name: dataName, fullName: itemName };
            }
        }
    }

    /**
     * 获取遍历所有属性数据的迭代器
     */
    * propertys() {
        const list = Object.getOwnPropertyNames(TopicItem.prototype);
        for (let itemName of list) {
            const dataName = dataPureName(itemName);
            if (dataName) {
                yield { name: dataName, fullName: itemName, value: this[itemName] };
            }
        }
    }

    /**
     * 获取/设置主题的层级
     * @param {*} _level 要设置的主题层级，如果不传入参数表示获取主题层级
     */
    level(_level) {
        const content = this.content;
        if (content) {
            const classList = content.classList;
            let levelIdx = -1;
            for (let idx in classList) {
                if (classList[idx].startsWith(CLASS_NAME.TOPIC_LEVEL_PREFIX)) {
                    levelIdx = idx;
                    break;
                }
            }
            if (_level === undefined) {
                return (levelIdx >= 0) ? parseInt(classList[levelIdx].substr(CLASS_NAME.TOPIC_LEVEL_PREFIX.length)) : 0;
            } else {
                if (levelIdx >= 0) {
                    classList[levelIdx] = "";
                }
                classList.push(`${CLASS_NAME.TOPIC_LEVEL_PREFIX}${_level}`);
                content.attr("class", classList.join(" "));
            }
        }
    }
    
    /**
     * 获取主题项的大小
     */
    get size() {
        const rect = this.content.rect;
        return {width:rect.width, height:rect.height};
    }

    /**
     * 获取标题区的坐标
     */
    get titleZone() {
        const titleRect = this.titleRect;
        if (titleRect) {
            return titleRect.getRelativeRect(titleRect.root);
        } else {
            return {x:0, y:0, width:0, height:0};
        }
    }

    /**
     * 获取内部项目的全局区域坐标信息
     * @param {*} _item 
     */
    globalZone(_item) {
        const selector = TopicItem[`${_item}Selector`];
        if (selector) {
            const node = this.content.firstDescendant(selector);
            return node ? node.globalRect : undefined;
        }
        return undefined;
    }

    /**
     * 获取内部项目相对于其他元素的坐标信息
     * @param {*} _item 
     * @param {*} _node 相对的元素，如果不传入该参数，则表示相对于MindSVG的容器元素
     */
    relativeZone(_item, _node) {
        let node;
        if (_item) {
            const selector = TopicItem[`${_item}Selector`];
            if (selector) {
                node = this.content.firstDescendant(selector);
            }
        } else {
            node = this.content;
        }
        if (node) {
            const relNode = ENode().attach(_node) || node.parent(`div.${CLASS_NAME.MAIN_CONTAINER}`);
            return relNode ? node.getRelativeRect(relNode) : undefined;
        }
        return undefined;
    }

    /**
     * 获取自定义数据
     */
    get [namedData("customData")]() {
        return this.content.data("customData");
    }

    /**
     * 设置自定义数据
     */
    set [namedData("customData")](_value) {
        this.content.data("customData", _value);
    }

    /**
     * 获取标题
     */
    get [namedData("title")]() {
        return this.titleText ? this.titleText.text : "";
    }

    /**
     * 设置标题
     */
    set [namedData("title")](_value) {
        this.titleText && (this.titleText.text = _value);
    }

    /**
     * 获取图片
     */
    get [namedData("image")]() {
        const img = this.content.firstDescendant(TopicItem.imageSelector);
        if (img) {
            const data = {};
            const attachment = img.data(DATA_EXTEND);
            data.src = attachment ? attachment : img.attr("href");
            const width = img.attr("width");
            width && (data.width = JSON.parse(width));
            const height = img.attr("height");
            height && (data.height = JSON.parse(height));
            return data;
        }
        return undefined;
    }

    /**
     * 设置图片
     */
    set [namedData("image")](_value) {
        if (_value && _value.src) {
            const img = this.content.firstDescendant(TopicItem.imageSelector) || this.content.createSVGChild(TopicItem.imageSelector);
            if (img) {
                const attrs = {
                    [EVENT.ATTR_EVENT_STAMP]: STAMP_TOPIC_IMAGE
                };
                if (_value.width !== undefined) {
                    attrs.width = _value.width;
                }
                if (_value.height !== undefined) {
                    attrs.height = _value.height;
                }
                let src = String(_value.src);
                if (src.startsWith(ATTACHMENT_LINK_PREFIX)) {
                    img.data(DATA_EXTEND, src);
                    src = this.fireEvent(EVENT.EVENT_QUERY_ATTACHMENT, src.substr(ATTACHMENT_LINK_PREFIX.length), "");
                } else {
                    img.data(DATA_EXTEND, null);
                }
                src = src.trim();
                if (src) {
                    attrs.href = src;
                    img.attr(attrs);
                } else {
                    img.remove();
                }
            }
        } else {
            const img = this.content.firstDescendant(TopicItem.imageSelector);
            img && img.remove();
        }
    }

    /**
     * 获取标签
     */
    get [namedData("labels")]() {
        const labels = this.content.firstDescendant(TopicItem.labelsSelector);
        if (labels) {
            const list = [];
            for (let text of labels.getDescandant("text")) {
                list.push(text.text);
            }
            return list;
        }
        return undefined;
    }

    /**
     * 设置标签
     */
    set [namedData("labels")](_value) {
        if ((_value instanceof Array) && (_value.length > 0)) {
            const labels = this.content.firstDescendant(TopicItem.labelsSelector) || this.content.createSVGChild("g");
            if (labels) {
                const attrs = {
                    class: CLASS_NAME.TOPIC_LABELS,
                    [EVENT.ATTR_EVENT_STAMP]: STAMP_TOPIC_LABELS
                };
                labels.clearChildren();
                labels.attr(attrs);
                const rect = labels.createSVGChild("rect");
                attrs.class = CLASS_NAME.TOPIC_LABEL_BG;
                rect.attr(attrs);
                attrs.class = `${CLASS_NAME.TOPIC_TEXT} ${CLASS_NAME.TOPIC_TEXT_BASIC}`;
                for (let item of _value) {
                    const text = labels.createSVGChild("text");
                    text.attr(attrs);
                    text.text = item;
                }
            }
        } else {
            const labels = this.content.firstDescendant(TopicItem.labelsSelector);
            labels && labels.remove();
        }
    }

    /**
     * 获取链接
     */
    get [namedData("href")]() {
        const href = this.content.firstDescendant(TopicItem.linkSelector);
        if (href) {
            return href.data(DATA_EXTEND);
        }
        return undefined;
    }

    /**
     * 设置链接
     */
    set [namedData("href")](_value) {
        if (_value && (_value = String(_value).trim())) {
            const href = this.content.firstDescendant(TopicItem.linkSelector) || this.content.createSVGChild("use");
            href.data(DATA_EXTEND, _value);
            href.attr({
                class: CLASS_NAME.TOPIC_LINK,
                href: `#${ID_ICON_LINK}`,
                [EVENT.ATTR_EVENT_STAMP]: STAMP_TOPIC_LINK
            });
        } else {
            const href = this.content.firstDescendant(TopicItem.linkSelector);
            href && href.remove();
        }
    }

    /**
     * 获取备注
     */
    get [namedData("notes")]() {
        const notes = this.content.firstDescendant(TopicItem.notesSelector);
        if (notes) {
            return notes.data(DATA_EXTEND);
        }
        return undefined;
    }

    /**
     * 设置备注
     */
    set [namedData("notes")](_value) {
        if (_value) {
            const notes = this.content.firstDescendant(TopicItem.notesSelector) || this.content.createSVGChild("use");
            notes.data(DATA_EXTEND, _value);
            notes.attr({
                class: CLASS_NAME.TOPIC_NOTES,
                href: `#${ID_ICON_NOTES}`,
                [EVENT.ATTR_EVENT_STAMP]: STAMP_TOPIC_NOTES
            });
        } else {
            const href = this.content.firstDescendant(TopicItem.notesSelector);
            href && href.remove();
        }
    }

    /**
     * 获取附属标志
     */
    get [namedData("markers")]() {
        const markerGroup = this.content.firstDescendant(TopicItem.markersSelector);
        if (markerGroup) {
            const markerList = {};
            for (let item of markerGroup.getDescandant("use")) {
                const itemHref = item.attr("href");
                if (itemHref) {
                    let {1:itemName, 2:itemValue} = itemHref.split(/[#-]/);
                    let fn = Defs[`${itemName}$translate`];
                    (typeof fn === 'function') && (itemValue = fn(itemValue));
                    markerList[itemName] = itemValue;
                }
            }
            return markerList;
        }
        return undefined;
    }

    /**
     * 设置附属标志
     */
    set [namedData("markers")](_value) {
        if (_value) {
            const markerGroup = this.content.firstDescendant(TopicItem.markersSelector) || this.content.createSVGChild("g");
            if (markerGroup) {
                markerGroup.attr({
                    class: CLASS_NAME.TOPIC_MARKERS,
                    [EVENT.ATTR_EVENT_STAMP]: STAMP_TOPIC_MARKERS
                });
                markerGroup.clearChildren();
                let itemCount = 0;
                for (let itemName in _value) {
                    let itemValue = _value[itemName];
                    let fn = Defs[`${itemName}$translate`];
                    (typeof fn === "function") && (itemValue = fn(itemValue, true));
                    const itemNode = markerGroup.createSVGChild("use");
                    itemNode.attr({
                        href: `#${itemName}-${itemValue}`,
                        [EVENT.ATTR_EVENT_STAMP]: STAMP_TOPIC_MARKERS
                    });
                    itemCount++;
                }
                (itemCount <= 0) && markerGroup.remove();
            }
        } else {
            const markerGroup = this.content.firstDescendant(TopicItem.markersSelector);
            markerGroup && markerGroup.remove();
        }
    }

    /**
     * 获取主题项的连接点坐标（相对于主题组自身坐标系）
     * @param {*} _direction 连接方向，取值为CONNECT_DIRECTION_LEFT和CONNECT_DIRECTION_RIGHT
     */
    connectPointer(_direction) {
        let x;
        let y;
        if (this.titleRect) {
            const box = this.titleRect.rect;
            y = (box.height >> 1);
            x = (_direction == CONNECT_DIRECTION_LEFT) ? 0 : box.width;
        } else {
            x = 0;
            y = 0;
        }
        return {x, y};
    }

    /**
     * 设置折叠
     * @param {*} _style 不传入参数表示不现实折叠按钮，true表示已折叠，false表示未折叠
     */
    fold(_style) {
        const foldIcon = this.foldIcon;
        if (foldIcon) {
            if ((_style === undefined) || (_style === null)) {
                foldIcon.style("display", "none");
                foldIcon.attr({href: `#${ID_ICON_MINUS}`});
            } else {
                foldIcon.attr({href: `#${_style ? ID_ICON_PLUS : ID_ICON_MINUS}`});
                foldIcon.style("display", "unset");
            }
        }
    }

    /**
     * 设置主题焦点
     * @param {*} _focus 不传入参数或者传入true表示主题拥有焦点，否则清除主题焦点
     */
    focus(_focus = true) {
        let ret = undefined;
        const content = this.content;
        if (content) {
            if (_focus) {
                if (!content.hasClass(CLASS_NAME.TOPIC_IN_FOCUS)) {
                    const root = content.root;
                    if (root) {
                        const lastFocus = root.firstDescendant(TopicItem.focusItemSelector);
                        if (lastFocus) {
                            lastFocus.removeClass(CLASS_NAME.TOPIC_IN_FOCUS);
                        }
                    }
                    content.addClass(CLASS_NAME.TOPIC_IN_FOCUS);
                }
                ret = true;
            } else if (content.hasClass(CLASS_NAME.TOPIC_IN_FOCUS)) {
                content.removeClass(CLASS_NAME.TOPIC_IN_FOCUS);
                ret = false;
            }
        }
        return ret;
    }

    /**
     * 检查主题是否有焦点
     */
    get isInFocus() {
        return this.content && this.content.hasClass(CLASS_NAME.TOPIC_IN_FOCUS);
    }

    /**
     * 根据MindSVG配置布局主题项内部的元素
     * @param {*} _mindSVG 隶属于的MindSVG对象
     */
    layout(_mindSVG, _direction) {
        if (!(_mindSVG instanceof MindSVG)) {
            throw ERROR.INVALID_PARAM("_mindSVG");
        }

        // 布局基本方框和文字
        const titleText = this.titleText;
        const titleRect = this.titleRect;
        if (titleText && titleRect) {
            const { paddingX, paddingY, rectRadius, 
                    maxLabelsPreview, subPaddingX, subPaddingY } = _mindSVG.config();

            // 先获取标题的基本大小
            let { width:textWidth, height:textHeight } = titleText.rect;
            let rectWidth = textWidth + (paddingX << 1);
            const rectHeight = textHeight + (paddingY << 1);
            
            // 布局底部栏的内容物
            const underTop = rectHeight + subPaddingY;
            let underWidth = 0;
            let underRightObjs = [];

            // 如果有标签，则布局标签
            const labels = this.content.firstDescendant(TopicItem.labelsSelector);
            let offsetX = subPaddingX;
            if (labels) {
                let textCount = 0;
                let textHeight = 0;
                for (let text of labels.getDescandant("text")) {
                    text.attr({
                        transform: `translate(${offsetX}, ${subPaddingY})`,
                        x: null,
                        y: null,
                        style: `display: ${textCount >= maxLabelsPreview ? "none": "unset"}`
                    });
                    const textRect = text.rect;
                    (0 === textCount) && (textHeight = (textRect.height + subPaddingY + subPaddingY));
                    if ((++textCount) <= maxLabelsPreview) {
                        offsetX += textRect.width + subPaddingX;
                    }
                }
                if (textCount > maxLabelsPreview) {
                    const moreIcon = labels.firstDescendant("use") ||labels.createSVGChild("use");
                    moreIcon.attr({
                        href: `#${ID_ICON_MORE}`,
                        [EVENT.ATTR_EVENT_STAMP]: STAMP_TOPIC_LABEL_MORE,
                        transform: `translate(${offsetX}, ${subPaddingY})`
                    });
                    offsetX += moreIcon.width + subPaddingX;
                }
                const labelRect = labels.firstDescendant(`rect.${CLASS_NAME.TOPIC_LABEL_BG}`);
                labelRect && labelRect.attr({
                    x: null,
                    y: null,
                    width: offsetX, 
                    height: textHeight,
                    rx: rectRadius,
                    ry: rectRadius,
                });
                labels.attr("transform", `translate(0, ${underTop})`);
                underWidth += offsetX;
            }

            // 如果有链接、备注则计算链接备注占用的空间
            for (let idx = 0; idx < 2; idx++) {
                const obj = this.content.firstDescendant(TopicItem.underLineSelectors[idx]);
                if (obj) {
                    const width = obj.width;
                    underWidth += width + subPaddingX;
                    underRightObjs.push({obj, width});
                }
            }

            // 如果有markers，则先对markers做内部布局，以计算markers要占用的空间
            const markers = this.content.firstDescendant(TopicItem.markersSelector);
            offsetX = 0;
            if (markers) {
                for (let item of markers.getDescandant("use")) {
                    (offsetX !== 0) && (offsetX += subPaddingX);
                    item.attr("transform", `translate(${offsetX}, 0)`);
                    offsetX += item.width;
                }
                underWidth += offsetX + subPaddingX;
                underRightObjs.push({obj:markers, width:offsetX});
            }

            // 根据labels、markers、链接、备注计算主题标题需要的最大长度
            (underRightObjs.length > 0) && (underWidth += subPaddingX);
            (underWidth > rectWidth) && (rectWidth = underWidth);

            // 如果有图片，则布局图片, 如果图片的大小比当前计算的标题区大小要小，则图片居中布局
            const img = this.content.firstDescendant(TopicItem.imageSelector);
            if (img) {
                const { width:imgWidth, height:imgHeight } = img.rect;
                let imgLeft = 0;
                (imgWidth > rectWidth) ? (rectWidth = imgWidth) : (imgLeft = (rectWidth - imgWidth) / 2);
                img.attr({
                    transform: `translate(${imgLeft}, -${imgHeight + subPaddingY})`,
                    x: null,
                    y: null
                });
            }

            // 现在开始从标题下的右侧开始布局链接、备注、markers
            offsetX = rectWidth - subPaddingX;
            for (let idx in underRightObjs) {
                const {obj, width} = underRightObjs[idx];
                if (obj) {
                    offsetX -= width;
                    obj.attr({
                        transform: `translate(${offsetX}, ${underTop})`,
                        x: null,
                        y: null
                    });
                    offsetX -= subPaddingX;
                }
            }

            // 最后根据主题的最大长度来布局主题标题文字和画框
            const textLeft = (rectWidth - textWidth) / 2;
            titleText.attr({
                transform: `translate(${textLeft}, ${paddingY})`,
                x: null,
                y: null
            });
            titleRect.attr({
                width: rectWidth, 
                height: rectHeight,
                rx: rectRadius,
                ry: rectRadius,
                x: null,
                y: null
            });

            // 布局折叠图标
            const foldIcon = this.foldIcon;
            if (foldIcon) {
                foldIcon.attr("transform", `translate(${_direction === CONNECT_DIRECTION_LEFT ? 0 : rectWidth}, ${rectHeight / 2})`);
            }
        }
    }

    static imageSelector = "image";
    static titleSelector = `rect.${CLASS_NAME.TOPIC_RECT}`;
    static linkSelector = `use.${CLASS_NAME.TOPIC_LINK}`;
    static notesSelector = `use.${CLASS_NAME.TOPIC_NOTES}`;
    static markersSelector = `g.${CLASS_NAME.TOPIC_MARKERS}`;
    static labelsSelector = `g.${CLASS_NAME.TOPIC_LABELS}`;
    static focusItemSelector = `.${CLASS_NAME.TOPIC_IN_FOCUS}`;

    static underLineSelectors = [
        TopicItem.linkSelector,
        TopicItem.notesSelector,
        TopicItem.markersSelector,
        TopicItem.labelsSelector
    ];
}

/**
 * 主题类
 */
class Topic {
    constructor (_data, _level, _parent) {
        const inner = (this[PRIVATE_SYMBOL] = {});
        if (isENode(_data)) {
            // 从既有元素封装出一个实例
            if ((_data.tagName !== "g") || !_data.hasClass(CLASS_NAME.TOPIC_GROUP_BASIC)) {
                throw ERROR.ILLEGAL_INSTANCE("_data", "<g> with group class");
            }
            const content = (inner.content = _data);
            this.fireEvent = fireEvent.bind(content);
            inner.childrenGroup = content.firstDescendant(Topic.childrenGroupSelector);
            inner.item = new TopicItem(content.firstDescendant(`g.${CLASS_NAME.TOPIC_ITEM_G_BASIC}#${content.attr("id")}`));
        } else if (isENode(_parent) && _parent.isSVG) {
            // 创建一个全新实例
            const id = mID(_data.id);
            // 本类的关键在于创建一个主题组用于管理主题内的全局数据，具体的主题数据由其他类实现
            const content = (inner.content = _parent.createSVGChild("g"));
            content.attr({
                id: id,
                class: CLASS_NAME.TOPIC_GROUP_BASIC
            });
            if (_data && (_data.direction !== undefined)) {
                content.data("direction", _data.direction);
            }
            this.fireEvent = fireEvent.bind(content);
            // 创建主题项实例, 注意：子主题组要优先于主题项被创建，这样才能保证子主题连接线不会把主题项给覆盖
            const childrenGroup = (inner.childrenGroup = content.createSVGChild("g"));
            childrenGroup.attr({
                id: id,
                class: CLASS_NAME.TOPIC_CHILD_G_BASIC
            });
            const item = (inner.item = new TopicItem(_data, _level, content));
            // 挂载事件处理
            mapEventHandler(item.content, this);
            // 创建子主题
            const subSource = _data.children;
            if (subSource instanceof Array) {
                for (let idx in subSource) {
                    this.addNewChild(subSource[idx]);
                }
            }
            // 注意：此处并不创建连接线，连接线在布局的时候生成
        }
    }

    // 折叠按钮被点击，进行折叠和展开的处理
    [namedHandler("click", STAMP_FOLD_ICON)](_event, _stamp, _element) {
        unused(_stamp);
        this.fold(String(_element.getAttribute("href")).indexOf(ID_ICON_MINUS) >= 0);
        handledEvent(_event);
    }

    // 唤起链接
    [namedHandler("click", STAMP_TOPIC_LINK)](_event) {
        this.fireEvent(EVENT.EVENT_INVOKE_LINK, {
            topic: this,
            data: this.topicData("href")
        });
        continueSiblingHandler(_event);
    }

    // 唤起备注
    [namedHandler("click", STAMP_TOPIC_NOTES)](_event) {
        this.fireEvent(EVENT.EVENT_INVOKE_NOTES, {
            topic: this,
            data: this.topicData("notes")
        });
        continueSiblingHandler(_event);
    }

    // 唤起图像
    [namedHandler("click", STAMP_TOPIC_IMAGE)](_event) {
        this.fireEvent(EVENT.EVENT_INVOKE_IMAGE, {
            topic: this,
            data: this.topicData("image")
        });
        continueSiblingHandler(_event);
    }

    // 唤起标签
    [namedHandler("click", STAMP_TOPIC_LABELS)](_event) {
        this.fireEvent(EVENT.EVENT_INVOKE_LABELS, {
            topic: this,
            data: this.topicData("labels")
        });
        continueSiblingHandler(_event);
    }

    // 唤起标签（更多）
    [namedHandler("click", STAMP_TOPIC_LABEL_MORE)](_event) {
        this.fireEvent(EVENT.EVENT_INVOKE_LABELS, {
            topic: this,
            data: this.topicData("labels"),
            more: true
        });
        continueSiblingHandler(_event);
    }

    // 唤起图标
    [namedHandler("click", STAMP_TOPIC_MARKERS)](_event) {
        this.fireEvent(EVENT.EVENT_INVOKE_MARKERS, {
            topic: this,
            data: this.topicData("markers")
        });
        continueSiblingHandler(_event);
    }

    // 点击了主题的标题部分
    [namedHandler("click")](_event) {
        this.focus();
        handledEvent(_event);
    }

    /**
     * 获取深度操作该主题组的细节实例
     */
    get content() {
        return getPrivate(this).content;
    }

    /**
     * 获取父主题
     */
    get parent() {
        if (this.level > 0) {
            const content = getPrivate(this).content;
            const parentNode = content.parent(Topic.contentSelector);
            return parentNode ? new Topic(parentNode) : undefined;
        }
        return undefined;
    }

    /**
     * 获取主题项的大小
     */
    get size() {
        const content = getPrivate(this).content;
        let width = 0;
        let height = 0;
        if (content) {
            const box = content.rect;
            width = box.width;
            height = box.height;
        }
        return {width, height};
    }

    /**
     * 获取主题组的起始点坐标（相对于主题组自身坐标系）
     */
    get originCorner() {
        const content = getPrivate(this).content;
        let x;
        let y;
        if (content) {
            const rect = content.rect;
            x = rect.x;
            y = rect.y;
        } else {
            x = 0;
            y = 0;
        }
        return {x, y};
    }

    /**
     * 获取主题的ID
     */
    get id() {
        const content = getPrivate(this).content;
        return content ? (content.attr("id") || "") : "";
    }

    /**
     * 获取/设置主题的布局方向
     */
    direction(_value) {
        const content = getPrivate(this).content;
        if (_value === undefined) {
            return content.data("direction") || CONNECT_DIRECTION_RIGHT;
        } else {
            content.data("direction", _value);
        }
        return this;
    }

    /**
     * 获取标题区的坐标
     */
    get titleZone() {
        const item = getPrivate(this).item;
        return item ? item.titleZone : {x:0, y:0, width:0, height:0};
    }

    /**
     * 获取主题项内容的坐标
     */
    get itemZone() {
        const item = getPrivate(this).item;
        return (item && item.content) ? item.content.globalRect : {x:0, y:0, width:0, height:0};
    }

    /**
     * 获取内部项目的全局区域坐标信息
     * @param {*} _item 
     */
    globalZone(_item) {
        const item = getPrivate(this).item;
        return item ? item.globalZone(_item) : undefined;
    }

    /**
     * 获取内部项目相对于导图容器的坐标信息
     * @param {*} _item 
     */
    relativeZone(_item) {
        const item = getPrivate(this).item;
        return item ? item.relativeZone(_item) : undefined;
    }

    /**
     * 获取主题的全区域坐标
     */
    get totalZone() {
        const content = getPrivate(this).content;
        return content ? content.globalRect : {x:0, y:0, width:0, height:0};
    }

    /**
     * 获取子主题的实例集合的迭代器
     */
    * childrenTopics() {
        const childrenGroup = getPrivate(this).childrenGroup;
        if (childrenGroup) {
            const nodeIterator = childrenGroup.getChildren(Topic.contentSelector);
            for (let itemNode of nodeIterator) {
                yield new Topic(itemNode);
            }
        }
    }

    /**
     * 检查是否有子主题
     */
    get hasChild() {
        const childrenGroup = getPrivate(this).childrenGroup;
        return childrenGroup && (childrenGroup.firstDescendant(Topic.contentSelector) !== undefined);
    }

    /**
     * 获取主题的等级
     */
    get level() {
        const item = getPrivate(this).item;
        return item.level();
    }

    /**
     * 获取或设置主题自身的数据
     * @param {*} _key 要操作的数据的名称，如果不传入参数，表示获取主题的所有数据；如果传入的是字符串，则表示获取或设置对应名称的数据；如果传入的是对象，则将对象内的成员批量设置为主题的属性
     * @param {*} _value 
     */
    topicData(_key, _value) {
        const item = getPrivate(this).item;
        if (item) {
            if (_key === undefined) {
                const data = {};
                for (let property of item.propertys()) {
                    (property.value !== undefined) && (property.value !== null) && (data[property.name] = property.value);
                }
                if (this.level === 1) {
                    data.direction = this.direction();
                }
                return data;
            } else if (typeof _key === "string") {
                const dataName = TopicItem.propertyName(_key);
                if (dataName) {
                    if (_value === undefined) {
                        return item[dataName];
                    } else {
                        item[dataName] = _value;
                        this.fireEvent(EVENT.EVENT_REQUIRE_LAYOUT);
                    }
                }
            } else {
                let count = 0;
                for (let itemName in _key) {
                    const dataName = TopicItem.propertyName(itemName);
                    if (dataName) {
                        const itemValue = _key[itemName];
                        item[dataName] = itemValue;
                        count ++;
                    }
                }
                (count !== 0) && this.fireEvent(EVENT.EVENT_REQUIRE_LAYOUT);
            }
        }
        return this;
    }

    /**
     * 获取主题的所有数据
     */
    get data() {
        const value = this.topicData();
        if (value) {
            value.id = this.id;
            const children = (value.children = []);
            const childrenList = this.childrenTopics();
            for (const subTopic of childrenList) {
                children.push(subTopic.data);
            }
        }
        return value;
    }

    /**
     * 检查是否是相同的主题
     * @param {*} _topic 
     */
    isSame(_topic) {
        return (_topic instanceof Topic) && (getPrivate(this).content.isSame(getPrivate(_topic).content));
    }

    /**
     * 让主题组完成相对定位
     * @param {*} _x 
     * @param {*} _y 
     */
    translate(_x, _y) {
        const content = getPrivate(this).content;
        content && content.attr("transform", `translate(${_x}, ${_y})`);
        return this;
    }

    /**
     * 设置/获取主题折叠
     * @param {*} _isFold 如果不传入参数表示获取折叠的设置
     */
    fold(_isFold) {
        const childrenGroup = getPrivate(this).childrenGroup;
        this.focus();
        if (_isFold === undefined) {
            return childrenGroup && childrenGroup.style("display", "none");
        } else {
            childrenGroup && childrenGroup.style("display", (_isFold ? "none" : "unset"));
            this.fireEvent(EVENT.EVENT_REQUIRE_LAYOUT);
        }
        return this;
    }

    /**
     * 设置主题是否拥有焦点
     * @param {*} _focus true或者不传入参数表示主题拥有焦点，否则清除主题焦点
     */
    focus(_focus = true) {
        const item = getPrivate(this).item;
        if (item) {
            const ret = item.focus(_focus);
            if (ret !== undefined) {
                this.fireEvent(EVENT.EVENT_FOCUS_CHANGE, ret ? this : null);
            }
        }
        return this;
    }
    
    /**
     * 检查主题是否有焦点
     */
    get isInFocus() {
        const item = getPrivate(this);
        return item && item.isInFocus;
    }

    /**
     * 添加一个新的子主题
     * @param {*} _data 子主题的数据，如果不传入数据，则使用默认数据
     * @param {*} _redraw true或者不传入该参数表示理解重绘画面；false表示不立即重绘画面；该参数用于对思维导图一次做多项变更时减少刷新
     */
    addNewChild(_data, _redraw = true) {
        const _value = _data ? (_data.title ? _data : Object.assign({title:Topic.DefaultTitle}, _data)) 
                             : {title:Topic.DefaultTitle};
        const topic = new Topic(_value, this.level + 1, getPrivate(this).childrenGroup);
        _redraw && this.fireEvent(EVENT.EVENT_REQUIRE_LAYOUT);
        return topic;
    }

    /**
     * 将主题从思维导图中移除
     * @param {*} _redraw true或者不传入该参数表示理解重绘画面；false表示不立即重绘画面；该参数用于对思维导图一次做多项变更时减少刷新
     */
    remove(_redraw = true) {
        const content = getPrivate(this).content;
        if (content) {
            const parentNode = content.parent(Topic.childrenGroupSelector);
            const path = parentNode.firstDescendant(`path#${this.id}`);
            if (path) {
                path.remove();
            }
            content.remove();
            _redraw && fireEvent.call(parentNode, EVENT.EVENT_REQUIRE_LAYOUT);
        }
        return this;
    }

    /**
     * 删除所有子主题
     * @param {*} _redraw true或者不传入该参数表示理解重绘画面；false表示不立即重绘画面；该参数用于对思维导图一次做多项变更时减少刷新
     */
    clearChildren(_redraw = true) {
        for (const item of this.childrenTopics()) {
            (item instanceof Topic) && item.remove();
        }
        _redraw && this.fireEvent(EVENT.EVENT_REQUIRE_LAYOUT);
        return this;
    }

    /**
     * 将主题加为其他主题的子主题
     * @param {*} _parent 新的父主题
     * @param {*} _toHead true表示加为新父主题的第一个子主题；false或不传入参数，表示加为新父主题的最后一个子主题
     * @param {*} _redraw true或者不传入该参数表示理解重绘画面；false表示不立即重绘画面；该参数用于对思维导图一次做多项变更时减少刷新
     */
    insertTo(_parent, _toHead, _redraw = true) {
        if (_parent instanceof Topic) {
            const childrenGroup = getPrivate(_parent).childrenGroup;
            const { content, item } = getPrivate(this);
            if (childrenGroup && content) {
                this.remove();
                _toHead ? content.insertToTop(childrenGroup) : content.appendTo(childrenGroup);
                item.level(_parent.level + 1);
                _redraw && this.fireEvent(EVENT.EVENT_REQUIRE_LAYOUT);
            }
        }
        return this;
    }

    /**
     * 添加为一个主题的同级后续主题
     * @param {*} _sibling 同级主题
     * @param {*} _redraw true或者不传入该参数表示理解重绘画面；false表示不立即重绘画面；该参数用于对思维导图一次做多项变更时减少刷新
     */
    insertNextTo(_sibling, _redraw = true) {
        if (_sibling instanceof Topic) {
            const siblingContent = _sibling.content;
            const { content, item } = getPrivate(this); 
            this.remove();
            content.insertAfter(siblingContent);
            item.level(_sibling.level);
            _redraw && this.fireEvent(EVENT.EVENT_REQUIRE_LAYOUT);
        }
    }

    /**
     * 将主题加为一个主题的兄弟主题
     * @param {*} _brother 兄弟主题
     * @param {*} _before true表示加到_brother主题之前，false或不传入该参数表示加到_brother主题之后
     * @param {*} _redraw true或者不传入该参数表示理解重绘画面；false表示不立即重绘画面；该参数用于对思维导图一次做多项变更时减少刷新
     */
    insertAsBrother(_brother, _before, _redraw = true) {
        if (_brother instanceof Topic) {
            const brotherContent = getPrivate(_brother).content;
            const { content, item } = getPrivate(this);
            if (brotherContent && content) {
                this.remove();
                _before ? content.insertBefore(brotherContent) : content.insertAfter(brotherContent);
                item.level(_brother.level);
                _redraw && this.fireEvent(EVENT.EVENT_REQUIRE_LAYOUT);
            }
        }
        return this;
    }

    /**
     * 获取主题的可见性
     */
    get visible() {
        return (getPrivate(this).content.style("display") !== "none");
    }

    /**
     * 设置主题的可见性
     */
    set visible(_value) {
        const content = getPrivate(this).content;
        const oldValue = (content.style("display") !== "none");
        _value = _value || false;
        if (oldValue !== _value) {
            const display = (_value ? "unset" : "none");
            content.style("display", display);
            const path = content.root.firstDescendant(`path#${content.attr("id")}`);
            if (path) {
                path.node.style.display = display;
            }
            if ((!_value) && this.isInFocus) {
                this.focus(false);
            }
            _value && this.fireEvent(EVENT.EVENT_REQUIRE_LAYOUT);
        }
    }

    /**
     * 获取下一个兄弟主题
     */
    get nextSibling() {
        let node = this.content;
        while ((node = ENode().attach(node.node.nextSibling))) {
            if (node.matches(Topic.contentSelector)) {
                return new Topic(node);
            }
        }
        return undefined;
    }

    /**
     * 获取上一个兄弟主题
     */
    get previousSibling() {
        let node = this.content;
        while ((node = ENode().attach(node.node.previousSibling))) {
            if (node.matches(Topic.contentSelector)) {
                return new Topic(node);
            }
        }
        return undefined;
    }

    /**
     * 获取第一个下级主题
     */
    get firstDescendant() {
        const node = this.content.firstDescendant(Topic.contentSelector);
        return node ? new Topic(node) : undefined;
    }

    /**
     * 根据MindSVG配置布局主题项内部的元素
     * @param {*} _mindSVG 隶属于的MindSVG对象
     * @param {*} _foldLevel 折叠等级
     */
    layout(_mindSVG, _foldLevel, _direction) {
        if (!(_mindSVG instanceof MindSVG)) {
            throw ERROR.INVALID_PARAM("_mindSVG");
        }

        const { content, item:topicItem, childrenGroup } = getPrivate(this);
        if (!content || !(topicItem instanceof(TopicItem)) || !childrenGroup) {
            throw ERROR.ILLEGAL_INSTANCE("Topic");
        }

        // 布局主题项
        topicItem.layout(_mindSVG, _direction);

        // 确定折叠图标的显示
        const level = topicItem.level();
        const isFold = (_foldLevel === undefined) 
                            ? (childrenGroup.node.style.display === "none") 
                            : ((_foldLevel > 0) ? (_foldLevel <= level) : false);
        topicItem.fold((this.hasChild && (level > 0)) ? isFold : null);
        
        if (isFold) {
            // 折叠状态下就隐藏子项组，也不做子项组的布局
            childrenGroup.node.style.display = "none";
        } else {
            // 显示子项组，先让子主题内部完成布局，然后让子主题在子元素组中完成布局
            childrenGroup.node.style.display = "unset";

            // 获取布局用的基本参数
            const connectPointer = topicItem.connectPointer(CONNECT_DIRECTION_RIGHT);
            const configs = _mindSVG.config();
            const topicMarginRightX = configs.topicMarginX;
            const topicMarginLeftX = 0 - connectPointer.x - topicMarginRightX;
            const topicMarginY = configs.topicMarginY;
            const subTopicLayoutParams = {};
            let offsetRightY = 0;
            let offsetLeftY = 0;
            let direction = _direction;

            // 先计算子主题的基本布局参数
            for (const subItem of this.childrenTopics()) {
                if (subItem.visible) {
                    (_direction === undefined) && (direction = subItem.direction());
                    subItem.layout(_mindSVG, _foldLevel, direction);
                    const subOrigin = subItem.originCorner;
                    if (direction === CONNECT_DIRECTION_LEFT) {
                        // 布局在左侧的子主题
                        const translateY = (subOrigin.y < 0) ? offsetLeftY - subOrigin.y : offsetLeftY;
                        const titleZone = subItem.titleZone;
                        const subHeight = subItem.size.height;
                        offsetLeftY += subHeight + topicMarginY;
                        subTopicLayoutParams[subItem.id] = {
                            obj: subItem,
                            x: topicMarginLeftX - titleZone.width,
                            y: translateY,
                            lineY: translateY + (titleZone.height / 2), 
                            left: true
                        };
                    } else {
                        // 布局在右侧的子主题
                        const translateY = (subOrigin.y < 0) ? offsetRightY - subOrigin.y : offsetRightY;
                        const subHeight = subItem.size.height;
                        offsetRightY += subHeight + topicMarginY;
                        subTopicLayoutParams[subItem.id] = {
                            obj: subItem,
                            x: topicMarginRightX,
                            y: translateY,
                            lineY: translateY + (subItem.titleZone.height / 2), 
                            left: false
                        };
                    }
                }
            }

            // 再计算让左右主题平衡居中布局的修正量
            if (offsetRightY > offsetLeftY) {
                offsetLeftY = (offsetRightY - offsetLeftY) / 2;
                offsetRightY = 0;
            } else {
                offsetRightY = (offsetLeftY - offsetRightY) / 2;
                offsetLeftY = 0;
            }

            // 执行布局，并连接主题项与子主题之间的线
            const lineBezierCtrlSize = configs.lineBezierCtrlSize;
            const startY = (childrenGroup.height >> 1);
            const pathDataRightPrefix = `M0 ${startY}C${lineBezierCtrlSize} ${startY} ${topicMarginRightX - lineBezierCtrlSize} `;
            const pathDataLeftPrefix = `M${0 - connectPointer.x} ${startY}C${0 - connectPointer.x - lineBezierCtrlSize} ${startY} ${topicMarginLeftX + lineBezierCtrlSize} `;
            for (let lineID in subTopicLayoutParams) {
                let {obj, x, y, lineY:endY, left:isLeft} = subTopicLayoutParams[lineID];
                const offsetY = (isLeft ? offsetLeftY : offsetRightY);
                obj.translate(x, y + offsetY);
                endY += offsetY;
                const path = childrenGroup.firstDescendant(`path#${lineID}`) || childrenGroup.createSVGChild("path");
                path.attr({
                    id: lineID,
                    d: isLeft ? `${pathDataLeftPrefix}${endY} ${topicMarginLeftX} ${endY}`
                              : `${pathDataRightPrefix}${endY} ${topicMarginRightX} ${endY}`,
                    class: CLASS_NAME.TOPIC_LINK_LINE
                });
            }

            // 将子项组布局到与主题项连接点垂直居中的位置上去
            childrenGroup.attr("transform", `translate(${connectPointer.x}, ${0 - startY + connectPointer.y})`);
        }
    }

    /**
     * 文字转换
     */
    toString() {
        return JSON.stringify(this.topicData());
    }

    static DefaultTitle = "默认主题";

    static contentSelector = `g.${CLASS_NAME.TOPIC_GROUP_BASIC}`;
    static childrenGroupSelector = `g.${CLASS_NAME.TOPIC_CHILD_G_BASIC}`;
}

/**
 * 获取元素所在的主题
 * @param {*} _node 
 */
export function topicOfNode(_node) {
    let node = ENode().attach(_node);
    if (node) {
        node = node.parent(Topic.contentSelector);
        if (node) {
            return new Topic(node);
        }
    }
    return undefined;
}

/**
 * SVG思维导图类
 */
export class MindSVG {
    
    constructor (_parent) {
        const inner = (this[PRIVATE_SYMBOL] = {
            configs: {},
            rootTopic: undefined,
            container: ENode("div")
        });
        const parent = ENode().attach(_parent) || ENode().attach("body");
        const container = inner.container;
        container.attr({
            class: `${CLASS_NAME.MAIN_BASIC} ${CLASS_NAME.MAIN_CONTAINER}`,
            tabindex: "1"
        });
        container.appendTo(parent);
        this.fireEvent = fireEvent.bind(container);
        inner.timerID = setInterval(MindSVG.checkState, TIMER_CHECKER_INTERVAL, this);
        const svg = container.firstDescendant("svg") || container.createSVGChild("svg");
        inner.svg = svg;
        inner.containerWidth = container.width;
        inner.containerHeight = container.height;
        inner.offsetX = 0;
        inner.offsetY = 0;
        inner.scaleRate = 1;
        svg.attr({
            viewBox: `${inner.offsetX} ${inner.offsetY} ${inner.containerWidth} ${inner.containerHeight}`,
            class: CLASS_NAME.MAIN_SVG,
            width: "100%",
            height: "100%"
        });
        inner.content = undefined;
        Object.assign(inner.configs, DEFAULT_CONFIGS);
        // 创建标准预定义件
        new Defs(svg);
        // 关联默认处理事件
        mapEventHandler(container, this);
    }

    // 响应请求重新布局
    [namedHandler(EVENT.EVENT_REQUIRE_LAYOUT)]() {
        this.fold();
    }

    // 响应在空白处点击
    [namedHandler("click")](_event) {
        // 清除焦点
        this.clearFocus();
        handledEvent(_event);
    }

    /**
     * 检查内部的状态
     */
    static checkState(_this) {
        const inner = getPrivate(_this);
        if (inner.svg) {
            // 如果容器的大小发生变化，则同步修正SVG的视口
            let curWidth = inner.container.width;
            let curHeight = inner.container.height;
            if ((curWidth !== inner.containerWidth) || (curHeight !== inner.containerHeight)) {
                inner.containerWidth = curWidth;
                inner.containerHeight = curHeight;
                curWidth /= inner.scaleRate;
                curHeight /= inner.scaleRate;
                inner.svg.attr("viewBox", `${inner.offsetX} ${inner.offsetY} ${curWidth} ${curHeight}`);
                const event = document.createEvent("UIEvents");
                event.initUIEvent("resize", false, true, window || global, this);
                inner.container.dispatchEvent(event);
            }
        }
    }

    /**
     * 获取SVG所属的上层容器
     */
    get container() {
        return getPrivate(this).container;
    }

    /**
     * 获取对应的svg
     */
    get svg() {
        return getPrivate(this).svg;
    }

    /**
     * 获取主组
     */
    get content() {
        return getPrivate(this).content;
    }

    /**
     * 获取根主题
     */
    get rootTopic() {
        return getPrivate(this).rootTopic;
    }

    /**
     * 获取主区域的信息
     */
    get zone() {
        const inner = getPrivate(this);
        return {
            x: inner.offsetX, 
            y: inner.offsetY, 
            width: (inner.containerWidth / inner.scaleRate), 
            height: (inner.containerHeight / inner.scaleRate)
        };
    }

    /**
     * 获取所有思维导图的所有数据
     */
    get data() {
        const rootTopic = getPrivate(this).rootTopic;
        return (rootTopic instanceof Topic) ? rootTopic.data : {};
    }

    /**
     * 释放对象，因为JS不支持析构，所有要手动调用此方法释放实例中资源占用的部分
     */
    release() {
        const inner = getPrivate(this);
        if (inner.timerID) {
            clearInterval(inner.timerID);
            inner.timerID = undefined;
        }
    }

    /**
     * 添加事件监听
     * @param {*} _event 
     * @param {*} _fn 
     * @param {*} _opt 
     */
    on(_event, _fn, _opt) {
        const container = getPrivate(this).container;
        if (container) {
            container.on(_event, _fn, _opt);
        }
        return this;
    }

    /**
     * 移除事件监听
     * @param {*} _event 
     * @param {*} _fn 
     * @param {*} _opt 
     */
    off(_event, _fn, _opt) {
        const container = getPrivate(this).container;
        if (container) {
            container.off(_event, _fn, _opt);
            if (hasEventHandler(MindSVG, _event) && (!_fn)) {
                mapEventHandler(container, this, [_event]);
            }
        }
        return this;
    }

    /**
     * 清除所有内容
     */
    clear() {
        const inner = getPrivate(this);
        if (inner.content) {
            inner.content.remove();
            inner.content = undefined;
            inner.rootTopic = undefined;
        }
        return this;
    }

    /**
     * 显示一张思维导图，执行该方法会让原来存在的思维导图被删除掉
     * @param {*} _data 思维导图数据
     */
    show(_data) {
        const inner = getPrivate(this);
        if (inner.svg) {
            this.clear();
            const content = (inner.content = inner.svg.createSVGChild("g"));
            content.attr("class", CLASS_NAME.MAIN_BASIC);
            if (_data) {
                const rootTopic = (inner.rootTopic = new Topic(_data, 0, content));
                rootTopic.layout(this, 0);
                this.toCenter();
            }
        }
        return this;
    }

    /**
     * 设置主题风格
     * @param {String} _theme 主题风格的CSS类名称，如果不填写，则删除自定义主题改用默认风格
     */
    setTheme(_theme) {
        const { content, container } = getPrivate(this);
        const classStr = _theme ? `${CLASS_NAME.MAIN_BASIC} ${_theme}` : CLASS_NAME.MAIN_BASIC;
        content && content.attr("class", classStr);
        container && container.attr("class", `${classStr} ${CLASS_NAME.MAIN_CONTAINER}`);
        return this;
    }

    /**
     * 获取思维导图全部内容所占用的大小
     * @returns {Object} 由width和height构成的大小信息
     */
    get totalSize() {
        const content = getPrivate(this).content;
        let width = 0;
        let height = 0;
        if (content) {
            const box = content.rect;
            width = box.width;
            height = box.height;
        }
        return {width, height};
    }

    /**
     * 获取或设置配置
     * @param {*} _nameOrMap 配置项名称，如果不传入则获取所有配置项的结合对象
     * @param {*} _value 配置项的值，如果不传入则表示获取配置项、如果传入null表示删除配置项（用默认值）、否则表示设置配置项
     */
    config(_nameOrMap, _value) {
        if (_nameOrMap === undefined) {
            return Object.assign({}, getPrivate(this).configs);
        } else if (typeof _nameOrMap === "string") {
            const configs = getPrivate(this, "configs");
            if (_value === undefined) {
                return configs[_nameOrMap];
            } else if (_value === null) {
                configs[_nameOrMap] = DEFAULT_CONFIGS[_nameOrMap];
            } else {
                configs[_nameOrMap] = _value;
            }
        } else {
            for (let itemName in _nameOrMap) {
                this.config(String(itemName), _nameOrMap[itemName]);
            }
        }
        return this;
    }

    /**
     * 将整个画布或指定的主题放到视图的中间
     */
    toCenter(_topic) {
        const inner = getPrivate(this);
        if (inner.svg && this.content) {
            const curWidth = inner.containerWidth / inner.scaleRate;
            const curHeight = inner.containerHeight / inner.scaleRate;
            const totalBox = this.content.rect;
            if (_topic instanceof Topic) {
                const topicBox = _topic.titleZone;
                inner.offsetX = parseInt(topicBox.x - ((curWidth - topicBox.width) / 2));
                inner.offsetY = parseInt(topicBox.y - ((curHeight - topicBox.height) / 2));
            } else {
                const topicNode = inner.svg.firstDescendant(`g.${CLASS_NAME.TOPIC_LEVEL_PREFIX}0`);
                const topicBox = (topicNode ? topicNode.rect : {width:0, height:0});
                if (totalBox.width < curWidth) {
                    inner.offsetX = totalBox.x - ((curWidth - totalBox.width) / 2);
                } else {
                    let offset = parseInt(0 - ((curWidth - topicBox.width) / 2));
                    if (totalBox.x > offset) {
                        inner.offsetX = totalBox.x;
                    } else if ((curWidth + offset) > (totalBox.width + totalBox.x)) {
                        inner.offsetX = totalBox.width + totalBox.x - curWidth;
                    } else {
                        inner.offsetX = offset;
                    }
                }
                if (totalBox.height < curHeight) {
                    inner.offsetY = totalBox.y - ((curHeight - totalBox.height) / 2);
                } else {
                    let offset = parseInt(0 - ((curHeight - topicBox.height) / 2));
                    if (totalBox.y > offset) {
                        inner.offsetY = totalBox.y;
                    } else if ((curHeight + offset) > (totalBox.height + totalBox.y)) {
                        inner.offsetY = totalBox.height + totalBox.y - curHeight;
                    } else {
                        inner.offsetY = offset;
                    }
                }
            }
            inner.svg.attr("viewBox", `${inner.offsetX} ${inner.offsetY} ${curWidth} ${curHeight}`);
        }
        return this;
    }

    /**
     * 移动整个脑图
     * @param {Number} _x 左坐标
     * @param {Number} _y 右坐标
     */
    move(_x, _y) {
        const inner = getPrivate(this);
        if (inner.svg) {
            // 如果容器的大小发生变化，则同步修正SVG的视口
            let curWidth = inner.containerWidth / inner.scaleRate;
            let curHeight = inner.containerHeight / inner.scaleRate;
            inner.offsetX = _x;
            inner.offsetY = _y;
            inner.svg.attr("viewBox", `${inner.offsetX} ${inner.offsetY} ${curWidth} ${curHeight}`);
        }
        return this;
    }

    /**
     * 在现有位置的基础上以一定偏移移动整个脑图
     * @param {*} _deltaX 
     * @param {*} _deltaY 
     */
    moveBy(_deltaX, _deltaY) {
        const inner = getPrivate(this);
        if (inner.svg) {
            // 如果容器的大小发生变化，则同步修正SVG的视口
            let curWidth = inner.containerWidth / inner.scaleRate;
            let curHeight = inner.containerHeight / inner.scaleRate;
            _deltaX = parseInt(_deltaX);
            _deltaY = parseInt(_deltaY);
            if (!isNaN(_deltaX)) {
                inner.offsetX += _deltaX;
            }
            if (!isNaN(_deltaY)) {
                inner.offsetY += _deltaY;
            }
            inner.svg.attr("viewBox", `${inner.offsetX} ${inner.offsetY} ${curWidth} ${curHeight}`);
        }
        return this;
    }

    /**
     * 在现有缩放比例的基础上按照一定比例缩放
     * @param {*} _r 
     */
    scaleBy(_r) {
        const inner = getPrivate(this);
        if (inner.svg) {
            // 如果容器的大小发生变化，则同步修正SVG的视口
            _r = parseFloat(_r);
            if (!isNaN(_r)) {
                this.scale(inner.scaleRate * _r);
            }
        }
        return this;
    }

    /**
     * 按照一定比例缩放
     * @param {*} _r 
     */
    scale(_r) {
        const inner = getPrivate(this);
        if (inner.svg) {
            // 如果容器的大小发生变化，则同步修正SVG的视口
            _r = parseFloat(_r);
            if (!isNaN(_r)) {
                let deny = (!isNaN(inner.configs.maxScale)) && (_r > inner.configs.maxScale);
                deny = deny || ((!isNaN(inner.configs.minScale)) && (_r < inner.configs.minScale));
                if (!deny) {
                    inner.scaleRate = _r;
                    let curWidth = inner.containerWidth / _r;
                    let curHeight = inner.containerHeight / _r;
                    inner.svg.attr("viewBox", `${inner.offsetX} ${inner.offsetY} ${curWidth} ${curHeight}`);
                }
            }
            
        }
        return this;
    }

    /**
     * 获取缩放率
     */
    get scaleRate() {
        const inner = getPrivate(this);
        return inner ? inner.scaleRate : 1;
    }

    /**
     * 获取画布的统一偏移
     */
    get offset() {
        const inner = getPrivate(this);
        return inner ? {x: inner.offsetX, y: inner.offsetY} : {x:0, y:0};
    }

    /**
     * 折叠到某个级别
     * @param {Number} _level 取0或小于0的值，表示不折叠
     */
    fold(_level) {
        const rootTopic = getPrivate(this).rootTopic;
        if (rootTopic) {
            if (_level > 0) {
                this.clearFocus();
            }
            rootTopic.layout(this, _level);
        }
        return this;
    }

    /**
     * 清除焦点
     */
    clearFocus() {
        const svg = getPrivate(this).svg;
        if (svg) {
            const lastFocus = svg.firstDescendant(TopicItem.focusItemSelector);
            if (lastFocus) {
                lastFocus.removeClass(CLASS_NAME.TOPIC_IN_FOCUS);
                fireEvent.call(lastFocus, EVENT.EVENT_FOCUS_CHANGE, null);
            }
        }
        return this;
    }

    /**
     * 获取主题的迭代器，可用于异步迭代主题，比如查找主题内容等等
     */
    * getTopicIterator() {
        const svg = getPrivate(this).svg;
        if (svg) {
            const list = svg.getDescandant(Topic.contentSelector);
            for (const item of list) {
                if (item) {
                    yield new Topic(item);
                }
            }
        }
    }

    /**
     * 返回焦点主题
     */
    get focusTopic() {
        const svg = getPrivate(this).svg;
        if (svg) {
            let focusNode = svg.firstDescendant(TopicItem.focusItemSelector);
            if (focusNode) {
                focusNode = focusNode.parent(Topic.contentSelector); 
                return focusNode ? new Topic(focusNode) : undefined;
            }
        }
        return undefined;
    }

    /**
     * 生成获取所有预定义元素的迭代器
     */
    * getDefs() {
        const svg = getPrivate(this).svg;
        if (svg) {
            for (const section of svg.getDescandant("defs")) {
                for (const item of section.getChildren()) {
                    const itemID = item.attr("id");
                    if (itemID) {
                        let {0:itemName, 1:itemValue} = itemID.split("-");
                        let fn = Defs[`${itemName}$translate`];
                        (typeof fn === 'function') && (itemValue = fn(itemValue));
                        yield {
                            type: itemName,
                            value: itemValue,
                            node: item.node
                        };
                    }
                }
            }
        }
    }
}

// 注册可扩展类
Extend.registryClass({ MindSVG, Topic, TopicItem, Defs, DEFAULT_CONFIGS });

/**
 * 导出标准常量
 */
export const Constants = {
    ATTACHMENT_LINK_PREFIX,

    STAMP_TOPIC_TITLE,
    STAMP_FOLD_ICON,
    STAMP_TOPIC_IMAGE,
    STAMP_TOPIC_LABEL_MORE,
    STAMP_TOPIC_LABELS,
    STAMP_TOPIC_LINK,
    STAMP_TOPIC_MARKERS,
    STAMP_TOPIC_NOTES,

    CONNECT_DIRECTION_LEFT,
    CONNECT_DIRECTION_RIGHT,

    ID_ICON_MINUS,
    ID_ICON_PLUS,
    ID_ICON_MORE,
    ID_ICON_LINK,
    ID_ICON_NOTES,
};
