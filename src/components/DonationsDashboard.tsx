'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { FileUpload, FileUploadFilesEvent } from 'primereact/fileupload'
import {DataTable, SortOrder} from 'primereact/datatable'
import { Calendar } from 'primereact/calendar';
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
import jsPDF from "jspdf"
import autoTable, {RowInput} from "jspdf-autotable";
import {getCurrentDateDDMMYYYY} from "@/lib/utils";
import {Nullable} from "primereact/ts-helpers";
import {Slider, SliderChangeEvent} from "primereact/slider";

type Donation = Prisma.donationsGetPayload<{
  include: {
    phone_ref_value: {
      select: {
        id: true,
        name: true
      }
    },
    campaign_id_ref_value: {
      select: {
        id: true,
        name: true
      }
    }
  };
}>;

const dateRanges = [
  { label: "All Time", value: "all" },
  { label: "Current Year", value: "year" },
  { label: "Current Month", value: "month" },
  { label: "Current Week", value: "week" },
];

const amountRanges = [
  { label: "All Amounts", value: "all" },
  { label: "More than ₹5 Lakh", value: "5L" },
  { label: "₹5 Lakh - ₹1 Lakh", value: "5L-1L" },
  { label: "₹1 Lakh - ₹50,000", value: "1K-50K" },
  { label: "₹50,000 - ₹10,000", value: "50K-10K" },
  { label: "Less than ₹10,000", value: "10K" },
];

export default function DonationsDashboard() {
  const { devotee, systemRole } = useAuth();
  const searchParams = useSearchParams();

  const [inProgress, setInProgress] = useState<boolean>(false);
  const [showBulkUploadDialogue, setShowBulkUploadDialogue] = useState<boolean>(false);
  const [donations, setDonations] = useState<Donation[] | null>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedDateRange, setSelectedDateRange] = useState<"all" | "week" | "month" | "year">("all");
  const [customDateRange, setCustomDateRange] = useState<Nullable<(Date | null)[]>>(null);
  const [selectedAmountRange, setSelectedAmountRange] = useState<"all" | "5L" | "5L-1L" | "1K-50K" | "50K-10K" | "10K">("all");
  const [customAmountRange, setCustomAmountRange] = useState<[number, number] | number | undefined>(undefined);
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

  const rangeValue = customDateRange && customDateRange[0] && customDateRange[1] ? `${formatDateIntoStringddmmyyyy(customDateRange[0])}-${formatDateIntoStringddmmyyyy(customDateRange[1])}`: selectedDateRange;

  const fetchAllDonations = async() => {
    if (inProgress) return;

    try {
      setInProgress(true);
      const allDonations: Donation[] = await fetchDonations({
        first: 0,
        rows: 0,
        sortField: 'date',
        sortOrder: -1,
        filters: {},
        globalFilter: lazyParams.globalFilter,
      });
      const data: Donation[] = [];
      allDonations?.forEach(donation => {
        const formattedData = {
          id: donation.id,
          donation_receipt_number: donation.donation_receipt_number,
          amount: donation.amount,
          name: donation.name,
          phone: donation.phone?.slice(-10),
          devoteId: donation.phone_ref_value?.id,
          date: formatDateIntoStringddmmyyyy(new Date(donation.date!)),
          campaign: donation.campaign_id_ref_value?.name,
          internal_note: donation.internal_note
        }
        data.push(formattedData as never);
      });
      return data;
    } catch {
      msgs.current?.show({ sticky: true, severity: MessageSeverity.ERROR, content: 'Unable to export. Please try again.', closable: true });
      return [];
    } finally {
      setInProgress(false);
    }
  }

  const fetchDonations = async (customParams?: object) => {
    if (inProgress) return;

    try {
      setInProgress(true);
      msgs.current?.clear();
      const res = await api.post(`/donations?range=${rangeValue}`, customParams || lazyParams);
      if (res && res.status === 200 && res.data && res.data.success && res.data.total > 0) {
        const { data } = res;
        if (customParams) {
          // global call for reports with customParams
          return data.records;
        }
        setDonations(data.records);
        setTotalRecords(data.total);
      } else {
        throw new Error();
      }
    } catch {
      if (lazyParams.globalFilter) {
        msgs.current?.show({ sticky: true, severity: MessageSeverity.ERROR, content: `No donations found matching "${lazyParams.globalFilter}". Clear search query to see all donations. Showing previous result for now.`, closable: false });
      } else if (selectedDateRange || (customDateRange && customDateRange[0] && customDateRange[1])) {
        msgs.current?.show({ sticky: true, severity: MessageSeverity.ERROR, content: `No donations found within range: "${rangeValue}". Choose "All time" or some custom date range. Showing previous result for now.`, closable: false });
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

  useEffect(() => {
    fetchDonations();
  }, [selectedDateRange]);

  useEffect(() => {
    if (customDateRange && customDateRange[0] && customDateRange[1]) {
      fetchDonations();
    }
  }, [customDateRange]);

  function clearCustomRange() {
    setCustomDateRange(null);
    fetchDonations();
  }

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
      <span className="text-general">{formatDonationAmount(rowData.amount, true)}</span>
    );
  };

  const formatDonationAmount = (amount:number|null|undefined, withRupeeSymbol?: boolean) => {
    return amount ? (
        withRupeeSymbol?
            new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount):
            new Intl.NumberFormat('en-IN').format(amount)
        )
        :
        'N/A'
  }

  // This function will be called when the search button is clicked or enter is pressed
  async function handleSearch(event?: React.FormEvent<HTMLFormElement>) {
    if (event) {
      event.preventDefault();
    }
    await fetchDonations();
  }

  const exportExcel = async () => {
    const allDonations: Donation[]|undefined = await fetchAllDonations();
    if (allDonations && Array.isArray(allDonations) && allDonations.length > 0) {
      const worksheet = XLSX.utils.json_to_sheet(allDonations);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Donations");
      XLSX.writeFile(workbook, `harekrishna_donations_${getCurrentDateDDMMYYYY()}.xlsx`);
    }
  };

  const exportPDF = async () => {
    const allDonations: Donation[]|undefined = await fetchAllDonations();
    if (allDonations && Array.isArray(allDonations) && allDonations.length > 0) {
      const doc = new jsPDF();
      autoTable(doc, {
        head: [['Date', 'Amount', 'Name', 'Phone', 'Receipt No.']],
        body: [...allDonations.map(
            (donation: Donation) => [
              donation.date,
              `Rs. ${formatDonationAmount(donation.amount)}`,
              donation.name,
              donation.phone,
              donation.donation_receipt_number
            ]
        ) as RowInput[]],
      });
      doc.save(`harekrishna_donations_${getCurrentDateDDMMYYYY()}.pdf`);
    }
  };

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
        <form onSubmit={handleSearch} className="p-inputgroup text-sm px-5 my-1">
          <span className="p-float-label">
            <InputText id="search-input" maxLength={50}
                       value={lazyParams.globalFilter}
                       onChange={(e) => {
                         // Remove any non-numeric characters from the input
                         const value = e.target.value.replace(/[^0-9a-z-A-Z\s]/g, '');
                         setLazyParams((prev) => ({...prev, globalFilter: value.trim()}));
                         msgs.current?.clear();
                       }}
            />
            <label
                htmlFor="search-input">Type and press enter or click 🔍
            </label>
          </span>
          <Button
              icon="pi pi-search"
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
        <div className="grid grid-cols-2 lg:grid-cols-5 items-center gap-2 my-4 text-sm px-5">
          {dateRanges.map((r) => (
              <button
                  key={r.value}
                  onClick={() => {
                    setCustomDateRange(null);
                    setSelectedDateRange(r.value as "all" | "week" | "month" | "year");
                  }}
                  className={`w-full px-3 py-1 text-sm rounded-full border cursor-pointer ${
                      selectedDateRange === r.value && (!customDateRange || !customDateRange[0] || !customDateRange[1])
                          ? "bg-hover text-white border-hover/3"
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
              tooltip={customDateRange ? rangeValue : ''}
              selectionMode="range"
              readOnlyInput
              showIcon
              showButtonBar
              hideOnRangeSelection
              placeholder="Select Date Range"
              onClearButtonClick={clearCustomRange}
          />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 items-center my-4 text-sm px-5">
          {amountRanges.map((r) => (
              <button
                  key={r.value}
                  onClick={() => {
                    setCustomAmountRange(undefined);
                    setSelectedAmountRange(r.value as "all" | "5L" | "5L-1L" | "1K-50K" | "50K-10K" | "10K");
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
        </div>
        <div className="grid grid-cols-12 gap-14 items-center my-4 text-sm px-8">
          <div className="col-span-11">
            <div className="grid grid-rows-2">
              {
                (customAmountRange && Array.isArray(customAmountRange)) ?
                    <small>
                      ₹{(customAmountRange[0] * 1000).toLocaleString("en-IN")} -
                      ₹{(customAmountRange[1] * 1000).toLocaleString("en-IN")}
                    </small>
                    :
                    <small>or, select Amount range</small>
              }
              <Slider value={customAmountRange} onChange={(e: SliderChangeEvent) => setCustomAmountRange(e.value)}
                      range className="self-center"/>
            </div>
          </div>
          {
              customAmountRange && Array.isArray(customAmountRange) &&
              <Button
                  icon="pi pi-arrow-right"
                  className="col-span-1 [zoom:0.7]"
                  aria-label="go"
                  size="small"
                  label="Apply"
                  type="submit"
              />
          }
        </div>
        <br/>
        <p className="pl-6">
          <hr/>
          <strong className="underline">Note</strong>:&nbsp;<strong>Search</strong> donation(s) by
          it&apos;s donor&apos;s <strong className="text-hover">name</strong>, <strong className="text-hover">phone
          number</strong>, <strong className="text-hover">donation amount</strong>, <strong className="text-hover">receipt number</strong>, within a <strong className="text-hover">date range</strong> and/ or within an <strong className="text-hover">amount range</strong>
        </p>
        <br/>
        <Messages ref={msgs}/>
        {
            donations && Array.isArray(donations) && donations.length > 0 &&
            <div className="card overflow-x-auto max-w-[90vw] mt-4">
              <DataTable
                  value={donations}
                  lazy
                  paginator
                  totalRecords={totalRecords}
                  first={lazyParams.first}
                  rows={lazyParams.rows}
                  loading={inProgress}
                  onPage={(e) => {
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
              <hr/>
              <small className="text-general">
                <strong>Note:</strong> By default, find the most recent donation first but you can always sort column as
                per your wish by clicking them.
                Click on a&nbsp;
                <a href="javascript:void(0);" rel="noopener noreferrer" className="text-hover underline">
                  highlighted
                </a>
                &nbsp;donor name to view their complete details.
              </small>
              <br/>
              <br/>
              <small className="text-general">
                Donations: {totalRecords}
                {devotee && lazyParams.globalFilter === '' && <span
                    className="ml-2"> | Your Donations: {donations?.filter(d => d.phone === devotee.phone).length}</span>}
              </small>
              <hr/>
              <br/>
              <small className="text-general"><strong>Export as:</strong></small>
              <br/>
              <Button icon="pi pi-download"
                      raised
                      severity="success"
                      label="Excel"
                      aria-label="Export to Excel"
                      size="small"
                      onClick={exportExcel}>
              </Button>
              &nbsp;
              <Button icon="pi pi-file-pdf"
                      raised
                      severity="danger"
                      label="PDF"
                      aria-label="Export to PDF"
                      size="small"
                      onClick={exportPDF}>
              </Button>
            </div>
        }
        <Toast ref={toast} position="bottom-center"/>
      </div>
  )
}