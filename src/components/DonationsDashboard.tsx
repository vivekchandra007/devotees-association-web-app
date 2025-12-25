'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { FileUpload, FileUploadFilesEvent } from 'primereact/fileupload'
import { DataTable, SortOrder } from 'primereact/datatable'
import { Calendar } from 'primereact/calendar';
import { Column, ColumnEditorOptions } from 'primereact/column'
import api from '@/lib/axios'
import { MessageSeverity } from "primereact/api";
import { Prisma } from '@prisma/client';
import _ from "lodash";
import { formatDateIntoStringddmmyyyy, parseDateFromStringddmmyyyy } from '@/lib/conversions'
import { ProgressBar } from 'primereact/progressbar'
import { useAuth } from '@/hooks/useAuth'
import { SYSTEM_ROLES } from '@/data/constants'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Messages } from 'primereact/messages'
import { Dialog } from 'primereact/dialog'
import { useSearchParams } from 'next/navigation'
import jsPDF from "jspdf"
import autoTable, { RowInput } from "jspdf-autotable";
import { DataTableRowEditCompleteEvent } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { getCurrentDateDDMMYYYY } from "@/lib/utils";
import { Nullable } from "primereact/ts-helpers";
import { Slider, SliderChangeEvent } from "primereact/slider";
import { Fieldset } from "primereact/fieldset";
import Image from "next/image";
import { DevoteeCard } from "./DevoteeCard";
import { toast } from 'sonner'

type Donation = Prisma.donationsGetPayload<{
  include: {
    phone_ref_value: {
      select: {
        id: true,
        name: true,
        leader_id_ref_value: {
          select: {
            id: true,
            name: true
          }
        }
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

const AMOUNT_RANGE_SLIDER_MULTIPLE = 5000;

const amountRanges = [
  { label: "All Amounts", value: "all" },
  { label: "More than ₹5 Lakh", value: "≥5L" },
  { label: "₹5 Lakh - ₹1 Lakh", value: "5L-1L" },
  { label: "₹1 Lakh - ₹10,000", value: "1L-10K" },
  { label: "Less than ₹10,000", value: "≤10K" },
];

export default function DonationsDashboard() {
  const { devotee, systemRole } = useAuth();
  const searchParams = useSearchParams();

  const [inProgress, setInProgress] = useState<boolean>(false);
  const [showBulkUploadDialogue, setShowBulkUploadDialogue] = useState<boolean>(false);
  const [totalDonationsAmount, setTotalDonationsAmount] = useState<number | null>(null);
  const [donationsCount, setDonationsCount] = useState<number | null>(null);
  const [donations, setDonations] = useState<Donation[] | null>([]);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal state for DevoteeCard
  const [selectedDevoteeId, setSelectedDevoteeId] = useState<number | null>(null);
  const [showDevoteeModal, setShowDevoteeModal] = useState<boolean>(false);
  const [selectedDateRange, setSelectedDateRange] = useState<"all" | "week" | "month" | "year">("all");
  const [customDateRange, setCustomDateRange] = useState<Nullable<(Date | null)[]>>(null);
  const [selectedAmountRange, setSelectedAmountRange] = useState<"all" | "5L" | "5L-1L" | "1K-10K" | "10K">("all");
  const [customAmountRange, setCustomAmountRange] = useState<[number, number] | number | undefined>(undefined);
  const msgs = useRef<Messages>(null);

  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 10,
    sortField: 'date',
    sortOrder: -1,
    filters: {},
    globalFilter: '',
  });

  const dateRangeValue = customDateRange && customDateRange[0] && customDateRange[1] ? `${formatDateIntoStringddmmyyyy(customDateRange[0])}-${formatDateIntoStringddmmyyyy(customDateRange[1])}` : selectedDateRange;
  const amountRangeValue = customAmountRange && Array.isArray(customAmountRange) ? `${(customAmountRange[0] * AMOUNT_RANGE_SLIDER_MULTIPLE).toLocaleString("en-IN")}-${(customAmountRange[1] * AMOUNT_RANGE_SLIDER_MULTIPLE).toLocaleString("en-IN")}` : selectedAmountRange;

  const fetchAllDonations = async () => {
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
          leader: donation.phone_ref_value?.leader_id_ref_value?.name,
          date: formatDateIntoStringddmmyyyy(new Date(donation.date!)),
          payment_mode: donation.payment_mode,
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
      await fetchDonationsSummary();

      setInProgress(true);
      msgs.current?.clear();
      const res = await api.post(`/donations?dateRange=${dateRangeValue}&amountRange=${amountRangeValue}`, customParams || lazyParams);
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
      msgs.current?.clear();
      if (lazyParams.globalFilter) {
        msgs.current?.show({ sticky: true, severity: MessageSeverity.ERROR, content: `No donations found matching "${lazyParams.globalFilter}". Clear search query and remove filters (if any) to see all donations.`, closable: false });
      } else if (selectedDateRange !== "all" || (customDateRange && customDateRange[0] && customDateRange[1]) || selectedAmountRange !== "all" || customAmountRange) {
        msgs.current?.show({ sticky: true, severity: MessageSeverity.ERROR, content: `No donations found with filters to be within date range: "${dateRangeValue}" & amount range: "${amountRangeValue}". Change filters or choose "All Time/ Amounts" or some custom Date/ Amount range.`, closable: false });
      } else {
        msgs.current?.show({ sticky: true, severity: MessageSeverity.ERROR, content: 'No donations exist. Only an admin can bulk upload donations, exported from ERP portal.', closable: true });
      }
      setDonations(null);
      setTotalRecords(0);
    } finally {
      setInProgress(false);
    }
  };

  const fetchDonationsSummary = async () => {
    if (inProgress) return;

    try {
      setInProgress(true);
      const res = await api.get(`/reports/donations-summary?dateRange=${dateRangeValue}&amountRange=${amountRangeValue}`);
      if (res.data.success) {
        setTotalDonationsAmount(res.data.totalAmount.amount);
        setDonationsCount(res.data.count.id);
      }
    } catch (err) {
      console.error('Failed to load donation data:', err);
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
  }, [selectedDateRange, selectedAmountRange]);

  useEffect(() => {
    if (customDateRange && customDateRange[0] && customDateRange[1]) {
      fetchDonations();
    }
  }, [customDateRange]);

  function clearCustomDateRange() {
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
          setTimeout(async () => {
            await fetchDonations();
          }, 5000);
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

      const date: string = _.get(json[i], 'Date', '');
      const amount = _.get(json[i], 'Amount');
      const paymentMode: string = _.get(json[i], 'Payment Mode', '');
      const remarks = _.get(json[i], 'Remarks');
      const donation = {
        donation_receipt_number: _.get(json[i], 'Donation Receipt Number'),
        name: _.get(json[i], 'Donor Name', ''),
        phone: phoneFormatted,
        amount: amount ? parseInt(String(amount).replace(/,/g, '').split('.')[0], 10) : null,
        payment_mode: paymentMode.slice(0, 20),
        date: date?.replace("00:00", "").trim() || formatDateIntoStringddmmyyyy(new Date()),
        internal_note: remarks || '',
        created_by: devotee?.id,
        updated_by: devotee?.id,
      }
      formattedJson.push(donation);
    }
    return formattedJson;
  }

  const openDevoteeModal = (id: number) => {
    setSelectedDevoteeId(id);
    setShowDevoteeModal(true);
  };

  const nameWithLink = (rowData: Donation) => {
    return (
      rowData && rowData.phone_ref_value?.id ?
        <span
          onClick={() => openDevoteeModal(rowData.phone_ref_value!.id)}
          className="text-hover underline cursor-pointer text-blue-600 capitalize"
        >
          {rowData.phone_ref_value?.name?.toLocaleLowerCase()}
        </span>
        :
        <span className="text-grey-400 capitalize">{rowData.name?.toLocaleLowerCase() || 'N/A'}</span>
    );
  };

  const leaderNameWithLink = (rowData: Donation) => {
    const leader = rowData?.phone_ref_value?.leader_id_ref_value;
    return (
      leader && leader.id ?
        <span
          onClick={() => openDevoteeModal(leader.id)}
          className="text-hover underline cursor-pointer text-blue-600 capitalize"
        >
          {leader.name?.toLocaleLowerCase()}
        </span>
        :
        <span className="text-grey-400">N/A</span>
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

  const formatDonationAmount = (amount: number | null | undefined, withRupeeSymbol?: boolean) => {
    return amount ? (
      withRupeeSymbol ?
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount) :
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
    const allDonations: Donation[] | undefined = await fetchAllDonations();
    if (allDonations && Array.isArray(allDonations) && allDonations.length > 0) {
      const worksheet = XLSX.utils.json_to_sheet(allDonations);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Donations");
      XLSX.writeFile(workbook, `harekrishna_donations_${getCurrentDateDDMMYYYY()}.xlsx`);
    }
  };

  const exportPDF = async () => {
    const allDonations: Donation[] | undefined = await fetchAllDonations();
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

  const onRowEditComplete = async (e: DataTableRowEditCompleteEvent) => {
    const { newData, index } = e;

    if (newData.name && newData.name.length > 100) {
      toast.error('Name must be less than 100 characters');
      return;
    }
    if (newData.phone && newData.phone.length !== 10) {
      toast.error('Phone must be exactly 10 digits');
      return;
    }

    try {
      setInProgress(true);
      let formattedDate = newData.date;
      // If it's a Date object (from Calendar), convert to ISO string for Backend and consistency
      if (newData.date instanceof Date) {
        // Use local time but formatted as ISO or just standard ISO?
        // If we use toISOString(), it converts to UTC.
        // If user selected 25th Dec (Local), 25th Dec 00:00.
        // toISOString might be 24th Dec 18:30 (if IST).
        // Wait, Calendar returns Date object with Local time?
        // Yes, usually.
        // But backend expects what?
        // Backend uses `new Date(str)`.
        // If we send ISO, it parses as that absolute time.
        formattedDate = newData.date.toISOString();
      }

      const payload = {
        date: formattedDate,
        amount: newData.amount,
        name: newData.name,
        phone: newData.phone,
        payment_mode: newData.payment_mode,
        internal_note: newData.internal_note
      };

      const res = await api.put(`/donations/${newData.id}`, payload);

      if (res.data.success) {
        const _donations = [...(donations || [])];
        // merging to keep other fields
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        _donations[index] = { ..._donations[index], ...newData, date: formattedDate as any };
        setDonations(_donations);
        toast.success('Donation updated successfully');
      } else {
        throw new Error(res.data.error || "Update failed");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Update error", error);
      toast.error(error.response?.data?.error || 'Failed to update donation');
    } finally {
      setInProgress(false);
    }
  };

  const textEditor = (options: ColumnEditorOptions) => {
    return <InputText type="text" value={options.value} onChange={(e) => options.editorCallback?.(e.target.value)} />;
  };

  const phoneEditor = (options: ColumnEditorOptions) => {
    return <InputText
      keyfilter="int"
      maxLength={10}
      value={options.value}
      onChange={(e) => options.editorCallback?.(e.target.value)}
    />;
  };

  const amountEditor = (options: ColumnEditorOptions) => {
    return <InputNumber value={options.value} onValueChange={(e) => options.editorCallback?.(e.value)} mode="currency" currency="INR" locale="en-IN" />;
  };

  const paymentModeEditor = (options: ColumnEditorOptions) => {
    const paymentModes = [
      { label: 'Cash', value: 'Cash' },
      { label: 'Transfer', value: 'Transfer' },
      { label: 'Cheque', value: 'Cheque' },
      { label: 'Online', value: 'Online' },
      { label: 'Card', value: 'Card' }
    ];
    return <Dropdown value={options.value} options={paymentModes} onChange={(e) => options.editorCallback?.(e.value)} placeholder="Select Payment Mode" />;
  };

  const dateEditor = (options: ColumnEditorOptions) => {
    let dateVal = options.value;
    if (typeof dateVal === 'string') {
      // Check if it's DD/MM/YYYY (contains slashes)
      if (dateVal.includes('/')) {
        dateVal = parseDateFromStringddmmyyyy(dateVal);
      } else {
        // Assume ISO string
        dateVal = new Date(dateVal);
      }
    }
    return <Calendar value={dateVal} onChange={(e) => options.editorCallback?.(e.value)} dateFormat="dd-mm-yy" showIcon />;
  };


  return (
    <div className="p-2 min-h-screen max-w-screen">
      <strong className="text-general">Donations Dashboard</strong>
      {
        inProgress ?
          <ProgressBar mode="indeterminate" style={{ height: '2px' }} className="pt-1"></ProgressBar>
          :
          <hr />
      }
      <small className="text-general">
        A consolidated place for all the donations data.
        {/* Total Widget */}
        <div
          className="mt-4 bg-yellow-50 text-yellow-900 border-l-4 border-yellow-500 p-4 rounded-lg shadow flex justify-between items-center max-w-md">
          {
            totalDonationsAmount ?
              <div>
                <p className="text-sm">
                  <i className={`pi ${dateRangeValue === 'all' && amountRangeValue === 'all' ? '' : 'pi-filter-fill pr-2'}`}></i>
                  Total <strong>{donationsCount && !inProgress ? donationsCount : '**'}</strong> Donations amounting
                  to</p>
                <p className="text-2xl font-bold">₹ {(totalDonationsAmount && !inProgress ? totalDonationsAmount : '****').toLocaleString("en-IN")}</p>
              </div>
              :
              <div>
                <p className="text-2xl font-bold">No Donations</p>
              </div>
          }
          <Image src="/money-bag.png" alt="money" width="70" height="70" />
        </div>
        <br />
        At your role level, {devotee?.name}, you have the privileges
        to:
        {
          systemRole === SYSTEM_ROLES.admin &&
          <div className="m-5">
            <strong className="text-hover">• Insert</strong> donations data in bulk by uploading Excel sheet in
            specific format:&nbsp;
            <a
              href="/Sample-DONATIONS-Bulk-Data-Upload-Format-For-HareKrishna.app.xlsx"
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
                chooseLabel="Upload Complete DONATIONS Excel file, got from ERP portal"
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
      <form onSubmit={handleSearch} className="p-inputgroup text-sm my-1">
        <span className="p-float-label">
          <InputText id="search-input" maxLength={50}
            value={lazyParams.globalFilter}
            onChange={(e) => {
              // Remove any non-numeric characters from the input
              const value = e.target.value.replace(/[^0-9a-z-A-Z\s]/g, '');
              setLazyParams((prev) => ({ ...prev, globalFilter: value.trim() }));
              msgs.current?.clear();
            }}
          />
          <label
            htmlFor="search-input">Search any donation... 🔍
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
      {/* Devotee Card Modal */}
      <Dialog
        header="Devotee Details"
        visible={showDevoteeModal}
        onHide={() => setShowDevoteeModal(false)}
        className="w-full max-w-lg"
        contentClassName="p-0" // Remove padding to let card fit nicely
      >
        {selectedDevoteeId && (
          <div className="p-3">
            <DevoteeCard devoteeId={selectedDevoteeId} />
          </div>
        )}
      </Dialog>
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
              className={`w-full px-3 py-1 text-sm rounded-full border cursor-pointer ${selectedDateRange === r.value && (!customDateRange || !customDateRange[0] || !customDateRange[1])
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
            tooltip={customDateRange ? dateRangeValue : ''}
            selectionMode="range"
            readOnlyInput
            showIcon
            showButtonBar
            hideOnRangeSelection
            placeholder="Select Date Range"
            onClearButtonClick={clearCustomDateRange}
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
              className={`w-full px-3 py-1 text-sm rounded-full border cursor-pointer ${selectedAmountRange === r.value && (!customAmountRange)
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
                    ₹{(customAmountRange[0] * AMOUNT_RANGE_SLIDER_MULTIPLE).toLocaleString("en-IN")} -
                    ₹{(customAmountRange[1] * AMOUNT_RANGE_SLIDER_MULTIPLE).toLocaleString("en-IN")}
                  </small>
                  :
                  <small>Select ₹ range & click ➡️<span></span></small>
              }
              <Slider value={customAmountRange} onChange={(e: SliderChangeEvent) => setCustomAmountRange(e.value)}
                range className="self-center" />
            </div>
            {
              customAmountRange && Array.isArray(customAmountRange) &&
              <Button
                icon="pi pi-arrow-right animate-pulse"
                className="col-span-2 [zoom:0.7]"
                aria-label="apply"
                size="small"
                onClick={() => fetchDonations()}
              />
            }
          </div>
        </div>
      </Fieldset>
      <p className="text-sm">
        <strong>Note</strong>:&nbsp;Search donation(s) by
        it&apos;s donor&apos;s <strong className="text-hover">name</strong>, <strong className="text-hover">phone
          number</strong>, <strong className="text-hover">donation amount</strong>, <strong className="text-hover">receipt
            number</strong>, with filters within a <strong className="text-hover">date range</strong> and/ or within an <strong
              className="text-hover">amount range</strong>
      </p>
      <br />
      <Messages ref={msgs} />
      {
        donations && Array.isArray(donations) && donations.length > 0 &&
        <div className="card overflow-x-auto mt-4">
          <DataTable
            value={donations}
            editMode="row"
            onRowEditComplete={onRowEditComplete}
            lazy
            paginator
            totalRecords={totalRecords}
            first={lazyParams.first}
            rows={lazyParams.rows}
            loading={inProgress}
            onPage={(e) => {
              setLazyParams({ ...lazyParams, first: e.first });
              fetchDonations();
            }}
            onSort={(e) => {
              setLazyParams({ ...lazyParams, sortField: e.sortField, sortOrder: e.sortOrder! })
              fetchDonations();
            }}
            dataKey="id"
            scrollable
            stripedRows
            size="small"
            sortField={lazyParams.sortField} sortOrder={lazyParams.sortOrder as SortOrder}
          >
            <Column field="date" header="Date" body={dateFormatted} editor={(options) => dateEditor(options)} sortable />
            <Column field="amount" header="Amount" body={amountFormatted} editor={(options) => amountEditor(options)} sortable />
            <Column field="name" header="Donor Name" body={nameWithLink} editor={(options) => textEditor(options)} sortable />
            <Column field="phone" header="Phone No." body={phoneFormatted} editor={(options) => phoneEditor(options)} sortable />
            <Column field="leader" header="Leader" body={leaderNameWithLink} />
            <Column field="donation_receipt_number" header="Receipt" sortable />
            <Column field="payment_mode" header="Payment Mode" editor={(options) => paymentModeEditor(options)} sortable />
            <Column field="internal_note" header="Note" sortable />
            {
              systemRole === SYSTEM_ROLES.admin &&
              <Column rowEditor headerStyle={{ width: '10%', minWidth: '8rem' }} bodyStyle={{ textAlign: 'center' }}></Column>
            }
          </DataTable>
          <hr />
          <small className="text-general">
            <strong>Note:</strong> By default, find the most recent donation first but you can always sort column as
            per your wish by clicking them.
            Click on a&nbsp;
            <a href="javascript:void(0);" rel="noopener noreferrer" className="text-hover underline">
              highlighted
            </a>
            &nbsp;donor name to view their complete details.
          </small>
          <br />
          <br />
          <small className="text-general">
            Donations: {totalRecords}
            {devotee && lazyParams.globalFilter === '' && <span
              className="ml-2"> | Your Donations: {donations?.filter(d => d.phone === devotee.phone).length}</span>}
          </small>
          <hr />
          <br />
          <small className="text-general"><strong>Export as:</strong></small>
          <br />
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
    </div>
  )
}