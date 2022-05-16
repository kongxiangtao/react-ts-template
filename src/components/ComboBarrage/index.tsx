import { FC, useEffect, useState, memo, useRef } from 'react';
import AnimatedNumber from 'react-animated-number-ts';
import { v4 as uuidv4 } from 'uuid';
import produce from "immer";
import 'animate.css';
import './style.less';

const ComboBarrage: FC = () => {
    const queueListRef = useRef<BarrageItemProps[]>([]);
    const [barrageList, setBarrageList] = useState<BarrageItemProps[]>([]);

    useEffect(() => {
        const timer = setInterval(() => {
            if (queueListRef.current.length > 0 && barrageList.length < 3) {
                // console.log('interval queueListRef Size', queueListRef.current.length);
                const msg = queueListRef.current.shift();
                if (msg !== undefined) {
                    setBarrageList(
                        produce((draft) => {
                            draft.push(msg);
                        })
                     );
                }
            }
        }, 800);

        return () => {
            clearInterval(timer);
        };
    }, []);

    const getRandomInt = (min: number, max: number) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    const done = (msgId: string) => {
        setBarrageList(
            produce((draft) => {
                draft.shift();
            })
           );
        // console.log('done shift barrageList', msgId);
    };

    const addBarrage = () => {
        const msgId = uuidv4();
        setBarrageList([
            ...barrageList,
            { name: 'Barrage ', value: getRandomInt(1, 60), msgId, done }
        ]);
    };

    const addQueue = () => {
        let i = 0;
        while (queueListRef.current.length < 50) {
            const msgId = uuidv4();
            queueListRef.current.push({
                name: `Queue ${i++}`,
                value: getRandomInt(1, 60),
                msgId,
                done
            });
        }
    };

    return (
        <>
            <div className="barrage-box">
                {barrageList.map((item, index) => {
                    return <BarrageItem key={item.msgId} {...item} />;
                })}
            </div>
            <div>
                <button onClick={addBarrage}>add barrage</button>
                <button onClick={addQueue}>add queue</button>
                <button
                    onClick={() => {
                        setBarrageList([]);
                        queueListRef.current = [];
                    }}
                >
                    Rest
                </button>
            </div>
            <div>barrageList Size: {barrageList.length}</div>
        </>
    );
};

export interface BarrageItemProps {
    msgId: string;
    name: string;
    value: number;
    done?: (msgId: string) => void;
}

const BarrageItem: FC<BarrageItemProps> = (props) => {
    const [value, setValue] = useState(props.value);
    const [animateClass, setAnimateClass] = useState('animate__fadeInLeftBig');

    useEffect(() => {
        const timeout = setTimeout(() => {
            setValue(value + 10);
        }, 800);

        const timoutDone = setTimeout(() => {
            props?.done?.(props.msgId);
            // console.log('timoutDone', props.msgId);
        }, 4000);

        return () => {
            clearTimeout(timeout);
            clearTimeout(timoutDone);
        };
    }, []);

    return (
        <div
            className={`barrage-item animate__animated ${animateClass}`}
            onAnimationEnd={(e) => {
                if (e.animationName === 'fadeInLeftBig') {
                    setAnimateClass('animate__fadeOutUp animate__delay-1s');
                    // setAnimateClass('animate__backOutRight animate__delay-2s');
                } else {
                    props?.done?.(props.msgId);
                }
            }}
        >
            <div>{props.name}:</div>
            <div>
                <AnimatedNumber
                    value={value}
                    style={{
                        transition: '0.8s ease-out',
                        fontSize: 38,
                        transitionProperty: 'background-color, color, opacity'
                    }}
                    frameStyle={(perc) => (perc === 100 ? {} : { fontSize: 48 })}
                    duration={300}
                    formatValue={(n) => {
                        return `${Math.floor(n)}x`;
                    }}
                    stepPrecision={1}
                />
            </div>
        </div>
    );
};

export default memo(ComboBarrage);
