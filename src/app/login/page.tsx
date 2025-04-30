"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";

declare global {
    interface Window {
        initSendOTP: ({}) => void;
    }
}


export default function LoginPage() {
    const [authInProgress, setAuthInProgress] = useState<boolean>(false);

    const header = (
        <Image
            src="/app-image.jpg"
            alt="Devotees' Association"
            width={500}
            height={500}
            priority
        />
    );

    const title = (
        <span className="text-3xl font-light text-indigo-900">
            <span className="text-orange-400">Dev</span>otees&apos;&nbsp; 
            <span className="text-orange-400">Association</span>
            <Divider align="center">
                <a className="hover:underline"href="https://vedabase.io/en/library/cc/adi/3/91/" target="_blank" rel="noopener noreferrer">
                    <span className="p-tag p-tag-warning">विष्णु-भक्तः स्मृतो दैव</span>
                </a>
            </Divider>
        </span>
    );

    const subTitle = (
        <span className="text-sm text-gray-700">
            Hare Krishna 🙏🏼
            <br />
            As mentioned in&nbsp;
            <a className="hover:underline text-indigo-950"href="https://vedabase.io/en/library/cc/adi/3/91/" target="_blank" rel="noopener noreferrer">
            Śrī Caitanya-Caritāmṛta Ādi 3.91 &nbsp;<i className="pi pi-external-link"></i>
            </a>
            <br />
            The devotees of Lord Viṣṇu are godly <span className="text-orange-400">(dev)</span>.
            <br />and we know Association of Devotees is one of the most important activity in Bhakti.
            <br />
            So, let us connect with you, <span className="text-orange-400">dev</span>
        </span>
    );
    const footer = (
        <div>
            <small>
                <Divider align="center" color="orange">
                </Divider>
                <span className="flex justify-content-space-between">
                    <a href="https://iskconpunebcec.com/#/Home" target="_blank" rel="noopener noreferrer"className="hover:underline">
                        ISKCON BCEC
                    </a>
                    <a href="https://iskconpunebcec.com/#/newtemple" className="hover:underline" target="_blank" rel="noopener noreferrer">
                        NEW TEMPLE
                    </a>
                </span>
            </small>
        </div>
    );

    const configuration = {
        widgetId: process.env.NEXT_PUBLIC_MSG91_WIDGET_ID!,
        tokenAuth: process.env.NEXT_PUBLIC_MSG91_AUTH_KEY!,
        success: (data: { message: string, type: string }) => {
            // get verified token in response
            setAuthInProgress(false);
            console.log('success response', data);
        },
        failure: (error: { code: string, message: string }) => {
            setAuthInProgress(false);
            console.log('failure reason', error);
        },
    };

    function initSendOTP(configuration: { widgetId: string; tokenAuth: string; success: (data: { message: string, type: string }) => void; failure: (error: { code: string, message: string }) => void; }): void {
        if (typeof window !== 'undefined' && window.initSendOTP) {
            const sendOTP = window.initSendOTP;
            setAuthInProgress(true);
            sendOTP({
                widgetId: configuration.widgetId,
                tokenAuth: configuration.tokenAuth,
                success: configuration.success,
                failure: configuration.failure,
            });
        } else {
            console.error('SendOTP script is not loaded or unavailable.');
        }
    }
    useEffect(() => {
        const script = document.createElement('script');
        script.src = process.env.NEXT_PUBLIC_MSG91_WIDGET_SCRIPT_URL!;
        script.async = true;
        document.body.appendChild(script);
    }, []);

    return (
        <div className="grid items-center justify-items-center min-h-screen">
            <div className="row-start-2">  
                <Card title={title}
                    subTitle={subTitle} footer={footer} header={header}
                    className="shadow-2xl w-93 md:w-110 text-center card-transparent">
                    <div>
                        <Button id="btn-sign-in" label="Login with your Mobile Number" severity="danger" raised
                            icon="pi pi-mobile" loading={authInProgress}
                            onClick={() => initSendOTP(configuration)} />
                    </div>
                </Card>
            </div>
        </div>
    );
}