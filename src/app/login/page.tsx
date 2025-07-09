"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import FullPageSpinner from "@/components/FullPageSpinner";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

declare global {
    interface Window {
        initSendOTP: ({ }) => void;
    }
}

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [authInProgress, setAuthInProgress] = useState<boolean>(false);
    const searchParams = useSearchParams();
    const referralCode: string | null = searchParams.get('ref');
    const source: string | null = searchParams.get('source');
    const guestMode: string | null = searchParams.get('guest');

    const getVerifiedNumber = async (verifiedPhoneAccessToken: string) => {
        setAuthInProgress(true);
        try {
            // use raw axios, not the wrapped one, coz we need to pass the MSG91_SERVER verified phone access-token in the header
            const response = await axios.post(
                '/api/login',
                {
                    ref: referralCode,
                    source
                },
                {
                    headers: {
                        Authorization: `Bearer ${verifiedPhoneAccessToken}`,
                    }
                }
            );
            if (response.status === 200) {
                // call the login hook from useAuth(), which will store access token in localStorae and again call fetchMe() hook with complete devotee details
                login(response.data.accessToken);
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
        <Image
            src="/app-image.jpg"
            alt="Devotees' Association"
            width={240}
            height={240}
            priority
        />
    );

    const title = (
            <>
                {/*<span className="font-bilbo text-7xl text-text">
                    || हरे <span className="text-hover">कृष्ण ||</span>
                    Hare <span className="text-hover">Krishna</span>
                </span>*/}
                <Image
                    className="m-auto"
                    src="/metadata/icon.png"
                    alt="Hare Krishna"
                    width="75"
                    height="75"
                    priority
                />
                <Image
                    className="m-auto"
                    src="/metadata/hero-text.png"
                    alt="Hare Krishna"
                    width="400"
                    height="75"
                    priority
                />
                <Divider align="center" className="without-margin">
                    <span className="p-tag p-tag-warning">where Your Devotion meets Our Association</span>
                </Divider>
            </>
        )
    ;

    const subTitle = (
        <span className="text-sm text-general">
            <br />
            As per&nbsp;
            <a className="hover:text-hover text-text" href="https://vedabase.io/en/library/cc/adi/3/91/" target="_blank"
               rel="noopener noreferrer">
                <span className="underline">Śrī Caitanya-Caritāmṛta Ādi 3.91</span>&nbsp;<span
                className="pi pi-external-link [zoom:0.7]"/>
            </a>
            <br/>
            The devotees of Lord Viṣṇu are godly <span className="text-hover">(dev)</span>
            <br/>
            and Association of Devotees is the heart of Bhakti.
            <br />
            So, come and get associated with us, <span className="text-hover">dev</span>
        </span>
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
            router.push(`/?${searchParams || ''}`);
        } else {
            const script = document.createElement('script');
            script.src = process.env.NEXT_PUBLIC_MSG91_WIDGET_SCRIPT_URL!;
            script.async = true;
            document.body.appendChild(script);
        }
    });

    return (
        <>
            {authInProgress && <FullPageSpinner message="Hare Krishna! OTP verifed. Redirecting to Home Page" />}
            <Card title={title}
                subTitle={subTitle} header={header}
                className="shadow-2xl w-93 md:w-100 text-center component-transparent">
                <div>
                    <Button id="btn-sign-in" label="Login with your Mobile Number" severity="danger" raised
                        icon="pi pi-mobile" loading={authInProgress}
                        onClick={() => initSendOTP(configuration)} />
                    <br />
                    {
                        !guestMode &&
                        <Link href="/?guest=true" className="text-sm block mt-2 underline">explore logged out</Link>
                    }
                </div>
            </Card>
        </>
    );
}