import { Constants } from "./mind.svg.main";
import * as Extend from "./mind.svg.extend";

const taskMap = ["start", "oct", "quarter", "3oct", "half", "5oct", "3quar", "7oct", "done", "unknown"];

Extend.extend("Defs", {
    $std$defs$declare (obj) {
        if (obj.defs) {
            obj.defs.node.insertAdjacentHTML(
                'beforeend',
                `
                <path id="${Constants.ID_ICON_PLUS}" fill="#fff" fill-opacity="0.8" stroke="#000" stroke-width="1" 
                    transform="translate(-6, -4), scale(1.25, 1.25)" 
                    d="M1 4A3 3 0 1 0 8 4A3 3 0 1 0 1 4M2.5 4L6.5 4M4.5 2L4.5 6" />
                <path id="${Constants.ID_ICON_MINUS}" fill="#fff" fill-opacity="0.8" stroke="#000" stroke-width="1" 
                    transform="translate(-6, -4), scale(1.25, 1.25)" 
                    d="M1 4A3 3 0 1 0 8 4A3 3 0 1 0 1 4M2.5 4L6.5 4" />
                <path id="${Constants.ID_ICON_MORE}" fill="#fff" fill-opacity="0.8" stroke="#000" stroke-width="1" stroke-opacity="0.6"
                    d="M4 1H7Q10 1 10 4V7Q10 10 7 10H4Q1 10 1 7V4 Q1 1 4 1M4 3L7 5.5L4 8" />
                <path id="${Constants.ID_ICON_NOTES}" fill="#ffd" fill-opacity="0.8" stroke="#000" stroke-width="1" stroke-opacity="0.6"
                    d="M3 1H13L18 6V20H3V1M13 1V6H18M6 4H10M6 7H10M6 10H15M6 13H15M6 16H13" />
                <g id="${Constants.ID_ICON_LINK}">
                    <rect width="20" height="20" rx="3" ry="3" fill="#eee" fill-opacity="0.3" stroke-width="0" />
                    <path fill="none" fill-opacity="0.8" stroke="#000" stroke-width="1.5" stroke-opacity="0.6"
                          d="M9 7L11 5A2 2 0 0 1 15 9L13 11M7 9L5 11A2 2 0 0 0 9 15L11 13M7 13L13 7" />
                </g>
                <path id="priority-1" fill="#f00" fill-opacity="0.8" stroke="#fff" stroke-width="2" stroke-opacity="0.8"
                    d="M1 10A9 9 0 1 1 20 10A9 9 0 1 1 1 10M8 7L10.5 6V16" />
                <path id="priority-2" fill="#f00" fill-opacity="0.8" stroke="#fff" stroke-width="2" stroke-opacity="0.8"
                    d="M1 10A9 9 0 1 1 20 10A9 9 0 1 1 1 10M7 8C10.5 1 20 8 7 14M6 14H16" />
                <path id="priority-3" fill="#f0f" fill-opacity="0.8" stroke="#fff" stroke-width="2" stroke-opacity="0.8"
                    d="M1 10A9 9 0 1 1 20 10A9 9 0 1 1 1 10M7 7C10.5 1 20 8 10 10C21 10 10.5 21 6 12" />
                <path id="priority-4" fill="#f0f" fill-opacity="0.8" stroke="#fff" stroke-width="2" stroke-opacity="0.8"
                    d="M1 10A9 9 0 1 1 20 10A9 9 0 1 1 1 10M12 4Q10 10 6 13M5 13H15M13 8L11 16" />
                <path id="priority-5" fill="#06f" fill-opacity="0.8" stroke="#fff" stroke-width="2" stroke-opacity="0.8"
                    d="M1 10A9 9 0 1 1 20 10A9 9 0 1 1 1 10M9 4Q9 7 8 9M7 9C18 5 16 20 6 14M9 5H14" />
                <path id="priority-6" fill="#06f" fill-opacity="0.8" stroke="#fff" stroke-width="2" stroke-opacity="0.8"
                    d="M1 10A9 9 0 1 1 20 10A9 9 0 1 1 1 10M7 9C13 7 16 13 10 15C4 15 4 9 13 4" />
                <path id="priority-7" fill="#093" fill-opacity="0.8" stroke="#fff" stroke-width="2" stroke-opacity="0.8"
                    d="M1 10A9 9 0 1 1 20 10A9 9 0 1 1 1 10M7 8V6Q11 7 13 6.5Q10 12 9 16" />
                <path id="priority-8" fill="#093" fill-opacity="0.8" stroke="#fff" stroke-width="2" stroke-opacity="0.8"
                    d="M1 10A9 9 0 1 1 20 10A9 9 0 1 1 1 10M10 9C6 8 7 3 12 4C15 5 15 10 10 9C16 10 16 16.5 10 16C4 15 4 9 10 9" />
                <path id="priority-9" fill="#993" fill-opacity="0.8" stroke="#fff" stroke-width="2" stroke-opacity="0.8"
                    d="M1 10A9 9 0 1 1 20 10A9 9 0 1 1 1 10M15 10C6 16 5 3.5 12 4.5C18 6 16 17 7 16" />
                <path id="task-0" fill="#fff" fill-opacity="0.8" stroke="#093" stroke-width="1" stroke-opacity="0.8"
                    d="M1 10A9 9 0 1 1 20 10A9 9 0 1 1 1 10M8 14V5L15 10L8 15V6" />
                <g id="task-1">
                    <circle cx="10.5" cy="10.5" r="10" stroke="none" fill="#093" fill-opacity="0.8" />
                    <path stroke="none" fill="#fff" fill-opacity="0.8" d="M10.5 10.5V2A8.5 8.5 180 1 0 16.5 4.5L10.5 10.5" />
                </g>
                <g id="task-2">
                    <circle cx="10.5" cy="10.5" r="10" stroke="none" fill="#093" fill-opacity="0.8" />
                    <path stroke="none" fill="#fff" fill-opacity="0.8" d="M10.5 10.5V2A8.5 8.5 180 1 0 19 10.5L10.5 10.5" />
                </g>
                <g id="task-3">
                    <circle cx="10.5" cy="10.5" r="10" stroke="none" fill="#093" fill-opacity="0.8" />
                    <path stroke="none" fill="#fff" fill-opacity="0.8" d="M10.5 10.5V2A8.5 8.5 180 1 0 16.5 16.5L10.5 10.5" />
                </g>
                <g id="task-4">
                    <circle cx="10.5" cy="10.5" r="10" stroke="none" fill="#093" fill-opacity="0.8" />
                    <path stroke="none" fill="#fff" fill-opacity="0.8" d="M10.5 10.5V2A8.5 8.5 180 0 0 10.5 19L10.5 10.5" />
                </g>
                <g id="task-5">
                    <circle cx="10.5" cy="10.5" r="10" stroke="none" fill="#093" fill-opacity="0.8" />
                    <path stroke="none" fill="#fff" fill-opacity="0.8" d="M10.5 10.5V2A8.5 8.5 180 0 0 4.5 16.5L10.5 10.5" />
                </g>
                <g id="task-6">
                    <circle cx="10.5" cy="10.5" r="10" stroke="none" fill="#093" fill-opacity="0.8" />
                    <path stroke="none" fill="#fff" fill-opacity="0.8" d="M10.5 10.5V2A8.5 8.5 180 0 0 2 10.5L10.5 10.5" />
                </g>
                <g id="task-7">
                    <circle cx="10.5" cy="10.5" r="10" stroke="none" fill="#093" fill-opacity="0.8" />
                    <path stroke="none" fill="#fff" fill-opacity="0.8" d="M10.5 10.5V2A8.5 8.5 180 0 0 4.5 4.5L10.5 10.5" />
                </g>
                <path id="task-8" fill="#093" fill-opacity="0.8" stroke="#fff" stroke-width="2" stroke-opacity="0.8"
                    d="M1 10A9 9 0 1 1 20 10A9 9 0 1 1 1 10M15 6L10 13L6 9" />
                <path id="task-9" fill="#fff" fill-opacity="0.8" stroke="#093" stroke-width="1" stroke-opacity="0.8"
                    d="M1 10A9 9 0 1 1 20 10A9 9 0 1 1 1 10M7 8A3.5 3.5 0 1 1 10.5 10.5V13M10.5 14V16M9.5 15H11.5" />
                `
            );
        }
    },
    
    priority$translate(_value) {
        _value = parseInt(_value);
        _value = (isNaN(_value) || (_value < 1)) ? 1 : ((_value > 9) ? 9 : _value);
        return _value;
    },

    task$translate (_value, _toDefs) {
        if (_toDefs) {
            let ret = taskMap.indexOf(_value);
            return (ret >= 0) ? ret : 9;
        } else {
            let ret = parseInt(_value);
            return (ret >=0 && ret <= 9) ? taskMap[ret] : taskMap[9];
        }
    }
});
