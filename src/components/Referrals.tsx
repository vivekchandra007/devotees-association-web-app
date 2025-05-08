'use client'

import { useEffect, useRef, useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { useAuth } from '@/hooks/useAuth'
import { Toast } from "primereact/toast";
import { MessageSeverity } from "primereact/api";
import api from '@/lib/axios' // your axios wrapper
import { QRCodeCanvas } from 'qrcode.react'
import { Dialog } from 'primereact/dialog'

export default function Referrals() {

    const { devotee } = useAuth();
    const toast = useRef<Toast>(null);
    const [referredList, setReferredList] = useState([])
    const [showQR, setShowQR] = useState(false)
    const referralLink = `${window.location.origin}/?ref=${devotee?.id}`

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(referralLink);
        toast.current?.show({
            severity: MessageSeverity.SUCCESS,
            detail: 'Referral link copied!',
            life: 4000
        });
    }

    useEffect(() => {
        if (devotee?.id) {
            api.get(`devotee/referrals/${devotee.id}`).then((res) => {
                setReferredList(res.data)
            })
        }
    }, [devotee?.id])

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-lg font-semibold">Your Personal Referral Link and QR Code</h2>
            <div className="flex gap-2 items-center">
                <Button
                    icon="pi pi-qrcode"
                    className="p-button-secondary"
                    onClick={() => setShowQR(true)}
                    tooltip="Show QR Code"
                />
                <InputText value={referralLink} readOnly className="w-full" />
                <Button icon="pi pi-copy" onClick={copyToClipboard} tooltip="Copy" />
            </div>

            <Dialog
                header="Share via QR Code"
                visible={showQR}
                onHide={() => setShowQR(false)}
                modal
            >
                <div className="flex justify-center">
                    <QRCodeCanvas value={referralLink} size={200} />
                </div>
            </Dialog>

            <small>Note: You can share the above QR code or link with anyone, over any platform and if they login using this link, they will appear in below list</small>


            <h2 className="text-lg font-semibold mt-4">Referred Devotees</h2>
            {referredList.length > 0 ? (
                <ul className="list-disc ml-5">
                    {/* {referredList.map((ref) => (
                        <li key={ref.id}>{ref.name || ref.phone}</li>
                    ))} */}
                </ul>
            ) : (
                <p>No referrals yet.</p>
            )}
            <Toast ref={toast} position="bottom-center" />
        </div>
    )
}