interface queueI {
    name?: string; // 用户昵称
    comment?: string; // 评论内容
    isMe?: boolean; // 是否自己发送的弹幕
    tagIndex?: number; // 标签索引，可自定义，默认情况 0-主播，1-号主，2-粉丝
    systemInfo?: string; // 系统提示消息，如果存在这个属性，则前面四个属性无需存在
    weight: number;
}
const DEFAULT_CONFIG = {
    INTERVAL: 300, // 刷新频率，默认300ms
    BARRAGE_MAX_COUNT: 50, // 上屏弹幕的最大数量
    POOL_MAX_COUNT: 50, // 弹幕池（未上屏）弹幕上限
    BARRAGE_MAX_FRAME: 6, // 屏控处理，每次同时上屏弹幕的数量
    SLEEP_TIME: 5000, // 弹幕休眠时间，默认5000ms
    CHECK_SLEEP: true // 是否休眠，休眠超过 SLEEP_TIME ，则开启自动滚动
};

const DEFAULT_SYSTEM_HINT =
    '系统提示：欢迎来到直播间！直享倡导绿色直播，文明互动，购买直播推荐商品时，请确认购买链接描述与实际商品一致，避免上当受骗。如遇违法违规现象，请立即举报！';

const TAG_DEFAULT_CONFIG = [
    {
        bgColor: 'linear-gradient(to right, #fb3e3e, #ff834a)',
        tagName: '主播'
    },
    {
        bgColor: 'linear-gradient(to top, #ffb365, #ff8c17)',
        tagName: '号主'
    },
    {
        bgColor: 'linear-gradient(to left, #8bb1ff, #5195ff)',
        tagName: '粉丝'
    }
];

const CONTENT_FIELD = 'comment';
const REG_MEANINGLESS = /^[\d\s\!\@\#\$\%\^\&\*\(\)\-\=]+$/;
// 权重计算规则
const rules = [
    function meaningless(this: any, weight: number) {
        return this[CONTENT_FIELD] && REG_MEANINGLESS.test(this[CONTENT_FIELD])
            ? weight - 0.5
            : weight;
    },
    function barrage2short(this: any, weight: number) {
        return this[CONTENT_FIELD] && this[CONTENT_FIELD].length < 3 ? weight - 0.2 : weight;
    }
];

export default class QueueBarrage {
    queueList: queueI[]; // 弹幕池，包括所有弹幕
    barrageList: queueI[]; // 上屏弹幕
    changeCallback?: Function; // 弹幕上屏回调
    config; // 配置信息
    isPaused: boolean; // 弹幕是否暂停
    isActive: boolean; // 弹幕是否休眠
    timer: any; // 定时器
    private checkActiveTimer: any;

    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.queueList = [];
        this.barrageList = [];
        this.isPaused = false;
        this.isActive = false;
        this.flush();
    }

    barrageEnterQueue(queue: queueI[], isFilter = true) {
        queue.forEach((v) => {
            this.queueList.push(v);
        });
        // 进入直播间历史弹幕不进行过滤
        if (this.queueList.length > this.config.POOL_MAX_COUNT) {
            if (isFilter) this.queueList = this.filter(this.queueList, this.config.POOL_MAX_COUNT);
            else this.queueList.splice(0, this.queueList.length - this.config.POOL_MAX_COUNT);
        }
        if (!this.isPaused) {
            !this.timer && this.flush();
        }
    }

    public filter(barrages: queueI[], limit: number) {
        barrages.forEach((barrage) => {
            barrage.weight = rules.reduce((weight, rule) => {
                return rule.call(barrage, weight);
            }, 1);
        });
        return barrages.sort((a, b) => b.weight - a.weight).slice(barrages.length - limit);
    }

    private flush() {
        this.timer = setTimeout(() => {
            if (this.queueList.length > 0) {
                // 从弹幕池中取弹幕
                this.barrageList = [
                    ...this.barrageList,
                    ...this.queueList.splice(0, this.config.BARRAGE_MAX_FRAME)
                ];

                // 判断上屏弹幕是否超过最大限制，如超过，删除旧弹幕
                if (this.barrageList.length > this.config.BARRAGE_MAX_COUNT) {
                    this.barrageList.splice(
                        0,
                        this.barrageList.length - this.config.BARRAGE_MAX_COUNT
                    );
                }
                // 弹幕上屏
                this.barrageList.length > 0 &&
                    this.changeCallback &&
                    this.changeCallback(this.barrageList);
            }
            this.flush();
        }, this.config.INTERVAL);
    }

    // 弹幕上屏回调函数赋值
    emitQueueChange(cb: Function) {
        this.changeCallback = cb;
    }
    // 自己的弹幕直出
    barrageEnterQueueSelf(queue: queueI) {
        this.barrageList.push(queue);
        this.changeCallback && this.changeCallback(this.barrageList);
    }
    // 检查弹幕是否激活
    setActiveAndAutoRestart() {
        // 如果没有开启
        if (!this.config.CHECK_SLEEP) return;
        if (this.checkActiveTimer) {
            clearTimeout(this.checkActiveTimer);
        }
        this.checkActiveTimer = setTimeout(() => {
            this.restart();
        }, this.config.SLEEP_TIME);
    }

    // 弹幕暂停滚动
    pause() {
        if (this.isPaused) return;
        this.isPaused = true;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        this.setActiveAndAutoRestart();
    }

    // 弹幕重新开始滚动
    restart() {
        if (!this.isPaused) return;
        this.isPaused = false;
        this.queueList.length && this.flush();
    }
}
