"use client";

import React, {useState, useEffect} from "react";
import { Chart } from "primereact/chart";
import {ProgressBar} from "primereact/progressbar";
import api from "@/lib/axios";
import Image from "next/image";

type GroupedDonation = {
    phone?: string | undefined;
    name?: string | undefined;
    totalAmount?: number | undefined;
    donationCount?: number | undefined;
    devoteeId?: number | undefined;
};

const ranges = [
    { label: "All Time", value: "all" },
    { label: "Current Week", value: "week" },
    { label: "Current Month", value: "month" },
    { label: "Current Year", value: "year" },
];

export default function ReportsDashboard() {
    const [inProgress, setInProgress] = useState<boolean>(false);
    const [selectedRange, setSelectedRange] = useState<"all" | "week" | "month" | "year">("all");
    const [totalAmount, setTotalAmount] = useState<number | null>(null);
    const [donationsCount, setDonationsCount] = useState<number | null>(null);
    const [topDevoteesByDonationAmount, setTopDevoteesByDonationAmount] = useState([]);
    const [lineChartData, setLineChartData] = useState<{ date: string; amount: number }[]>([]);

    const fetchDonationsSummary = async () => {
        setInProgress(true);
        try {
            const res = await api.get(`/reports/donations-summary?range=${selectedRange}`);
            if (res.data.success) {
                setTotalAmount(res.data.totalAmount.amount);
                setDonationsCount(res.data.count.id);
            }
        } catch (err) {
            console.error('Failed to load donation data:', err);
        } finally {
            setInProgress(false);
        }
    };

    const fetchTopDevoteesByDonationAmount = async () => {
        setInProgress(true);
        try {
            const res = await api.get(`/reports/top-devotees-by-donations?range=${selectedRange}`);
            if (res.data.success) {
                setTopDevoteesByDonationAmount(res.data.topDevotees);
            }
        } catch (err) {
            console.error('Failed to load donation data:', err);
        } finally {
            setInProgress(false);
        }
    };

    const fetchDonationsLineSummary = async () => {
        setInProgress(true);
        try {
            const res = await api.get(`/reports/donations-line-summary?range=${selectedRange}`);
            if (res.data.success) {
                setLineChartData(res.data.data);
            }
        } catch (err) {
            console.error('Failed to load donation data:', err);
        } finally {
            setInProgress(false);
        }
    };

    useEffect(() => {
        fetchDonationsSummary().then(
            () =>  {
                fetchTopDevoteesByDonationAmount().then( () => fetchDonationsLineSummary());
            }
        );
    }, [selectedRange]);


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
                A consolidated place for all the Reports, giving a high level view of everything.
            </small>
            <div className="flex gap-2 my-4">
                {ranges.map((r) => (
                    <button
                        key={r.value}
                        onClick={() => setSelectedRange(r.value as "all" | "week" | "month" | "year")}
                        className={`px-3 py-1 w-[24%] text-sm rounded-full border cursor-pointer ${
                            selectedRange === r.value
                                ? "bg-hover text-white border-hover"
                                : "text-gray-600 border-gray-300"
                        }`}
                    >
                        {r.label}
                    </button>
                ))}
            </div>
            {/* Total Widget */}
            <div
                className="bg-yellow-50 text-yellow-900 border-l-4 border-yellow-500 p-4 rounded-lg shadow flex justify-between items-center max-w-md">
                {
                    donationsCount && donationsCount > 0 ?
                        <div>
                            <p className="text-sm">Total <strong>{donationsCount ?? '**'}</strong> Donations amounting
                                to</p>
                            <p className="text-2xl font-bold">₹ {(totalAmount ?? '****').toLocaleString("en-IN")}</p>
                        </div>
                        :
                        <div>
                            <p className="text-2xl font-bold">No Donations</p>
                        </div>
                }
                <Image src="/money-bag.png" alt="money" width="70" height="70"/>
            </div>

            <br/>

            {/* 📈 Top 10 Devotees (by donation amount) */}
            {
                topDevoteesByDonationAmount && Array.isArray(topDevoteesByDonationAmount) && topDevoteesByDonationAmount.length > 0 &&
                <div className="card overflow-x-auto max-w-[90vw] my-4">
                    <h2 className="font-semibold mb-2">📈 Top 10 Devotees (by donation amount)</h2>
                    <Chart
                        type="bar"
                        data={{
                            labels: topDevoteesByDonationAmount.map((d: GroupedDonation) => `${d.name ?? ''} (${d.donationCount ?? ''})`),
                            datasets: [{
                                label: "Total donations by a devotee",
                                data: topDevoteesByDonationAmount.map((d: GroupedDonation) => d.totalAmount),
                                indexAxis: 'y',
                                backgroundColor: [
                                    'rgba(255, 159, 64, 1)',
                                    'rgba(255, 159, 64, 0.9)',
                                    'rgba(255, 159, 64, 0.8)',
                                    'rgba(255, 159, 64, 0.7)',
                                    'rgba(255, 159, 64, 0.6)',
                                    'rgba(255, 159, 64, 0.5)',
                                    'rgba(255, 159, 64, 0.4)',
                                    'rgba(255, 159, 64, 0.3)',
                                    'rgba(255, 159, 64, 0.2)',
                                    'rgba(255, 159, 64, 0.1)',
                                ],
                                borderColor: [
                                    'rgba(255, 159, 64)',
                                    'rgba(255, 159, 64)',
                                    'rgba(255, 159, 64)',
                                    'rgba(255, 159, 64)',
                                    'rgba(255, 159, 64)',
                                    'rgba(255, 159, 64)',
                                    'rgba(255, 159, 64)',
                                    'rgba(255, 159, 64)',
                                    'rgba(255, 159, 64)',
                                    'rgba(255, 159, 64)',
                                ],
                                borderWidth: 1
                            }]
                        }}
                    />
                </div>
            }

            <br/>

            {/* 📈 Donations Over Time */}
            {
                lineChartData && Array.isArray(lineChartData) && lineChartData.length > 0 &&
                <div className="card overflow-x-auto max-w-[90vw] my-4">
                    <h2 className="text-lg font-semibold mb-4">📈 Donations Over Time</h2>
                    <Chart
                        type="line"
                        data={{
                            labels: lineChartData.map((item) => new Date(item.date).toLocaleDateString("en-IN")),
                            datasets: [
                                {
                                    label: "Total Donations Collected (day wise)",
                                    data: lineChartData.map((item) => item.amount),
                                    fill: false,
                                    borderColor: "rgba(255, 159, 64, 1)",
                                    backgroundColor: "rgba(255, 159, 64, 0.5)",
                                    tension: 0.3,
                                },
                            ],
                        }}
                        options={{
                            responsive: true,
                            plugins: {
                                legend: {
                                    position: "top",
                                },
                            },
                        }}
                    />
                </div>
            }
        </div>
    );
}