"use client";

import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { useState } from "react";
import api from "@/lib/axios"; // our Custom Axios Wrapper which automatically adds access token in header
import { BlockUI } from "primereact/blockui";
import { SYSTEM_ROLES } from "@/data/constants";
import _ from "lodash";
import { ProgressBar } from "primereact/progressbar";
import { useAuth } from "@/hooks/useAuth";
import FullPageSpinner from "@/components/FullPageSpinner";

export default function DevoteesPage() {
    const { devotee } = useAuth();
    const [searchInProgress, setSearchInProgress] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchResult, setSearchResult] = useState<object | null>(null);

    async function handleSearch(query: string) {
        // This function will be called when the search button is clicked
        if (!query.trim()) {
            setSearchResult(null);
            return;
        }

        setSearchInProgress(true);
        // Make an API call to fetch the search results
        await api.get('/devotees', {
            params: {
                query: query.trim(),
            },
        }).then((response) => {
            if (response.status === 200) {
                setSearchResult(response.data);
            } else {
                console.error('Error fetching search results:', response);
                setSearchResult(null);
            }
        }
        ).catch((error) => {
            console.error('Error fetching search results:', error);
            setSearchResult(null);
        }).finally(() => {
            setSearchInProgress(false);
        });
    }

    const footer =
        (
            <small className="text-left">
                <strong>Note:</strong>&nbsp;You can search a devotee by name, mobile number or email.
            </small>
        );

    return (
        <div className="h-full w-full component-transparent">
            {!devotee &&
                <FullPageSpinner message="Hare Krishna! Fetching details..." />
            }
            {
                searchInProgress &&
                <ProgressBar mode="indeterminate" style={{ height: '2px' }}></ProgressBar>

            }
            <Card title="Search a Devotee"
                footer={footer}
                className="shadow-2xl text-center w-90 md:w-120 m-auto mt-2 component-transparent">
                <div className="p-inputgroup text-sm">
                    <span className="p-inputgroup-addon">
                        <i className="pi pi-search"></i>
                    </span>
                    <span className="p-float-label">
                        <InputText id="search-input" required maxLength={100}
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                _.debounce(() => handleSearch(e.target.value), 1000)();
                            }}
                        />
                        <label
                            htmlFor="search-input">Start typing your search query</label>
                    </span>
                </div>
            </Card>
            {
                searchResult &&
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {
                        Array.isArray(searchResult) && searchResult.length > 0 ? (
                            searchResult.map((devoteeDetails: typeof devotee) => (
                                <BlockUI
                                    key={devoteeDetails?.id}
                                    blocked={devoteeDetails?.system_roles?.name === SYSTEM_ROLES.admin} template={<i className="pi pi-lock" style={{ fontSize: '3rem' }}></i>}>
                                    <Card className="p-2 m-2">
                                        <h3>{devoteeDetails?.name}</h3>
                                        <p><strong>Phone:</strong> {devoteeDetails?.phone}</p>
                                        <p><strong>Email:</strong> {devoteeDetails?.email}</p>
                                    </Card>
                                </BlockUI>
                            ))
                        ) : (
                            <div className="text-center">No results found.</div>
                        )
                    }
                </div>
            }
        </div>
    )
}