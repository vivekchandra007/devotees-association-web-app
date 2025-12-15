"use client";

import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";      // our Custom Axios Wrapper which automatically adds access token in header
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Messages } from "primereact/messages";
import { ProgressBar } from "primereact/progressbar";
import React, { useEffect, useRef, useState } from "react";
import { SYSTEM_ROLES } from "@/data/constants";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog } from 'primereact/confirmdialog';
import { FileUpload, FileUploadFilesEvent } from "primereact/fileupload";
import * as XLSX from "xlsx";
import { MessageSeverity } from "primereact/api";
import _ from "lodash";
import getCountryCallingCode from "@/data/countryCallingCodes";
import { Devotee } from "@/lib/conversions";
import Image from "next/image";
import { DevoteeCard } from "./DevoteeCard";
import OrganizationView from "./OrganizationView";

export default function DevoteesDashboard() {
    const { devotee, systemRole } = useAuth();
    const [devoteesTotalCount, setDevoteesTotalCount] = useState<number | null>(null);
    const [devoteesActiveCount, setDevoteesActiveCount] = useState<number | null>(null);
    const [devoteesVolunteersCount, setDevoteesVolunteersCount] = useState<number | null>(null);
    const [devoteesLeadersCount, setDevoteesLeadersCount] = useState<number | null>(null);
    const [showBulkUploadDialogue, setShowBulkUploadDialogue] = useState<boolean>(false);
    const [refreshOrgView, setRefreshOrgView] = useState<number>(0);
    const [inProgress, setInProgress] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchResult, setSearchResult] = useState<object | null>(null);

    const toast = useRef<Toast>(null);
    const msgs = useRef<Messages>(null);

    const errorMessage = (
        <small>No devotee found with <strong>{searchQuery}</strong> in their name, phone number or email. If they are someone you know, please refer them using the <strong>Referrals</strong> option on top menu.</small>
    );

    const handleUpload = async (e: FileUploadFilesEvent) => {
        const file = e.files[0];
        const reader = new FileReader();

        reader.onload = async (evt) => {
            const data = new Uint8Array(evt.target?.result as ArrayBuffer)
            const workbook = XLSX.read(data, { type: 'array' })
            const sheet = workbook.Sheets[workbook.SheetNames[0]]
            let json: object[] = XLSX.utils.sheet_to_json(sheet);

            // Format and then upload all rows in bulk update
            json = formatIntoProperJson(json);

            try {
                setInProgress(true);
                const res = await api.post('/devotees/bulk', { devotees: json });
                if (res && res.status === 200 && res.data && res.data.success) {
                    msgs.current?.clear();
                    msgs.current?.show({ sticky: true, severity: MessageSeverity.SUCCESS, content: res.data.message, closable: true });
                } else {
                    throw new Error();
                }
            } catch {
                msgs.current?.clear();
                msgs.current?.show({ sticky: true, severity: MessageSeverity.ERROR, content: 'Error inserting devotees in DB. Cross check data in sheet.', closable: true });
            } finally {
                setInProgress(false);
                setShowBulkUploadDialogue(false);
            }
        }
        reader.readAsArrayBuffer(file);
    }

    const formatIntoProperJson = (json: object[]) => {
        const formattedJson: object[] = [];
        json.forEach(devoteeRow => {
            // At least "Contact No." is required to insert a devotee row coz that's mandatory and must be unique in our devotees DB
            const phone = _.get(devoteeRow, 'Contact No.', '');
            let phoneFormatted: string = String(phone).replace(/'/g, '');
            if (phoneFormatted && phoneFormatted !== '' && phoneFormatted.length >= 10) {
                if (phoneFormatted.length > 10) {
                    phoneFormatted = phoneFormatted.slice(-10); // gets last 10 characters (just in case, if people already appended country code like 91 to their phone number)
                }

                const name = _.get(devoteeRow, 'Name');
                const addressLine1 = _.get(devoteeRow, 'Address Line 1');
                const addressLine2 = _.get(devoteeRow, 'Address Line 2');
                const addressArea = _.get(devoteeRow, 'Location');
                const addressCity = _.get(devoteeRow, 'City / Town');
                const addressState = _.get(devoteeRow, 'State');
                const addressCountry = _.get(devoteeRow, 'Country');
                const addressPincode = _.get(devoteeRow, 'Pincode');
                const taxPan = _.get(devoteeRow, 'PAN');
                const spouseMarriageAnniversary = _.get(devoteeRow, 'DOM');
                const dob = _.get(devoteeRow, 'Date of Birth');

                let countryCallingCode = "91";
                if (addressCountry) {
                    countryCallingCode = getCountryCallingCode(countryCallingCode) || "91";
                }
                phoneFormatted = `${countryCallingCode}${phoneFormatted}`; // → "919999999999"
                const donation = {
                    phone: phoneFormatted,
                    phone_whatsapp: phoneFormatted,
                    status: 'inactive',
                    source_id: 2,
                    created_by: devotee?.id,
                    updated_by: devotee?.id
                }
                if (name) {
                    _.set(donation, 'name', name);
                }
                if (addressLine1) {
                    _.set(donation, 'address_line1', addressLine1);
                }
                if (addressLine2) {
                    _.set(donation, 'address_line2', addressLine2);
                }
                if (addressArea) {
                    _.set(donation, 'address_area', addressArea);
                }
                if (addressCity) {
                    _.set(donation, 'address_city', addressCity);
                }
                if (addressState) {
                    _.set(donation, 'address_state', addressState);
                }
                if (addressCountry) {
                    _.set(donation, 'address_country', addressCountry);
                }
                if (addressPincode) {
                    _.set(donation, 'address_pincode', String(addressPincode));
                }
                if (taxPan) {
                    _.set(donation, 'tax_pan', taxPan);
                }
                if (spouseMarriageAnniversary) {
                    _.set(donation, 'spouse_marriage_anniversary', excelSerialDateToDateString(spouseMarriageAnniversary));
                }
                if (dob) {
                    _.set(donation, 'dob', excelSerialDateToDateString(dob));
                }
                // finally, push this properly formatted donation info
                formattedJson.push(donation);
            }
        });
        return formattedJson;
    }

    function excelSerialDateToDateString(serial: number): string {
        // 👉 for e.g. for "27222" excel date, actual date is "19/11/1995"
        const excelEpoch = new Date(1900, 0, 1);
        const jsDate = new Date(excelEpoch.getTime() + (serial - 2) * 86400000); // 86400000 = ms in a day
        return jsDate.toLocaleDateString('en-CA');
    }

    async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        // This function will be called when the search button is clicked
        if (!searchQuery.trim()) {
            setSearchResult(null);
            return;
        }

        if (!inProgress) {
            setInProgress(true);
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
                setInProgress(false);
            });
        }
    }


    // Logic for role updates and leader assignments has been moved to DevoteeCard.tsx

    useEffect(() => {
        const getInsights = async () => {
            setInProgress(true);
            try {
                const res = await api.get('/devotees/insights');
                if (res.data.success) {
                    setDevoteesTotalCount(res.data.total);
                    setDevoteesActiveCount(res.data.active);
                    setDevoteesVolunteersCount(res.data.volunteers);
                    setDevoteesLeadersCount(res.data.leaders);
                }
            } catch (err) {
                console.error('Failed to load devotees insights data:', err);
            } finally {
                setInProgress(false);
            }
        }
        getInsights();
    }, []);

    return (
        <div className="p-2 min-h-screen max-w-screen">
            <strong className="text-general">Devotees Dashboard</strong>
            {
                inProgress ?
                    <ProgressBar mode="indeterminate" style={{ height: '2px' }} className="pt-1"></ProgressBar>
                    :
                    <hr />
            }
            <small className="text-general">
                A consolidated place for all devotees&apos; data.
                {/* Total Widget */}
                <div
                    className="mt-4 text-sm bg-yellow-50 text-yellow-900 border-l-4 border-yellow-500 p-4 rounded-lg shadow flex justify-between items-center max-w-md">
                    <div>
                        <p>Total <strong>{devoteesTotalCount && !inProgress ? devoteesTotalCount : '**'}</strong>
                            &nbsp;<strong className="text-hover">Dev</strong>otees
                        </p>
                        &#8226; Active: <span className="text-base font-bold">{(devoteesActiveCount && !inProgress ? devoteesActiveCount : '****')}</span>
                        <br />
                        &#8226; Volunteers: &nbsp;
                        <span className="text-base font-bold">
                            {devoteesVolunteersCount ?
                                (devoteesVolunteersCount && !inProgress ? devoteesVolunteersCount : '****')
                                :
                                0
                            }
                        </span>
                        <br />
                        &#8226; Leaders: &nbsp;
                        <span className="text-base font-bold">
                            {devoteesLeadersCount ?
                                (devoteesLeadersCount && !inProgress ? devoteesLeadersCount : '****')
                                :
                                0
                            }
                        </span>
                    </div>
                    <Image src="/devotees-icon.png" alt="dev" width="70" height="70" />
                </div>
                <br />
                At your <strong>role level</strong>, <span className="text-hover font-bold">{devotee?.name}</span>, you
                have the
                privileges to:
                {
                    systemRole === SYSTEM_ROLES.admin &&
                    <div className="m-5">
                        <strong className="text-hover">• Insert</strong> new devotees with their data, in bulk by
                        uploading Excel sheet
                        in
                        specific format:&nbsp;
                        <a
                            href="/Sample-DEVOTEES-Bulk-Data-Upload-Format-For-Madhuram.xlsx"
                            download
                            className="text-blue-600 underline hover:text-blue-800"
                        >
                            download sample sheet
                        </a>
                        <br />
                        <div className="py-3">
                            <Button
                                icon="pi pi-upload"
                                label="Upload"
                                severity="secondary"
                                aria-label="Upload Devotees Data"
                                size="small"
                                onClick={() => setShowBulkUploadDialogue(true)}
                            />
                        </div>
                        <strong>Note:</strong>&nbsp;These devotees&apos; status will be &#34;inactive&#34; until they
                        themselves login for the first time.
                        <Dialog
                            header="Bulk Upload Devotees with their Data" keepInViewport
                            visible={showBulkUploadDialogue}
                            onHide={() => setShowBulkUploadDialogue(false)}>
                            <FileUpload
                                name="excel"
                                mode="advanced"
                                auto
                                chooseLabel="Upload DEVOTEES Excel got from ERP Portal"
                                customUpload
                                uploadHandler={handleUpload}
                                onBeforeUpload={() => setInProgress(true)}
                                onUpload={() => setShowBulkUploadDialogue(false)}
                                accept=".xlsx, .xls"
                                emptyTemplate={<p className="m-0">or Simply, Drag and drop Devotees Excel file here</p>}
                            />
                        </Dialog>
                    </div>
                }
                <div className="m-5">
                    <strong
                        className="text-hover">• Search</strong> a devotee registered within this portal. It may be
                    to <strong
                        className="text-hover">help</strong> them or even <strong className="text-hover">refer</strong> them
                    to
                    this portal, if they are not already registered.
                </div>
            </small>
            <form onSubmit={handleSearch} className="p-inputgroup text-sm px-5 my-1">
                <span className="p-float-label">
                    <InputText id="search-input" required maxLength={50}
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            msgs.current?.clear();
                        }}
                    />
                    <label
                        htmlFor="search-input">Search any devotee... 🔍
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
                    title="Clear Search"
                    className="flex float-right bottom-[51px] right-[70px] z-1 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                />
            )}
            <small className="px-5">
                <strong>Note:</strong>&nbsp;You can search a devotee by their name, phone number or email.
            </small>
            <Messages ref={msgs} />
            {
                searchQuery && searchResult &&
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {
                        Array.isArray(searchResult) && searchResult.length > 0 &&
                        (
                            searchResult.map((devoteeDetails: Devotee) => (
                                <DevoteeCard
                                    key={devoteeDetails?.id}
                                    devoteeId={devoteeDetails?.id}
                                    initialData={devoteeDetails}
                                    onDataChange={(updatedDevotee) => {
                                        // Update local state to keep search results in sync
                                        // We can trust the updatedDevotee passed back from the card
                                        if (searchResult && Array.isArray(searchResult)) {
                                            const updated = searchResult.map((d: Devotee) => d.id === updatedDevotee.id ? updatedDevotee : d);
                                            setSearchResult(updated);
                                        }
                                        // Trigger Organization View Refresh
                                        setRefreshOrgView(prev => prev + 1);
                                    }}
                                />
                            ))
                        )
                    }
                </div>
            }
            <OrganizationView refreshTrigger={refreshOrgView} />
            <Toast ref={toast} position="bottom-center" />
        </div>
    )
}