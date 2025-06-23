'use client'

import { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { FileUpload, FileUploadFilesEvent } from 'primereact/fileupload'
import { DataTable } from 'primereact/datatable'
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [donations, setDonations] = useState<Donation[] | null>([]);
  const [allDonations, setAllDonations] = useState<Donation[] | null>([]);
  const toast = useRef<Toast>(null);
  const msgs = useRef<Messages>(null);

  // If user searched something, we will show search results donations
  const getApplicableDonations = showSearchResults ? donations : allDonations;

  const errorMessageNoDonations = (
    <small>No donations exist. Only an admin can bulk upload donations, exported from ERP portal.</small>
  );
  const errorMessageNoSearchResult = (
    <small>No donations found matching <strong>{searchQuery}</strong>. Showing you all donations instead.</small>
  );

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
        await api.post('/donations/bulk', { donations: json });
        toast.current?.show({
          severity: MessageSeverity.SUCCESS,
          detail: 'New Donations inserted successfully',
          life: 4000
        });
        setInProgress(false);
        setShowBulkUploadDialogue(false);
        fetchDonations();
      } catch {
        setInProgress(false);
        setShowBulkUploadDialogue(false);
        toast.current?.show({
          severity: MessageSeverity.ERROR,
          detail: 'Error inserting donations data',
          life: 4000
        });
      }
    }

    reader.readAsArrayBuffer(file);
    setInProgress(true);
  }

  const formatIntoProperJson = (json: object[]) => {
    const formattedJson: object[] = [];
    // iterate in reverse coz donations are in descending order of date
    for (let i = json.length - 1; i >= 0; i--) {
      const date = _.get(json[i], 'Date');
      const phone = _.get(json[i], 'Contact Number');
      const amount = _.get(json[i], 'Amount');
      const donation = {
        donation_receipt_number: _.get(json[i], 'Donation Receipt Number'),
        name: _.get(json[i], 'Donor Name', ''),
        phone: phone ? `91${phone}` : '',
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
      <span>{formatDateIntoStringddmmyyyy(rowData.date!)}</span>
    );
  };
  const phoneFormatted = (rowData: Donation) => {
    return (
      <span>{rowData.phone?.slice(2)}</span>
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
    fetchDonations();
  }

  async function fetchDonations(query?: string) {
    if (inProgress) return; // Prevent multiple fetches if already in progress

    try {
      setInProgress(true);
      let res = null;
      if (query || searchQuery.trim() !== '') {
        // Fetch donations according to search query
        res = await api.get('/donations', {
          params: {
            query: query?.trim() || searchQuery.trim(),
          },
        });
      } else {
        // Fetch all donations if no query is provided
        res = await api.get('/donations');
      }
      if (res && res.status === 200 && res.data && Array.isArray(res.data) && res.data.length > 0) {
        msgs.current?.clear();
        const donations = formatDonationsData(res.data);
        if (query || searchQuery.trim() !== '') {
          setDonations(donations);
          setShowSearchResults(true); // Show search results
        } else {
          setAllDonations(donations);
          setShowSearchResults(false); // Show all donations
        }
      } else {
        throw new Error('Failed to fetch donations');
      }
    } catch {
      msgs.current?.clear();
      msgs.current?.show({ id: '1', sticky: true, severity: 'error', summary: (query || searchQuery.trim() !== '')? errorMessageNoSearchResult:errorMessageNoDonations, closable: true });
      setDonations(null); // Reset donations to null if there's an error
      setShowSearchResults(false); // Do not show search results, instead show all donations
    } finally {
      setInProgress(false);
    }
  }

  function formatDonationsData(donations: Donation[]) {
    donations.forEach((donation: Donation) => {
      // Ensure date is a Date object if it's not already
      if (typeof donation.date === 'string') {
        donation.date = new Date(donation.date);
      }
    });
    return donations;
  }

  useEffect(() => {
    const queryParamPhone: string | null = searchParams.get('phone');
    if (queryParamPhone && queryParamPhone.length > 0) {
      setSearchQuery(queryParamPhone.slice(2)); // Set search query to passed devotes phone number without country code
      fetchDonations(queryParamPhone.slice(2));
    } else {
      fetchDonations();
    }
  }, [searchParams]);

  return (
    <div className="p-3 mih-h-screen">
      <strong className="text-general">Donations Dashboard</strong>
      {
        inProgress ?
          <ProgressBar mode="indeterminate" style={{ height: '2px' }} className="pt-1"></ProgressBar>
          :
          <hr />
      }
      <small className="text-general">
        A consolidated place for all the donations data. At your role level, {devotee?.name}, you have the privileges to:
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
          <strong className="text-hover">• View</strong> all the donations data.
        </div>
      </small>
      <form onSubmit={handleSearch} className="p-inputgroup text-sm px-5 my-1">
        <span className="p-float-label">
          <InputText id="search-input" required maxLength={50}
            value={searchQuery}
            onChange={(e) => {
              // Remove any non-numeric characters from the input
              const value = e.target.value.replace(/[^0-9a-zA-Z\s]/g, '');
              setSearchQuery(value);
              msgs.current?.clear();
              if (value.trim() === '') {
                if (!allDonations || allDonations.length === 0) {
                  fetchDonations();
                } else {
                  setShowSearchResults(false);
                }
              }
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
      {/* {searchQuery && (
        <Button
          onClick={() => {
            setSearchQuery('');
            if (!allDonations || allDonations.length === 0) {
              fetchDonations();
            } else {
              setShowSearchResults(false);
            }
          }}
          icon="pi pi-times-circle"
          rounded
          text
          severity="contrast"
          title="Clear Search"
          className="flex float-right bottom-[48px] right-[40px] z-1 text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        />
      )} */}
      <small className="px-5">
        <strong>Note:</strong>&nbsp;You can search a donation by it&apos;s id, donation_receipt_number, phone number of
        donor, name of donor, or donation amount
      </small>
      <Messages ref={msgs} />
      {
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
      }
      <Toast ref={toast} position="bottom-center" />
    </div>
  )
}