'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { FileUpload, FileUploadFilesEvent } from 'primereact/fileupload'
import {DataTable, SortOrder} from 'primereact/datatable'
import { Column } from 'primereact/column'
import api from '@/lib/axios'
import { Toast } from "primereact/toast";
import { MessageSeverity } from "primereact/api";
import { Prisma } from '@prisma/client';
import _ from "lodash";
import { formatDateIntoStringddmmyyyy } from '@/lib/conversions'
import { ProgressBar } from 'primereact/progressbar'
import { useAuth } from '@/hooks/useAuth'
import { SYSTEM_ROLES } from '@/data/constants'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Messages } from 'primereact/messages'
import { Dialog } from 'primereact/dialog'
import { useSearchParams } from 'next/navigation'

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

export default function DonationsDashboard() {
  const { devotee, systemRole } = useAuth();
  const searchParams = useSearchParams();

  const [inProgress, setInProgress] = useState<boolean>(false);
  const [showBulkUploadDialogue, setShowBulkUploadDialogue] = useState<boolean>(false);
  const [donations, setDonations] = useState<Donation[] | null>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const toast = useRef<Toast>(null);
  const msgs = useRef<Messages>(null);

  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 10,
    sortField: 'date',
    sortOrder: -1,
    filters: {},
    globalFilter: '',
  });

  const fetchDonations = async () => {
    if (inProgress) return;

    setInProgress(true);
    msgs.current?.clear();
    try {
      const res = await api.post('/donations', lazyParams);
      if (res && res.status === 200 && res.data && res.data.success && res.data.total > 0) {
        const { data } = res;
        setDonations(data.records);
        setTotalRecords(data.total);
      } else {
        throw new Error();
      }
    } catch {
      if (lazyParams.globalFilter) {
        msgs.current?.show({ sticky: true, severity: MessageSeverity.ERROR, content: `No donations found matching "${lazyParams.globalFilter}". Clear search query to see all donations.`, closable: false });
      } else {
        msgs.current?.show({ sticky: true, severity: MessageSeverity.ERROR, content: 'No donations exist. Only an admin can bulk upload donations, exported from ERP portal.', closable: true });
      }
    } finally {
      setInProgress(false);
    }
  };

  useEffect(() => {
    const queryParamPhone: string | null = searchParams.get('phone');
    if (queryParamPhone && queryParamPhone.length > 0) {
      // Set search query to passed devotes phone number without country code
      lazyParams.globalFilter = queryParamPhone.trim().slice(2);
    }
    fetchDonations();
  }, []);

  const handleUpload = async (e: FileUploadFilesEvent) => {
    const file = e.files[0]
    const reader = new FileReader()

    reader.onload = async (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      let json: object[] = XLSX.utils.sheet_to_json(sheet);

      json = formatIntoProperJson(json);

      // Format and upload each row
      try {
        const res = await api.post('/donations/bulk', { donations: json });
        if (res && res.status === 200 && res.data && res.data.success) {
          msgs.current?.clear();
          msgs.current?.show({ sticky: true, severity: MessageSeverity.SUCCESS, content: res.data.message, closable: true });
          setInProgress(false);
          await fetchDonations();
        } else {
          throw new Error();
        }
      } catch {
        setInProgress(false);
        msgs.current?.clear();
        msgs.current?.show({ sticky: true, severity: MessageSeverity.ERROR, content: 'Error inserting donations data in DB. Cross check data in sheet.', closable: true });
      } finally {
        setShowBulkUploadDialogue(false);
      }
    }

    reader.readAsArrayBuffer(file);
    setInProgress(true);
  }

  const formatIntoProperJson = (json: object[]) => {
    const formattedJson: object[] = [];
    // iterate in reverse coz donations are in descending order of date
    for (let i = json.length - 1; i >= 0; i--) {
      const phone = _.get(json[i], 'Contact Number');
      let phoneFormatted: string = String(phone).replace(/'/g, '');
      if (phoneFormatted.length > 10) {
        phoneFormatted = phoneFormatted.slice(-10); // gets last 10 characters (just in case, if people already appended country code like 91 to the phone number)
      }
      const countryCallingCode = "91";
      phoneFormatted = `${countryCallingCode}${phoneFormatted}`; // → "919999999999"

      const date = _.get(json[i], 'Date');
      const amount = _.get(json[i], 'Amount');
      const donation = {
        donation_receipt_number: _.get(json[i], 'Donation Receipt Number'),
        name: _.get(json[i], 'Donor Name', ''),
        phone: phoneFormatted,
        amount: amount ? parseInt(String(amount).replace(/,/g, '').split('.')[0], 10) : null,
        date: date || formatDateIntoStringddmmyyyy(new Date()),
        created_by: devotee?.id,
        updated_by: devotee?.id,
      }
      formattedJson.push(donation);
    }
    return formattedJson;
  }

  const nameWithLink = (rowData: Donation) => {
    return (
      rowData && rowData.phone_ref_value?.id ?
        <a href={`/devotee?devoteeId=${rowData.phone_ref_value?.id}`} rel="noopener noreferrer" className="text-hover underline">
          {rowData.phone_ref_value?.name}
        </a>
        :
        <span className="text-grey-400">{rowData.name || 'N/A'}</span>
    );
  };
  const dateFormatted = (rowData: Donation) => {
    return (
      <span>{formatDateIntoStringddmmyyyy(new Date(rowData.date!))}</span>
    );
  };
  const phoneFormatted = (rowData: Donation) => {
    return (
      <span>{rowData.phone?.slice(-10)}</span>
    );
  };
  const amountFormatted = (rowData: Donation) => {
    return (
      <span className="text-general">{rowData.amount ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(rowData.amount) : 'N/A'}</span>
    );
  };

  // This function will be called when the search button is clicked or enter is pressed
  async function handleSearch(event?: React.FormEvent<HTMLFormElement>) {
    if (event) {
      event.preventDefault();
    }
    await fetchDonations();
  }

  return (
      <div className="p-3 mih-h-screen">
        <strong className="text-general">Donations Dashboard</strong>
        {
          inProgress ?
              <ProgressBar mode="indeterminate" style={{height: '2px'}} className="pt-1"></ProgressBar>
              :
              <hr/>
        }
        <small className="text-general">
          A consolidated place for all the donations data. At your role level, {devotee?.name}, you have the privileges
          to:
          {
              systemRole === SYSTEM_ROLES.admin &&
              <div className="m-5">
                <strong className="text-hover">• Insert</strong> donations data in bulk by uploading Excel sheet in
                specific format:&nbsp;
                <a
                    href="/Sample-DONATIONS-Bulk-Data-Upload-Format-For-Madhuram.xlsx"
                    download
                    className="text-blue-600 underline hover:text-blue-800"
                >
                  download sample sheet
                </a>
                <br/>
                <div className="py-3">
                  <Button
                      icon="pi pi-upload"
                      label="Upload"
                      severity="secondary"
                      aria-label="Upload Donations"
                      size="small"
                      onClick={() => setShowBulkUploadDialogue(true)}
                  />
                </div>
                <Dialog
                    header="Bulk Upload Donations Data" keepInViewport
                    visible={showBulkUploadDialogue}
                    onHide={() => setShowBulkUploadDialogue(false)}>
                  <FileUpload
                      name="excel"
                      mode="advanced"
                      auto
                      chooseLabel="Upload DONATIONS Excel got from ERP portal"
                      customUpload
                      uploadHandler={handleUpload}
                      onBeforeUpload={() => setInProgress(true)}
                      onUpload={() => setShowBulkUploadDialogue(false)}
                      accept=".xlsx, .xls"
                      emptyTemplate={<p className="m-0">or Simply, drag and drop the Donations Excel file here</p>}
                  />
                </Dialog>
              </div>
          }
          <div className="m-5">
            <strong className="text-hover">• View</strong> donations data.
          </div>
        </small>

        {/*{
        getApplicableDonations && Array.isArray(getApplicableDonations) && getApplicableDonations.length > 0 &&
        <div className="card overflow-x-auto max-w-[90vw] mt-4">
          <small className="text-general">
            Total Donations: {allDonations?.length}
            {devotee && <span className="ml-2"> | Your Donations: {allDonations?.filter(d => d.phone === devotee.phone).length}</span>}
          </small>
          <br />
          <small className="text-general">
            Note: Donations are sorted by date in descending order, with the most recent donations appearing first.
          </small>
          <br />
          <small className="text-general">
            You can click on the name of the donor to view their details.
          </small>
          <br />
          <DataTable value={getApplicableDonations} paginator rows={10} stripedRows size="small">
            <Column header="Date" body={dateFormatted} />
            <Column field="donation_receipt_number" header="Receipt No." />
            <Column header="Amount" body={amountFormatted} />
            <Column header="Phone Number" body={phoneFormatted} />
            <Column header="Name" body={nameWithLink} />
            <Column field="internal_note" header="Internal Note" />
          </DataTable>
        </div>
      }*/}

        <form onSubmit={handleSearch} className="p-inputgroup text-sm px-5 my-1">
          <span className="p-float-label">
            <InputText id="search-input" required maxLength={50}
                       value={lazyParams.globalFilter}
                       onChange={(e) => {
                         // Remove any non-numeric characters from the input
                         const value = e.target.value.replace(/[^0-9a-z-A-Z\s]/g, '');
                         setLazyParams((prev) => ({...prev, globalFilter: value.trim()}));
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
        {lazyParams.globalFilter && (
            <Button
                onClick={() => {
                  lazyParams.globalFilter = '';
                  fetchDonations();
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
          <strong>Note:</strong>&nbsp;Search a donation by it&apos;s donor&apos;s name, phone number, donation amount or receipt number
        </small>
        <Messages ref={msgs} />
        {
          donations && Array.isArray(donations) && donations.length > 0 &&
            <div className="card overflow-x-auto max-w-[99vw] mt-4">
              <hr/>
              <br/>
              <small className="text-general">
                Donations: {totalRecords}
                {devotee && lazyParams.globalFilter === '' && <span
                    className="ml-2"> | Your Donations: {donations?.filter(d => d.phone === devotee.phone).length}</span>}
              </small>
              <br/>
              <small className="text-general">
                Note: Find the most recent donation first. Click on the name of the donor to view their details.
              </small>
              <br/><br/>
              <DataTable
                  value={donations}
                  lazy
                  paginator
                  totalRecords={totalRecords}
                  first={lazyParams.first}
                  rows={lazyParams.rows}
                  loading={inProgress}
                  onPage={(e) =>  {
                    setLazyParams({...lazyParams, first: e.first});
                    fetchDonations();
                  }}
                  onSort={(e) => {
                    setLazyParams({...lazyParams, sortField: e.sortField, sortOrder: e.sortOrder!})
                    fetchDonations();
                  }}
                  dataKey="id"
                  scrollable
                  stripedRows
                  size="small"
                  sortField={lazyParams.sortField} sortOrder={lazyParams.sortOrder as SortOrder}
              >
                <Column field="date" header="Date" body={dateFormatted} sortable/>
                <Column field="amount" header="Amount" body={amountFormatted} sortable/>
                <Column field="name" header="Donor Name" body={nameWithLink} sortable/>
                <Column field="phone" header="Phone Number" body={phoneFormatted} sortable/>
                <Column field="donation_receipt_number" header="Receipt" sortable/>
              </DataTable>
              <div className="text-sm p-2 pb-0 m-auto text-center"><strong>{totalRecords} donations</strong></div>
            </div>
        }
        <Toast ref={toast} position="bottom-center"/>
      </div>
  )
}