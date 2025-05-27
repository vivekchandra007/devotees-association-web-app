"use client";

import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";      // our Custom Axios Wrapper which automatically adds access token in header
import { useRouter } from 'next/navigation';
import { BlockUI } from "primereact/blockui";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Messages } from "primereact/messages";
import { ProgressBar } from "primereact/progressbar";
import { useRef, useState } from "react";

export default function SearchDevotee() {
    const { devotee } = useAuth();
    const [searchInProgress, setSearchInProgress] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchResult, setSearchResult] = useState<object | null>(null);
    const router = useRouter();

    const msgs = useRef<Messages>(null);

    const errorMessage = (
        <small>No devotee found with <strong>{searchQuery}</strong> in their name, phone number or email. If they are someone you know, please refer them using the <strong>Referrals</strong> option on top menu.</small>
    );

    async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        // This function will be called when the search button is clicked
        if (!searchQuery.trim()) {
            setSearchResult(null);
            return;
        }

        if (!searchInProgress) {
            setSearchInProgress(true);
            // Make an API call to fetch the search results
            await api.get('/devotees', {
                params: {
                    query: searchQuery.trim(),
                },
            }).then((response) => {
                if (response.status === 200) {
                    if (response.data.length > 0) {
                        setSearchResult(response.data);
                    } else {
                        setSearchResult(null);
                        msgs.current?.clear();
                        msgs.current?.show({ id: '1', sticky: true, severity: 'error', summary: 'Error', content: errorMessage, closable: true });
                    }
                } else {
                    msgs.current?.show({ id: '1', sticky: true, severity: 'error', summary: 'Error while searching. Please try again.', closable: true });
                    setSearchResult(null);
                }
            }
            ).catch(() => {
                msgs.current?.show({ id: '1', sticky: true, severity: 'error', summary: 'Error while searching. Please try again.', closable: true });
                setSearchResult(null);
            }).finally(() => {
                setSearchInProgress(false);
            });
        }
    }

    return (
        <div className='p-3'>
            <strong className="text-general">Devotees Dashboard</strong>
            {
                searchInProgress ?
                    <ProgressBar mode="indeterminate" style={{ height: '2px' }} className="pt-1"></ProgressBar>
                    :
                    <hr />
            }
            <small className="text-general">
                {devotee?.name}, at your role level, you have the privileges to <strong className="text-hover">search</strong> a devotee registered within this portal. It may be to <strong className="text-hover">help</strong> them or even <strong className="text-hover">refer</strong> them to this portal, if they are not already registered.
            </small>
            <div className="min-h-screen">
                <form onSubmit={handleSearch} className="p-inputgroup text-sm mt-7 w-full">
                    <span className="p-float-label">
                        <InputText id="search-input" required maxLength={50}
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                msgs.current?.clear();
                            }}
                        />
                        <label
                            htmlFor="search-input">Type query and press enter or click 🔍
                        </label>
                    </span>
                    <Button
                        icon="pi pi-search"
                        severity="secondary"
                        aria-label="Search"
                        size="small"
                        type="submit"
                    />
                </form>
                {searchQuery && (
                    <Button
                        onClick={() => {
                            setSearchQuery('');
                            setSearchResult(null);
                            msgs.current?.clear();
                        }}
                        icon="pi pi-times-circle"
                        rounded
                        text
                        severity="contrast"
                        tooltip="Clear Search"
                        className="flex float-right bottom-[65px] right-[40px] z-1 text-gray-400 hover:text-gray-600"
                        aria-label="Clear search"
                    />
                )}
                <small>
                    <strong>Note:</strong>&nbsp;You can search a devotee by their name, phone number or email.
                </small>
                {
                    searchQuery && searchResult &&
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {
                            Array.isArray(searchResult) && searchResult.length > 0 &&
                            (
                                searchResult.map((devoteeDetails: typeof devotee) => (
                                    <BlockUI
                                        key={devoteeDetails?.id}
                                        blocked={devoteeDetails?.status !== "active"} template={<i className="pi pi-lock" style={{ fontSize: '3rem' }}></i>}>
                                        <Card>
                                            <h3>{devoteeDetails?.name}</h3>
                                            <p><strong>Phone:</strong> {devoteeDetails?.phone?.slice(2)}</p>
                                            <p><strong>Email:</strong> {devoteeDetails?.email}</p>
                                            {
                                                devoteeDetails?.status !== "active" &&
                                                <p><strong>Status:</strong> {devoteeDetails?.status}</p>
                                            }
                                            <p><strong>Role:</strong> {devoteeDetails?.system_roles?.name}</p>

                                            {/* volunteers, leaders and admins can view full details of a devotee as well as their donations */}
                                            <div className="grid grid-cols-2 gap-2 mt-3">
                                                <Button
                                                    outlined
                                                    label="View Profile"
                                                    onClick={() => router.push(`/devotee?devoteeId=${devoteeDetails?.id}`)}
                                                    size="small"
                                                />
                                                <Button
                                                    outlined
                                                    label="View Donations"
                                                    onClick={() => router.push(`/insights?tab=1&devoteeId=${devoteeDetails?.id}`)}
                                                    size="small"
                                                    severity="warning"
                                                />
                                            </div>
                                        </Card>
                                    </BlockUI>
                                ))
                            )
                        }
                    </div>
                }
                <Messages ref={msgs} />
            </div>
        </div>
    )
}