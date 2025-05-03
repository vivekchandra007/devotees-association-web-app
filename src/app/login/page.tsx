"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import axios from "axios";
import { useRouter } from "next/navigation";
import FullPageSpinner from "@/components/FullPageSpinner";
import { useAuth } from "@/hooks/useAuth";

declare global {
    interface Window {
        initSendOTP: ({ }) => void;
    }
}

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [authInProgress, setAuthInProgress] = useState<boolean>(false);

    const getVerifiedNumber = async (verifiedPhoneAccessToken: string) => {
        setAuthInProgress(true);
        try {
            // use raw axios, not the wrapped one, coz we need to pass the MSG91_SERVER verified phone access-token in the header
            const response = await axios.post(
                '/api/login',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${verifiedPhoneAccessToken}`,
                    }
                }
            ); 
            if (response.status === 200) {
                // call the login hook from useAuth()
                login(response.data.accessToken, response.data.devotee);
            } else {
                console.log('Error verifying phone number:', response);
            }
        } catch (error: unknown) {
            console.log('Error verifying phone number:', error);
        } finally {
            setAuthInProgress(false);
        }
    };

    const header = (
        <div className="max-h-[240px] max-w-[240px] m-auto">
            <Image
                className="rounded-full border-2 border-yellow-500"
                src="/app-image.jpg"
                alt="Devotees' Association"
                width={240}
                height={240}
                priority
            />
        </div>
    );

    const title = (
        <span className="text-3xl font-light text-indigo-900">
            <span className="text-orange-500">Dev</span>otees&apos;&nbsp;
            <span className="text-orange-500">Association</span>
            <Divider align="center">
                <a className="hover:underline" href="https://vedabase.io/en/library/cc/adi/3/91/" target="_blank" rel="noopener noreferrer">
                    <span className="p-tag p-tag-warning">विष्णु-भक्तः स्मृतो दैव</span>
                </a>
            </Divider>
        </span>
    );

    const subTitle = (
        <span className="text-sm text-gray-900">
            Hare Krishna 🙏🏼
            <br />
            As mentioned in&nbsp;
            <a className="hover:underline text-indigo-950" href="https://vedabase.io/en/library/cc/adi/3/91/" target="_blank" rel="noopener noreferrer">
                Śrī Caitanya-Caritāmṛta Ādi 3.91 &nbsp;<i className="pi pi-external-link"></i>
            </a>
            <br />
            The devotees of Lord Viṣṇu are godly <span className="text-orange-600">(dev)</span>.
            <br />and we already know Association of Devotees is one of the most important activity in Bhakti.
            <br />
            So, let us connect with you, <span className="text-orange-600">dev</span>
        </span>
    );
    const footer = (
        <div>
            <small>
                <Divider align="center">
                </Divider>
                <span className="flex justify-content-space-between text-orange-600">
                    <a href="https://iskconpunebcec.com/#/Home" target="_blank" rel="noopener noreferrer" className="hover:underline">
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
            if (data.type === 'success') {
                getVerifiedNumber(data.message);
            }
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
            console.log('SendOTP script is not loaded or unavailable.');
        }
    }
    useEffect(() => {
        // Redirect to home page if already has some access token, even if expired. Homepage will check if the token is valid or not and redirect to login page if not valid.
        if (localStorage.getItem('access_token')) {
            router.push('/');
        } else {
            const script = document.createElement('script');
            script.src = process.env.NEXT_PUBLIC_MSG91_WIDGET_SCRIPT_URL!;
            script.async = true;
            document.body.appendChild(script);
        }
    });

    return (
        <div className="grid items-center justify-items-center min-h-screen">
            {authInProgress && <FullPageSpinner message="Hare Krishna! OTP verifed. Redirecting you to Home Page" />}
            <div className="">
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