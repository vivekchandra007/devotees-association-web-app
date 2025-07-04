"use client";

import React, {useState, useEffect} from "react";
import { Chart } from "primereact/chart";
import {ProgressBar} from "primereact/progressbar";
import api from "@/lib/axios";

type GroupedDonation = {
    phone?: string | undefined;
    name?: string | undefined;
    totalAmount?: number | undefined;
    donationCount?: number | undefined;
    devoteeId?: number | undefined;
};

export default function ReportsDashboard() {
    const [inProgress, setInProgress] = useState<boolean>(false);

    const [donations, setDonations] = useState([]);


    useEffect(() => {
        const fetchDonations = async () => {
            if (inProgress) return;

            setInProgress(true);
            try {
                const res = await api.get('/reports/donations');
                if (res.data.success) {
                    setDonations(res.data.data);
                }
            } catch (err) {
                console.error('Failed to load donation data:', err);
            } finally {
                setInProgress(false);
            }
        };
        fetchDonations();
    }, []);


    return (
        <div className="p-3 mih-h-screen">
            <strong className="text-general">Reports Dashboard</strong>
            {
                inProgress ?
                    <ProgressBar mode="indeterminate" style={{height: '2px'}} className="pt-1"></ProgressBar>
                    :
                    <hr/>
            }
            <small className="text-general">
                A consolidated place for all the Reports, giving a high level view of everything. You can also create
                custom graphs
            </small>

            {
                donations && Array.isArray(donations) && donations.length > 0 &&
                <>
                    <div className="card overflow-x-auto max-w-[90vw] my-4">
                        <h2 className="font-semibold mb-2">📈 Donations Overview</h2>
                        <Chart
                            type="bar"
                            data={{
                                labels: donations.map((d:GroupedDonation) => `${d.name ?? ''} (${d.phone?.slice(-10)}) - ${d.donationCount} donations`),
                                datasets: [{
                                    label: "Total donations made by an individual",
                                    data: donations.map((d:GroupedDonation) => d.totalAmount),
                                    backgroundColor: "#4f46e5"
                                }],
                            }}
                        />
                    </div>
                </>
            }
        </div>
    );
}