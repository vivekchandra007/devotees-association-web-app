'use client'

import React, { useEffect, useRef, useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { useAuth } from '@/hooks/useAuth'
import { Toast } from "primereact/toast";
import { MessageSeverity } from "primereact/api";
import api from '@/lib/axios' // your axios wrapper
import { QRCodeCanvas } from 'qrcode.react'
import { DataTable } from 'primereact/datatable'
import { Column } from "primereact/column";
import { formatDateIntoStringddmmyyyy } from "@/lib/conversions";
import { Prisma } from "@prisma/client";
import { Card } from "primereact/card";

type Devotee = Prisma.devoteesGetPayload<{
    include: {
        system_role_id_ref_value: {
            select: {
                name: true,
            };
        },
        spiritual_level_id_ref_value: {
            select: {
                title_male: true,
                title_female: true,
                title_other: true
            };
        },
        source_id_ref_value: {
            select: {
                name: true,
                description: true,
            }
        },
        counsellor_id_ref_value: {
            select: {
                id: true,
                name: true
            }
        },
        leader_id_ref_value: {
            select: {
                id: true,
                name: true
            }
        },
        referred_by_id_ref_value: {
            select: {
                id: true,
                name: true
            }
        }
    };
}>;

export default function Referrals() {
    const { devotee } = useAuth();
    const toast = useRef<Toast>(null);
    const [inProgress, setInProgress] = useState(false);
    const [referredDevotees, setReferredDevotees] = useState([])
    const referralLink = `${window.location.origin}/?ref=${generateAppendCode() + devotee?.id}`;

    const referralMessage = `🛑 Stop the endless scroll — Reels, Shorts, and random online junk are toxic.
🌟 Finally, we have an app that’s actually worth your time — a Spiritual Network for Devotees. 🙏
Join me on HareKrishna.app using my personal link: ${referralLink}
⏳ Don’t miss out — we’re connecting and growing every single day!
🌸 HareKrishna.app — where Your Devotion meets Our Association.`;

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(referralLink);
        toast.current?.show({
            severity: MessageSeverity.SUCCESS,
            detail: 'Referral link copied!',
            life: 4000
        });
    }

    function generateAppendCode(length = 11) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }

    const encodedMsg = encodeURIComponent(referralMessage);

    function shareWhatsApp() {
        window.open(`https://wa.me/?text=${encodedMsg}`, '_blank');
    }

    function shareTelegram() {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodedMsg}`, '_blank');
    }

    function shareEmail() {
        window.location.href = `mailto:?subject=Join HareKrishna.app&body=${encodedMsg}`;
    }

    function shareFacebook() {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank');
    }

    function shareTwitter() {
        window.open(`https://twitter.com/intent/tweet?text=${encodedMsg}`, '_blank');
    }

    function nativeShare() {
        if (navigator.share) {
            navigator.share({
                title: "HareKrishna.app",
                text: referralMessage,
                url: referralLink,
            });
        } else {
            alert("Sharing not supported on this browser.");
        }
    }

    useEffect(() => {
        const fetchReferrals = async () => {
            if (!devotee && inProgress) return;

            try {
                setInProgress(true);
                const res = await api.get(`devotee/referrals`);
                if (res && res.data && res.data.success && res.data.referredDevotees) {
                    setReferredDevotees(res.data.referredDevotees);
                }
            } catch (err) {
                console.error('Failed to load referrals data:', err);
            } finally {
                setInProgress(false);
            }
        }
        fetchReferrals();
    }, [devotee]);

    const nameWithLink = (rowData: Devotee) => {
        return (
            <a href={`/devotee?devoteeId=${rowData.id}`} rel="noopener noreferrer" className="text-hover underline">
                {rowData.name}
            </a>
        );
    };
    const dateFormatted = (rowData: Devotee) => {
        return (
            <span>{formatDateIntoStringddmmyyyy(new Date(rowData.created_at!))}</span>
        );
    };
    const phoneFormatted = (rowData: Devotee) => {
        return (
            <span>{rowData.phone?.slice(-10)}</span>
        );
    };

    return (
        <div className="space-y-4">
            <h2 className="text-sm lg:text-base font-semibold">1. Shareable personal QR Code and Referral Link</h2>
            <Card className="shadow-2xl text-center component-transparent m-auto">
                <div className="flex justify-center mb-6">
                    <QRCodeCanvas value={referralLink} size={110} />
                </div>
                <div className="grid grid-cols-12 items-center justify-center gap-2 md:w-[70%] lg:w-[60%] m-auto">
                    <InputText value={referralLink} readOnly className="col-span-7" />
                    <Button icon="pi pi-copy" onClick={copyToClipboard} tooltip="Copy" label="Copy" size="small" className="col-span-5" />
                </div>

                <br />
                <div className="text-sm lg:text-base text-general">Share the above QR or Link with others.
                    <br />Whoever registers through it will be lovingly connected to you forever, in their path to devotion.
                    <br />So, let&apos;s spread the
                    word{devotee?.gender ? `, ${devotee.spiritual_level_id_ref_value[`title_${devotee?.gender}`]}` : ''} 🙏🏻
                </div>
                <br />

                <p>Also, one click easy share via:</p>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    <Button label="WhatsApp" icon="pi pi-whatsapp" className="p-button-success"
                        onClick={() => shareWhatsApp()} />

                    <Button label="Telegram" icon="pi pi-send" className="p-button-info"
                        onClick={() => shareTelegram()} />

                    <Button label="Email" icon="pi pi-envelope" severity="secondary"
                        onClick={() => shareEmail()} />

                    <Button label="Facebook" icon="pi pi-facebook" severity="info"
                        onClick={() => shareFacebook()} />

                    <Button label="Twitter" icon="pi pi-twitter" severity="contrast"
                        onClick={() => shareTwitter()} />

                    {
                        /* @ts-expect-error "it works well to not show this share option for unsupported browsers, like firefox" */
                        navigator.share &&
                        <Button label="More..." icon="pi pi-share-alt" severity="danger"
                            onClick={nativeShare} />
                    }
                </div>
            </Card>

            <h2 className="text-sm lg:text-base font-semibold mt-4">2. Your referred devotees</h2>
            {
                referredDevotees && Array.isArray(referredDevotees) && referredDevotees.length > 0 ?
                    <Card className="shadow-2xl text-center component-transparent m-auto">
                        <DataTable value={referredDevotees} className="text-sm">
                            <Column field="name" header="Name" body={nameWithLink} />
                            <Column field="phone" header="Phone" body={phoneFormatted} />
                            <Column field="created_at" header="Joined" body={dateFormatted} />
                        </DataTable>
                    </Card>
                    : "No referrals yet."
            }
            <Toast ref={toast} position="bottom-center" />
        </div>
    )
}