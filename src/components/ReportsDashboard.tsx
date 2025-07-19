"use client";

import React, {useState, useEffect} from "react";
import { Chart } from "primereact/chart";
import {ProgressBar} from "primereact/progressbar";
import api from "@/lib/axios";
import Image from "next/image";
import {Calendar} from "primereact/calendar";
import {Nullable} from "primereact/ts-helpers";
import {formatDateIntoStringddmmyyyy} from "@/lib/conversions";
import {Slider, SliderChangeEvent} from "primereact/slider";
import {Button} from "primereact/button";
import {Fieldset} from "primereact/fieldset";

type GroupedDonation = {
    phone?: string | undefined;
    name?: string | undefined;
    totalAmount?: number | undefined;
    donationCount?: number | undefined;
    devoteeId?: number | undefined;
};

const dateRanges = [
    { label: "All Time", value: "all" },
    { label: "Current Year", value: "year" },
    { label: "Current Month", value: "month" },
    { label: "Current Week", value: "week" },
];

const AMOUNT_RANGE_SLIDER_MULTIPLE = 5000;

const amountRanges = [
    { label: "All Amounts", value: "all" },
    { label: "More than ₹5 Lakh", value: "≥5L" },
    { label: "₹5 Lakh - ₹1 Lakh", value: "5L-1L" },
    { label: "₹1 Lakh - ₹10,000", value: "1L-10K" },
    { label: "Less than ₹10,000", value: "≤10K" },
];

export default function ReportsDashboard() {
    const [inProgress, setInProgress] = useState<boolean>(false);
    const [selectedDateRange, setSelectedDateRange] = useState<"all" | "week" | "month" | "year">("all");
    const [customDateRange, setCustomDateRange] = useState<Nullable<(Date | null)[]>>(null);
    const [selectedAmountRange, setSelectedAmountRange] = useState<"all" | "5L" | "5L-1L" | "1K-10K" | "10K">("all");
    const [customAmountRange, setCustomAmountRange] = useState<[number, number] | number | undefined>(undefined);
    const [totalAmount, setTotalAmount] = useState<number | null>(null);
    const [donationsCount, setDonationsCount] = useState<number | null>(null);
    const [devoteesTotalCount, setDevoteesTotalCount] = useState<number | null>(null);
    const [devoteesActiveCount, setDevoteesActiveCount] = useState<number | null>(null);
    const [topDevoteesByDonationAmount, setTopDevoteesByDonationAmount] = useState([]);
    const [lineChartData, setLineChartData] = useState<{ date: string; amount: number }[]>([]);

    const dateRangeValue = customDateRange && customDateRange[0] && customDateRange[1] ? `${formatDateIntoStringddmmyyyy(customDateRange[0])}-${formatDateIntoStringddmmyyyy(customDateRange[1])}`: selectedDateRange;
    const amountRangeValue = customAmountRange && Array.isArray(customAmountRange) ? `${(customAmountRange[0]*AMOUNT_RANGE_SLIDER_MULTIPLE).toLocaleString("en-IN")}-${(customAmountRange[1]*AMOUNT_RANGE_SLIDER_MULTIPLE).toLocaleString("en-IN")}`: selectedAmountRange;

    const fetchDonationsSummary = async () => {
        setInProgress(true);
        try {
            const res = await api.get(`/reports/donations-summary?dateRange=${dateRangeValue}&amountRange=${amountRangeValue}`);
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

    const fetchDevoteesSummary = async () => {
        setInProgress(true);
        try {
            const res = await api.get('/devotees/insights');
            if (res.data.success) {
                setDevoteesTotalCount(res.data.total);
                setDevoteesActiveCount(res.data.active);
            }
        } catch (err) {
            console.error('Failed to load devotees insights data:', err);
        } finally {
            setInProgress(false);
        }
    };

    const fetchTopDevoteesByDonationAmount = async () => {
        setInProgress(true);
        try {
            const res = await api.get(`/reports/top-devotees-by-donations?dateRange=${dateRangeValue}&amountRange=${amountRangeValue}`);
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
            const res = await api.get(`/reports/donations-line-summary?dateRange=${dateRangeValue}&amountRange=${amountRangeValue}`);
            if (res.data.success) {
                setLineChartData(res.data.data);
            }
        } catch (err) {
            console.error('Failed to load donation data:', err);
        } finally {
            setInProgress(false);
        }
    };

    function fetchReports() {
        fetchDonationsSummary().then(
            () =>  {
                fetchTopDevoteesByDonationAmount().then( () => fetchDonationsLineSummary());
            }
        );
    }

    useEffect(() => {
        fetchDevoteesSummary();
        fetchReports();
    }, [selectedDateRange, selectedAmountRange]);

    useEffect(() => {
        if (customDateRange && customDateRange[0] && customDateRange[1]) {
            fetchReports();
        }
    }, [customDateRange]);


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
                &nbsp;You can apply following <strong>filters</strong> based on <strong className="text-hover">date
                range</strong> and/ or within an <strong className="text-hover">amount range</strong>
            </small>
            <div className="grid grid-cols-1 md:grid-cols-2 items-center text-sm gap-2 mt-4">
                {/* Total Devotees Widget */}
                <div
                    className="[zoom:0.7] md:[zoom:1] bg-yellow-50 text-yellow-900 border-l-4 border-yellow-500 px-4 rounded-lg shadow flex justify-between items-center max-w-md">
                    <div>
                        <p className="text-sm">Total <strong>{devoteesTotalCount && !inProgress ? devoteesTotalCount : '**'}</strong> Devotees
                        </p>
                        <p className="text-2xl font-bold">Active: {(devoteesActiveCount && !inProgress ? devoteesActiveCount : '****')}</p>
                    </div>
                    <Image src="/devotees-icon.png" alt="dev" width="70" height="70"/>
                </div>

                {/* Total Donations Widget */}
                <div
                    className="[zoom:0.7] md:[zoom:1] bg-yellow-50 text-yellow-900 border-l-4 border-yellow-500 p-4 rounded-lg shadow flex justify-between items-center max-w-md">
                    {
                        totalAmount ?
                            <div>
                                <p className="text-sm">Total <strong>{donationsCount && !inProgress ? donationsCount : '**'}</strong> Donations
                                    amounting
                                    to</p>
                                <p className="text-2xl font-bold">₹ {(totalAmount && !inProgress ? totalAmount : '****').toLocaleString("en-IN")}</p>
                            </div>
                            :
                            <div>
                                <p className="text-2xl font-bold">No Donations</p>
                            </div>
                    }
                    <Image src="/money-bag.png" alt="money" width="70" height="70"/>
                </div>
            </div>
            <Fieldset className="my-4"
                      legend={
                          <span className="capitalize">
                        {dateRangeValue === 'all' && amountRangeValue === 'all' ?
                            'Apply Filters'
                            :
                            dateRangeValue === 'all' ? '' : dateRangeValue
                        }
                              {
                                  dateRangeValue !== 'all' && amountRangeValue !== 'all' ? ' & ' : ''
                              }
                              {amountRangeValue === 'all' ? '' : `₹ ${amountRangeValue}`}
                              <i className={`pi ${dateRangeValue === 'all' && amountRangeValue === 'all' ? 'pi-filter' : 'pi-filter-fill'} pl-2`}></i>
                    </span>}
                      toggleable collapsed
            >
                <div className="grid grid-cols-2 lg:grid-cols-5 items-center gap-2 my-4 text-sm">
                    {dateRanges.map((r) => (
                        <button
                            key={r.value}
                            onClick={() => {
                                setCustomDateRange(null);
                                setSelectedDateRange(r.value as "all" | "week" | "month" | "year");
                            }}
                            className={`px-3 py-1 w-full text-sm rounded-full border cursor-pointer ${
                                selectedDateRange === r.value && (!customDateRange || !customDateRange[0] || !customDateRange[1])
                                    ? "bg-hover text-white border-hover"
                                    : "text-gray-600 border-gray-300"
                            }`}
                        >
                            {r.label}
                        </button>
                    ))}
                    <Calendar
                        value={customDateRange}
                        onChange={(e) => setCustomDateRange(e.value)}
                        className="[zoom:0.7]"
                        tooltip={customDateRange ? dateRangeValue : ''}
                        selectionMode="range"
                        readOnlyInput
                        showIcon
                        showButtonBar
                        hideOnRangeSelection
                        placeholder="Select Date Range"
                        onClearButtonClick={fetchReports}
                    />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 items-center my-4 text-sm">
                    {amountRanges.map((r) => (
                        <button
                            key={r.value}
                            onClick={() => {
                                setCustomAmountRange(undefined);
                                setSelectedAmountRange(r.value as "all" | "5L" | "5L-1L" | "1K-10K" | "10K");
                            }}
                            className={`w-full px-3 py-1 text-sm rounded-full border cursor-pointer ${
                                selectedAmountRange === r.value && (!customAmountRange)
                                    ? "bg-hover text-white border-hover"
                                    : "text-gray-600 border-gray-300"
                            }`}
                        >
                            {r.label}
                        </button>
                    ))}
                    <div className="grid grid-cols-12 items-center gap-1">
                        <div className="col-span-10 grid grid-rows-2">
                            {
                                (customAmountRange && Array.isArray(customAmountRange)) ?
                                    <small>
                                        ₹{(customAmountRange[0] * 5000).toLocaleString("en-IN")} -
                                        ₹{(customAmountRange[1] * 5000).toLocaleString("en-IN")}
                                    </small>
                                    :
                                    <small>Select ₹ range & click ➡️<span></span></small>
                            }
                            <Slider value={customAmountRange}
                                    onChange={(e: SliderChangeEvent) => setCustomAmountRange(e.value)}
                                    range className="self-center"/>
                        </div>
                        {
                            customAmountRange && Array.isArray(customAmountRange) &&
                            <Button
                                icon="pi pi-arrow-right animate-pulse"
                                className="col-span-2 [zoom:0.7]"
                                aria-label="apply"
                                size="small"
                                onClick={() => fetchReports()}
                            />
                        }
                    </div>
                </div>
            </Fieldset>

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