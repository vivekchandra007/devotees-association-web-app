"use client";

import { useState } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import api from '@/lib/axios'
import {formatDateIntoStringddmmyyyy} from "@/lib/conversions";
import {useAuth} from "@/hooks/useAuth";
import {Prisma} from "@prisma/client";
import {ProgressBar} from "primereact/progressbar";

type Donation = Prisma.donationsGetPayload<{
    include: {
        phone_ref_value: {
            select: {
                id: true,
                name: true
            }
        }
    };
}>;

export default function DonationsPage() {
    const { devotee} = useAuth();
    const [myDonations, setMyDonations] = useState<Donation[] | null>([]);
    const [inProgress, setInProgress] = useState<boolean>(false);

    const fetchDonations = async () => {
        if (inProgress) return; // Prevent multiple fetches if already in progress

        try {
            setInProgress(true);
            const res = await api.get('/donations', {
                params: {
                    query: devotee?.phone
                },
            });
            if (res && res.status === 200 && res.data && Array.isArray(res.data) && res.data.length > 0) {
                setMyDonations(res.data);
            } else {
                throw new Error('Failed to fetch donations');
            }
        } catch {
            setMyDonations(null);
        } finally {
            setInProgress(false);
        }
    }

    useState(() => {
        fetchDonations();
    })

    const dateFormatted = (rowData: Donation) => {
        return (
            <span>{formatDateIntoStringddmmyyyy(rowData.date!)}</span>
        );
    };
    const amountFormatted = (rowData: Donation) => {
        return (
            <span className="text-general">{rowData.amount ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(rowData.amount) : 'N/A'}</span>
        );
    };

    return (
        <div className="h-full w-full component-transparent">
            {
                inProgress ?
                    <ProgressBar mode="indeterminate" style={{height: '2px'}} className="pt-1"></ProgressBar>
                    :
                    <hr/>
            }
            <div className='p-3'>
                <div className="card overflow-x-auto max-w-[90vw] mt-4">
                    {
                        (myDonations && Array.isArray(myDonations) && myDonations.length > 0) ?
                            <>
                                <h2 className="text-xl font-bold">Below are donations done by you, registered under
                                    phone
                                    number {devotee?.phone?.slice(2)}</h2>
                                <DataTable value={myDonations!} paginator rows={10} stripedRows size="small">
                                    <Column header="Date" body={dateFormatted}/>
                                    <Column field="donation_receipt_number" header="Receipt No."/>
                                    <Column header="Amount" body={amountFormatted}/>
                                    <Column field="payment_mode" header="Mode"/>
                                </DataTable>
                            </> :
                            <>
                                <h2 className="text-xl font-bold">No donation exit
                                    <br />
                                    <small>that is registered under phone number {devotee?.phone?.slice(2)}</small>
                                </h2>
                                <small>A donation typically takes a week to reflect here.</small>
                            </>
                    }
                </div>
            </div>
        </div>
    )
}