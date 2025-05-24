"use client";

import { Button } from "primereact/button";
import { useState } from "react";
import FullPageSpinner from "./FullPageSpinner";
import _ from "lodash";


export default function Kripa() {
    const [kripaOfTheDayChapter, setKripaOfTheDayChapter] = useState<number>();
    const [kripaOfTheDayShloka, setKripaOfTheDayShloka] = useState<string>('');
    const [inProgress, setInProgress] = useState<boolean>(false);

    const shlokaMatrix = {
        '7': 30,
        '8': 28,
        '9': 34,
        '10': 42,
        '11': 55,
        '12': 20
    }

    function revealKripaShlokaOfTheDay() {
        setInProgress(true);
        const randomSeconds = Math.floor(Math.random() * (30 - 15 + 1)) + 15;
        setTimeout(async () => {
            const randomChapter = Math.floor(Math.random() * (12 - 7 + 1)) + 7; // between 7 to 12 (most important chapters)
            // const randomChapter = 12;
            setKripaOfTheDayChapter(randomChapter);
            const chapterTotalShlokaCount = _.get(shlokaMatrix, randomChapter.toString(), 20);
            const randomShloka = Math.floor(Math.random() * chapterTotalShlokaCount) + 1;
            // const randomShloka = 11;
            const validShloka = await validateShlokaUrl(randomChapter, randomShloka);
            setKripaOfTheDayShloka(validShloka);
            setInProgress(false);
        }, 1000 * randomSeconds);
    }

    async function validateShlokaUrl(chapter: number, shloka: number) {
        try {
            let url = `https://vedabase.io/en/library/bg/${chapter}/${shloka}/`;
            let res = await fetch(`/api/utils/check-url?url=${encodeURIComponent(url)}`);
            let data = await res.json();
            if (data.exists) {
                return shloka.toString();
            } else {
                url = `https://vedabase.io/en/library/bg/${chapter}/${shloka}-${shloka + 1}/`;
                res = await fetch(`/api/utils/check-url?url=${encodeURIComponent(url)}`);
                data = await res.json();
                if (data.exists) {
                    return `${shloka}-${shloka + 1}`;
                } else {
                    url = `https://vedabase.io/en/library/bg/${chapter}/${shloka - 1}-${shloka}/`;
                    res = await fetch(`/api/utils/check-url?url=${encodeURIComponent(url)}`);
                    data = await res.json();
                    if (data.exists) {
                        return `${shloka - 1}-${shloka}`;
                    } else {
                        return shloka.toString();
                    }
                }
            }
        } catch {
            return shloka.toString();
        }
    }

    return (
        <div className="text-center mt-7">
            {inProgress && <FullPageSpinner message="Take a deep breathe and think of Shri Shri Rādhā Krishna from your heart. Today's message is on it's way." />}
            {
                !kripaOfTheDayChapter || !kripaOfTheDayShloka ?
                    <Button
                        label="Reveal my Kripā - Shloka of the day"
                        icon="pi pi-sparkles"
                        onClick={() => revealKripaShlokaOfTheDay()}
                        className=""
                        size="small"
                        severity="warning"
                    />
                    :
                    <div className="h-[93vh]">
                        <h2 className="text-center font-semibold m-2 text-text">Your Kripā Shloka of the day to guide you is</h2>
                        <strong className="text-hover">from Chapter: {kripaOfTheDayChapter}, Shloka: {kripaOfTheDayShloka}</strong>
                        <br />
                        <iframe
                            src={`https://vedabase.io/en/library/bg/${kripaOfTheDayChapter}/${kripaOfTheDayShloka}/`}
                            width="99%"
                            height="100%"
                            className="rounded-lg block"
                        />
                        <br />
                        <div>
                            <Button
                                label="Share Now"
                                icon="pi pi-share-alt"
                                onClick={() => alert('aa')}
                                className="m-2"
                                size="small"
                                severity="secondary"
                            />
                        </div>
                    </div>
            }
        </div>
    );
}