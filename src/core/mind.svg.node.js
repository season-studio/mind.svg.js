/**
 * 定义常用名称空间常量
 */
export const NS = {
    SVG: "http://www.w3.org/2000/svg",
    XLINK: "http://www.w3.org/1999/xlink"
};

/**
 * 将名称转化为属性数据名称
 * @param {*} _name 
 */
function namedData(_name) {
    return `data-${_name}`;
}

/**
 * 检查参数是不是一个DOM节点
 * @param {*} _node 
 */
export function isNode(_node) {
    return (_node instanceof window.Node || _node instanceof window.HTMLElement);
}

/**
 * 封装Node操作的类
 */
export class ENodeClass {
    constructor (_tagOrNode, _ns) {
        const node = (this.node = isNode(_tagOrNode) ? _tagOrNode
                                    : (_ns ? document.createElementNS(_ns, _tagOrNode) 
                                        : document.createElement(_tagOrNode)));
        this.matches = (node.matches || node.matchesSelector || node.msMatchesSelector || node.mozMatchesSelector || node.webkitMatchesSelector || node.oMatchesSelector).bind(node);
        this.dispatchEvent = node.dispatchEvent.bind(node);
    }

    /**
     * 将一个现成节点和ENode封装关联
     * @param {*} _node 
     */
    static attach(_node) {
        return isNode(_node) ? new ENodeClass(_node) 
                            : (isENode(_node) ? _node 
                                            : (_node ? ENodeClass.attach(document.querySelector(_node)) : undefined));
    }

    /**
     * 获取ID
     */
    get id() {
        const value = this.node.getAttribute("id");
        return value || "";
    }

    /**
     * 设置ID
     */
    set id(_value) {
        this.node.setAttribute("id", _value);
    }

    /**
     * 获取标签名
     */
    get tagName() {
        return this.node.tagName.toLowerCase();
    }

    /**
     * 获取风格类
     */
    get class() {
        const value = this.node.getAttribute("class");
        return value || "";
    }

    /**
     * 设置风格类
     */
    set class(_value) {
        this.node.setAttribute("class", _value);
    }

    /**
     * 检查是否是SVG的成员元素
     */
    get isSVG() {
        return this.node instanceof SVGElement;
    }

    /**
     * 获取文本内容
     */
    get text() {
        return this.node.textContent || "";
    }

    /**
     * 设置文本内容
     */
    set text(_value) {
        if (this.isSVG) {
            this.node.innerHTML = "";
            this.node.appendChild(document.createTextNode(_value));
        } else {
            this.node.innerText = _value;
        }
    }

    /**
     * 元素的y坐标
     */
    get top() {
        if (this.isSVG) {
            return this.node.getBBox().y;
        } else {
            return this.node.offsetTop;
        }
    }

    /**
     * 元素的x坐标
     */
    get left() {
        if (this.isSVG) {
            return this.node.getBBox().x;
        } else {
            return this.node.offsetLeft;
        }
    }

    /**
     * 元素的宽度信息
     */
    get width() {
        if (this.isSVG) {
            return this.node.getBBox().width;
        } else {
            return this.node.offsetWidth;
        }
    }

    /**
     * 元素的高度信息
     */
    get height() {
        if (this.isSVG) {
            return this.node.getBBox().height;
        } else {
            return this.node.offsetHeight;
        }
    }

    /**
     * 获取当前节点相对于自身已定位坐标系的矩形
     */
    get rect() {
        const node = this.node;
        return this.isSVG   ? node.getBBox() 
                            : { x: node.offsetLeft, 
                                y: node.offsetTop,
                                width: node.offsetWidth,
                                height: node.offsetHeight
                            };
    }

    /**
     * 获取元素内部的矩形空间
     */
    get clinetRect() {
        const node = this.node;
        return this.isSVG   ? node.getBBox() 
                            : { x: node.clientLeft, 
                                y: node.clientTop,
                                width: node.clientWidth,
                                height: node.clientHeight
                            };
    }

    /**
     * 获取当前节点相对于全局的空间矩形
     */
    get globalRect() {
        return this.node.getBoundingClientRect();
    }

    /**
     * 获取当前节点相对于父元素的空间矩形
     */
    get offsetRect() {
        const node = this.node;
        const box = this.isSVG ? node.getBoundingClientRect() 
                                : { x: node.offsetLeft, 
                                    y: node.offsetTop,
                                    width: node.offsetWidth,
                                    height: node.offsetHeight
                                };
        return box;
    }
    
    /**
     * 获取相对于另一个节点的当前节点空间矩形
     * @param {*} _node 如果不给该参数，则直接给出当前节点针对自身的空间矩形
     */
    getRelativeRect(_node) {
        const box = this.globalRect;
        const relNode = ENodeClass.attach(_node);
        if (relNode) {
            if (relNode.isSVG) {
                const matrix = relNode.node.getScreenCTM().inverse();
                let retMatrix = matrix.translate(box.x, box.y);
                box.x = retMatrix.e;
                box.y = retMatrix.f;
                if (this.isSVG) {
                    const originRect = this.rect;
                    box.width = originRect.width;
                    box.height = originRect.height;
                }
            } else {
                box.x -= relNode.left;
                box.y -= relNode.top;
            }
        }
        return box;
    }

    /**
     * 将屏幕上的坐标转化为相对元素的坐标
     * @param {*} _x 
     * @param {*} _y 
     */
    translatePoint(_x, _y) {
        if (this.isSVG) {
            const matrix = this.node.getScreenCTM().inverse();
            let {e:x, f:y} = matrix.translate(_x, _y);
            return {x, y};
        } else {
            const rect = this.globalRect;
            return { x: _x - rect.x,
                     y: _y - rect.y };
        }
    }

    /**
     * 获取或设置属性，传入null为参数值，则说明删除属性
     * @param {*} _idOrMap  属性名，或者属性名和属性值构成的对象，或者属性名构成的数组
     * @param {*} _value    属性值，如果第一参数为属性名，且不传入该参数，则获取属性；
     *                      如果第一参数为属性名列表，则或略该参数直接批量获取属性；
     *                      如果第一参数为属性名和属性值构成的对象，则忽略该参数
     */
    attr(_idOrMap, _value) {
        const node = this.node;
        if (typeof _idOrMap === "string") {
            // 只操作单个属性的处理
            if (_value === undefined) {
                return node.getAttribute(_idOrMap);
            } else if (_value === null) {
                node.removeAttribute(_idOrMap);
            } else {
                node.setAttribute(_idOrMap, _value);
            }
        } else if (_idOrMap instanceof Array) {
            // 批量获取属性
            const valueList = {};
            for (let item of _idOrMap) {
                valueList[item] = node.getAttribute(item);
            }
            return valueList;
        } else {
            // 传入的是一个映射表
            for (let name in _idOrMap) {
                const value = _idOrMap[name];
                (value === null) ? node.removeAttribute(name) : node.setAttribute(name, value);
            }
        }
        return this;
    }

    /**
     * 获取或设置风格，传入null为参数值，则说明删除风格
     * @param {*} _idOrMap  风格名，或者风格名和风格值构成的对象，或者风格名构成的数组
     * @param {*} _value    风格值，如果第一参数为风格名，且不传入该参数，则获取风格；
     *                      如果第一参数为风格名列表，则或略该参数直接批量获取风格；
     *                      如果第一参数为风格名和风格值构成的对象，则忽略该参数
     */
    style(_idOrMap, _value) {
        const styleList = this.node.style;
        if (typeof _idOrMap === "string") {
            // 只操作单个风格的处理
            if (_value === undefined) {
                return styleList[_idOrMap];
            } else {
                styleList[_idOrMap] = _value;
            }
        } else if (_idOrMap instanceof Array) {
            // 批量获取属性
            const valueList = {};
            for (let item of _idOrMap) {
                valueList[item] = styleList[item];
            }
            return valueList;
        } else {
            // 传入的是一个映射表
            for (let name in _idOrMap) {
                const value = _idOrMap[name];
                styleList[name] = value;
            }
        }
        return this;
    }

    /**
     * 获取或设置扩展数据，传入null为参数值，则说明删除扩展数据
     * @param {*} _idOrMap  数据名，或者数据名和数据值构成的对象，或者数据名构成的数组
     * @param {*} _value    数据值，如果第一参数为数据名，且不传入该参数，则获取数据；
     *                      如果第一参数为数据名列表，则或略该参数直接批量获取数据；
     *                      如果第一参数为数据名和数据值构成的对象，则忽略该参数
     */
    data(_idOrMap, _value) {
        const node = this.node;
        if (typeof _idOrMap === "string") {
            // 只操作单个属性的处理
            if (_value === undefined) {
                return JSON.parse(node.getAttribute(namedData(_idOrMap)));
            } else if (_value === null) {
                node.removeAttribute(namedData(_idOrMap));
            } else {
                node.setAttribute(namedData(_idOrMap), JSON.stringify(_value));
            }
        } else if (_idOrMap instanceof Array) {
            // 批量获取属性
            const valueList = {};
            for (let item of _idOrMap) {
                valueList[item] = JSON.parse(node.getAttribute(namedData(item)));
            }
            return valueList;
        } else {
            // 传入的是一个映射表
            for (let name in _idOrMap) {
                const value = _idOrMap[name];
                (value === null) ? node.removeAttribute(namedData(name)) : node.setAttribute(namedData(name), JSON.stringify(value));
            }
        }
        return this;
    }

    /**
     * 检查对象是否具有某个风格类
     * @param {*} _name 
     */
    hasClass(_name) {
        return this.matches(`.${_name}`);
    }
    
    /**
     * 添加对象某个风格类
     * @param {*} _name 
     */
    addClass(_name) {
        let classList = this.node.classList;
        if (classList) {
            classList.add(_name);
        } else {
            const classStr = this.attr("class");
            classList = classStr ? classStr.split(/\s+/) : [];
            if (classList.indexOf(_name) < 0) {
                this.attr("class", `${classStr} ${_name}`);
            }
        }
        return this;
    }

    /**
     * 移除对象某个风格类
     * @param {*} _name 
     */
    removeClass(_name) {
        let classList = this.node.classList;
        if (classList) {
            classList.remove(_name);
        } else {
            const classStr = this.attr("class");
            classList = classStr ? classStr.split(/\s+/) : [];
            const idx = classList.indexOf(_name);
            if (idx >= 0) {
                classList[idx] = "";
                this.attr("class", classList.join(" "));
            }
        }
        return this;
    }

    /**
     * 获取风格类型列表
     */
    get classList() {
        const classStr = this.attr("class");
        return classStr ? classStr.split(/\s+/) : [];
    }

    /**
     * 查找父节点
     * @param {*} _selector 
     */
    parent(_selector) {
        let parentENode;
        let element = this.node;
        while ((element = element.parentElement)) {
            parentENode = ENodeClass.attach(element);
            if (!_selector) {
                break;
            } else if (parentENode.matches(_selector)) {
                break;
            }
        }
        return parentENode;
    }

    /**
     * 查找根节点
     */
    get root() {
        return this.isSVG
                    ? ENodeClass.attach(this.node.ownerSVGElement || this.parent("body"))
                    : this.parent("body");
    }

    /**
     * 获取符合选择描述的第一个后代
     * @param {*} _selector 
     */
    firstDescendant(_selector) {
        _selector = _selector || "*";
        const node = this.node.querySelector(_selector);
        return node ? ENodeClass.attach(node) : undefined;
    }

    /**
     * 获取所有满足选择描述的后代数组
     * @param {*} _selector 
     */
    descendant(_selector) {
        _selector = _selector || "*";
        const elmList = this.node.querySelectorAll(_selector);
        const list = [];
        for (let item of elmList) {
            const node = ENodeClass.attach(item);
            if (node.matches(_selector)) {
                list.push(node);
            }
        }
        return list;
    }

    /**
     * 获取所有满足选择描述的后代的迭代器
     * @param {*} _selector 
     */
    * getDescandant(_selector) {
        _selector = _selector || "*";
        const elmList = this.node.querySelectorAll(_selector);
        for (let item of elmList) {
            const node = ENodeClass.attach(item);
            if (node.matches(_selector)) {
                yield node;
            }
        }
    }

    /**
     * 获取符合第一个选择描述的子代
     * @param {*} _selector 
     */
    firstChild(_selector) {
        if (_selector) {
            let childNode;
            for (let item of this.node.children) {
                let node = ENodeClass.attach(item);
                if (node.matches(_selector)) {
                    childNode = node;
                    break;
                }
            }
            return childNode;
        } else {
            return ENodeClass.attach(this.node.firstElementChild);
        }
    }

    /**
     * 获取满足选择描述的子代数组
     * @param {*} _selector 
     */
    children(_selector) {
        const elmList = this.node.children;
        const list = [];
        for (let item of elmList) {
            const node = ENodeClass.attach(item);
            if ((!_selector) || node.matches(_selector)) {
                list.push(node);
            }
        }
        return list;
    }

    /**
     * 获取满足选择描述的子代迭代器
     * @param {*} _selector 
     */
    * getChildren(_selector) {
        const elmList = this.node.children;
        for (let item of elmList) {
            const node = ENodeClass.attach(item);
            if ((!_selector) || node.matches(_selector)) {
                yield node;
            }
        }
    }

    /**
     * 加入为一个父元素的最后一个子项
     * @param {*} _parent 
     */
    appendTo(_parent) {
        const parentNode = isNode(_parent) ? _parent : (isENode(_parent) ? _parent.node : null);
        if (parentNode) {
            this.node.remove();
            parentNode.appendChild(this.node);
        }
        return this;
    }

    /**
     * 加入为一个父元素的第一个子项
     * @param {*} _parent 
     */
    insertToTop(_parent) {
        const parentNode = isNode(_parent) ? _parent : (isENode(_parent) ? _parent.node : null);
        if (parentNode) {
            this.node.remove();
            parentNode.insertBefore(this.node, parentNode.firstElementChild);
        }
        return this;
    }

    /**
     * 插入到某个元素的后面去
     * @param {*} _sibling 
     */
    insertAfter(_sibling) {
        const siblingNode = ENodeClass.attach(_sibling);
        if (siblingNode) {
            const parentNode = siblingNode.parent();
            if (parentNode) {
                this.node.remove();
                const nextSibling = siblingNode.node.nextSibling;
                nextSibling ? parentNode.node.insertBefore(this.node, nextSibling)
                            : parentNode.node.appendChild(this.node);
            }
        }
        return this;
    }

    /**
     * 插入到某个元素的前面去
     * @param {*} _sibling 
     */
    insertBefore(_sibling) {
        const siblingNode = ENodeClass.attach(_sibling);
        if (siblingNode) {
            const parentNode = siblingNode.parent();
            if (parentNode) {
                this.node.remove();
                parentNode.node.insertBefore(this.node, siblingNode.node);
            }
        }
        return this;
    }

    /**
     * 移除当前元素
     */
    remove() {
        this.node.remove();
        return this;
    }

    /**
     * 转换点的坐标
     * @param {*} _point 
     * @param {*} _toOuter 
     */
    convertPoint(_point, _toOuter) {
        let x = _point ? (_point.x || 0) : 0;
        let y = _point ? (_point.y || 0) : 0;
        if (_toOuter) {
            x += this.node.offsetLeft;
            y += this.node.offsetTop;
        } else {
            x -= this.node.offsetLeft;
            y -= this.node.offsetTop;
        }
        return {x, y};
    }

    /**
     * 添加事件监听
     * @param {*} _event 
     * @param {*} _fn 
     * @param {*} _opt 
     */
    on(_event, _fn, _opt) {
        this.node.addEventListener(_event, _fn, _opt);
        return this;
    }

    /**
     * 移除事件监听
     * @param {*} _event 
     * @param {*} _fn 
     * @param {*} _opt 
     */
    off(_event, _fn, _opt) {
        this.node.removeEventListener(_event, _fn, _opt);
        return this;
    }

    /**
     * 判断两个节点对象是否相同
     * @param {*} _other 
     */
    isSame(_other) {
        return this.node.isSameNode(isENode(_other) ? _other.node : _other);
    }

    /**
     * 创建一个子元素，并追加到最后
     * @param {*} _tag 
     * @param {*} _ns 
     */
    createChild(_tag, _ns) {
        const child = new ENodeClass(_tag, _ns);
        child && child.appendTo(this);
        return child;
    }

    /**
     * 创建一个SVG的子元素，并追加到最后
     * @param {*} _tag 
     */
    createSVGChild(_tag) {
        return this.isSVG ? this.createChild(_tag, NS.SVG) : SVG().appendTo(this);
    }

    /**
     * 删除所有成员
     */
    clearChildren() {
        this.node.innerHTML = "";
        return this;
    }
}

/**
 * 获取或创建一个ENode对象，如果不传入参数则返回ENodeClass类
 * @param {*} _node 
 * @param {*} _ns 
 */
export function ENode(_node, _ns) {
    return (arguments.length <= 0) ? ENodeClass : new ENodeClass(_node, _ns);
}

/**
 * 创建一个SVG的ENode对象
 */
export function SVG() {
    const svg = new ENodeClass("svg", NS.SVG);
    return svg.attr({
        xmlns: NS.SVG,
        "xmlns:xlink": NS.XLINK,
        version: "1.1"
    });
}

/**
 * 检查参数是不是一个ENode封装
 * @param {*} _node 
 */
export function isENode(_node) {
    return _node instanceof ENodeClass;
}
